import { GameState } from "~/types/appTypes";
import { SocketType } from "~/types/socketTypes";

// Connection states as a proper TypeScript enum
enum ConnectionState {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    RECONNECTING = "reconnecting",
}

export const useWebSocketStore = defineStore("websocket", () => {
    // Core state
    const connection = shallowRef<WebSocket | null>(null);
    const state = ref<ConnectionState>(ConnectionState.DISCONNECTED);
    const lobbyId = ref<string | null>(null);
    const wasConnectedBeforeOffline = ref(false);
    const networkOnline = ref(navigator.onLine); // Track network status internally

    // Initialize the reconnection service
    const reconnectionService = createReconnectionService(
        state as Ref<string>, // Cast to string ref since the service only cares about string values
        networkOnline,
        wasConnectedBeforeOffline
    );

    // Create the ping monitor service (replacing heartbeat service)
    const pingMonitorService = createPingMonitorService(
        connection,
        state as Ref<string>,
        (id) => {
            reconnectionService.attemptReconnection(connect, id);
        },
        lobbyId
    );

    const connect = async (id: string): Promise<void> => {
        console.debug("Attempting to connect to WebSocket with lobby ID:", id);

        // Store lobby ID for connection and potential reconnections
        lobbyId.value = id;

        // Skip if already connected
        if (connection.value?.readyState === WebSocket.OPEN) {
            console.info("WebSocket already connected");
            return;
        }

        // Don't attempt connection if we're offline
        if (!navigator.onLine) {
            console.warn("Device is offline, cannot establish WebSocket connection");
            state.value = ConnectionState.DISCONNECTED;
            wasConnectedBeforeOffline.value = true; // Mark to attempt reconnection when back online
            return Promise.reject(new Error("Device is offline"));
        }

        // Terminate any existing connection
        disconnect();

        // Setup network listeners when connecting
        networkUtils.setupNetworkListeners();

        return new Promise<void>((resolve, reject) => {
            try {
                // Get auth token
                const token = useCookie("saved_token").value;
                if (!token || typeof token !== "string") {
                    state.value = ConnectionState.DISCONNECTED;
                    console.error("Authentication token unavailable");
                    reject(new Error("Authentication token unavailable"));
                    return;
                }

                // Update connection state
                state.value = ConnectionState.CONNECTING;
                console.debug("Connecting to WebSocket...");

                // Create new connection using utility for URL building
                const url = buildWebSocketUrl(id);
                console.debug("WebSocket URL:", url);
                connection.value = new WebSocket(url, ["json", token]);

                // Set up one-time handlers specifically for this Promise
                connection.value.addEventListener(
                    "open",
                    function onOpen() {
                        console.info("WebSocket connection opened");
                        connection.value?.removeEventListener("open", onOpen);
                        resolve();
                    },
                    { once: true }
                );

                connection.value.addEventListener(
                    "error",
                    function onError(event) {
                        console.error("WebSocket connection error:", event);
                        connection.value?.removeEventListener("error", onError);
                        reject(new Error("WebSocket connection failed"));
                    },
                    { once: true }
                );

                // Set up regular event handlers for ongoing connection management
                setupEventListeners();
            } catch (error) {
                console.error("Failed to establish WebSocket connection:", error);
                state.value = ConnectionState.DISCONNECTED;
                reject(error);
            }
        });
    };

    const disconnect = (removeListeners: boolean = true): void => {
        // Stop the ping monitoring
        pingMonitorService.stopMonitoring();

        // Cancel any pending reconnection attempts
        reconnectionService.cancelReconnection();

        if (connection.value) {
            // Remove event listeners to avoid memory leaks
            connection.value.onopen = null;
            connection.value.onclose = null;
            connection.value.onmessage = null;
            connection.value.onerror = null;

            // Close connection if not already closed
            if (connection.value.readyState !== WebSocket.CLOSED && connection.value.readyState !== WebSocket.CLOSING) {
                connection.value.close();
            }

            connection.value = null;
        }

        state.value = ConnectionState.DISCONNECTED;

        // Remove network listeners if requested (default)
        if (removeListeners) {
            networkUtils.removeNetworkListeners();
            wasConnectedBeforeOffline.value = false;
        }

        console.log("WebSocket connection closed");
    };

    // Event handlers
    const setupEventListeners = (): void => {
        if (!connection.value) return;

        connection.value.onopen = handleOpen;
        connection.value.onclose = handleClose;
        connection.value.onmessage = handleMessage;
        connection.value.onerror = handleError;
    };

    const handleOpen = (): void => {
        console.info("WebSocket connection established");
        state.value = ConnectionState.CONNECTED;

        // Reset reconnection attempts counter when successfully connected
        reconnectionService.resetAttempts();

        // Start monitoring for server pings
        pingMonitorService.startMonitoring();
    };

    const handleMessage = (event: MessageEvent): void => {
        try {
            const data = JSON.parse(event.data);
            console.log("Parsed WebSocket message:", data);

            // Handle ping command from server
            if (data.command === "ping") {
                pingMonitorService.handlePing();
                return;
            }

            // Process game-related messages
            processMessage(data);
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    };

    const handleClose = (event: CloseEvent): void => {
        // Stop ping monitoring when connection closes
        pingMonitorService.stopMonitoring();

        console.info(`WebSocket connection closed: ${event.code} ${event.reason}`);

        // Only attempt reconnection if the connection wasn't closed cleanly
        if (!event.wasClean && lobbyId.value) {
            // Use reconnection service to handle reconnection
            reconnectionService.attemptReconnection(connect, lobbyId.value);
        } else {
            state.value = ConnectionState.DISCONNECTED;
        }
    };

    const handleError = (event: Event): void => {
        console.error("WebSocket connection error:", event);
        // The connection will be closed automatically after an error event
        // handleClose will be called next
    };

    // Message handling
    const processMessage = (data: any): void => {
        const { type } = data;

        if (!type || !Object.values(SocketType).includes(type as SocketType)) {
            console.warn(`Unknown socket message type: ${type}`);
            return;
        }

        const handler = messageHandlers[type as SocketType];
        if (handler) {
            handler(data);
        } else {
            console.warn(`No handler registered for message type: ${type}`);
        }
    };

    // Public API for sending messages
    const sendMessage = (message: any): void => {
        if (connection.value?.readyState !== WebSocket.OPEN) {
            console.error("Cannot send message: WebSocket is not open", message);
            return;
        }

        try {
            connection.value.send(JSON.stringify(message));
        } catch (error) {
            console.error("Failed to send WebSocket message:", error, message);
        }
    };

    // Network utilities
    const networkUtils = createNetworkUtils(
        networkOnline,
        // Handle offline callback
        () => {
            wasConnectedBeforeOffline.value = state.value === ConnectionState.CONNECTED || state.value === ConnectionState.RECONNECTING;

            // Cancel any pending reconnection attempts since they'll fail
            reconnectionService.cancelReconnection();

            // Don't close the socket immediately, let the heartbeat mechanism detect the issue
            // This prevents unnecessarily closing the socket during brief connectivity blips
            if (connection.value && connection.value.readyState === WebSocket.OPEN) {
                console.info("Connection open during offline event, will wait for heartbeat failure");
            }
        },
        // Handle online callback
        () => {
            // Only attempt to reconnect if we were previously connected or reconnecting
            if (wasConnectedBeforeOffline.value && lobbyId.value) {
                console.info("Attempting to restore WebSocket connection after coming online");

                // Small delay to ensure network is fully restored
                setTimeout(() => {
                    if (connection.value?.readyState !== WebSocket.OPEN) {
                        // If we were in RECONNECTING state, continue from where we left off
                        if (state.value === ConnectionState.RECONNECTING) {
                            reconnectionService.attemptReconnection(connect, lobbyId.value);
                        } else {
                            // Otherwise try a fresh connection
                            if (lobbyId.value) {
                                connect(lobbyId.value).catch((error) => {
                                    console.error("Failed to reconnect after coming online:", error);
                                    // If initial reconnect fails, start the reconnection process
                                    if (lobbyId.value) {
                                        reconnectionService.attemptReconnection(connect, lobbyId.value);
                                    }
                                });
                            }
                        }
                    }
                }, 1000);
            }
        }
    );

    /**
     * Build WebSocket URL from API configuration
     */
    const buildWebSocketUrl = (id: string): string => {
        const endpoint = useAppStore().backendEndpoint;

        // Convert http(s):// to ws(s)://
        const apiUrl = endpoint.replace(/(http)(s)?:\/\//, "ws$2://");
        return `${apiUrl}/lobbySocket?id=${encodeURIComponent(id)}`;
    };

    return {
        // Expose connection state as readonly
        connectionState: computed(() => state.value),

        // Public methods
        connect,
        disconnect,
        sendMessage,

        // For debugging/development
        isConnected: computed(() => state.value === ConnectionState.CONNECTED),
        isOnline: computed(() => networkOnline.value),
    };
});
