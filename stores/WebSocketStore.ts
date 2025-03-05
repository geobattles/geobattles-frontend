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

    // Reconnection configuration
    const reconnectConfig = {
        maxAttempts: 10,
        baseDelay: 2000,
        currentAttempts: 0,
        timerId: null as number | null,
    };

    // Heartbeat configuration
    const heartbeatConfig = {
        pingInterval: 5000,
        pongTimeout: 5000,
        pingTimerId: null as number | null,
        pongTimerId: null as number | null,
    };

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
        setupNetworkListeners();

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

                // Create new connection
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
        stopHeartbeat();
        cancelReconnection();

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
            removeNetworkListeners();
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
        reconnectConfig.currentAttempts = 0;
        startHeartbeat();
    };

    const handleMessage = (event: MessageEvent): void => {
        try {
            const data = JSON.parse(event.data);
            console.log("Parsed WebSocket message:", data);

            // Handle heartbeat response
            if (data.type === "PONG") {
                resetPongTimer();
                return;
            }

            // Process game-related messages
            processMessage(data);
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    };

    const handleClose = (event: CloseEvent): void => {
        stopHeartbeat();
        console.info(`WebSocket connection closed: ${event.code} ${event.reason}`);

        // Only attempt reconnection if the connection wasn't closed cleanly
        // and we're in a game session
        const gameState = useGameMode().modeLogic.currentState;
        if (!event.wasClean && gameState === GameState.PLAYING && lobbyId.value) {
            attemptReconnection();
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

    // Heartbeat mechanism
    const startHeartbeat = (): void => {
        stopHeartbeat(); // Clear any existing timers

        // Start regular ping interval
        sendPing();
        heartbeatConfig.pingTimerId = window.setInterval(sendPing, heartbeatConfig.pingInterval);
    };

    const stopHeartbeat = (): void => {
        if (heartbeatConfig.pingTimerId !== null) {
            clearInterval(heartbeatConfig.pingTimerId);
            heartbeatConfig.pingTimerId = null;
        }

        if (heartbeatConfig.pongTimerId !== null) {
            clearTimeout(heartbeatConfig.pongTimerId);
            heartbeatConfig.pongTimerId = null;
        }
    };

    const sendPing = (): void => {
        if (!connection.value || connection.value.readyState !== WebSocket.OPEN) return;

        connection.value.send(JSON.stringify({ command: "ping" }));
        startPongTimer();
    };

    const startPongTimer = (): void => {
        resetPongTimer();

        heartbeatConfig.pongTimerId = window.setTimeout(() => {
            console.warn("No pong response received - connection may be lost");
            connection.value?.close();
            // handleClose will handle reconnection
        }, heartbeatConfig.pongTimeout);
    };

    const resetPongTimer = (): void => {
        if (heartbeatConfig.pongTimerId !== null) {
            clearTimeout(heartbeatConfig.pongTimerId);
            heartbeatConfig.pongTimerId = null;
        }
    };

    // Reconnection logic
    const attemptReconnection = (): void => {
        // Don't try to reconnect if we've reached max attempts
        if (reconnectConfig.currentAttempts >= reconnectConfig.maxAttempts) {
            console.warn("Maximum reconnection attempts reached");
            state.value = ConnectionState.DISCONNECTED;
            return;
        }

        // Don't attempt reconnection if we're offline
        if (!networkOnline.value) {
            console.warn("Device is offline, pausing reconnection attempts");
            state.value = ConnectionState.RECONNECTING; // Keep in reconnecting state
            wasConnectedBeforeOffline.value = true; // Mark for reconnection when back online
            return; // Don't schedule any reconnection attempts
        }

        // Cancel any pending reconnection attempt
        cancelReconnection();

        // Update state and attempt count
        state.value = ConnectionState.RECONNECTING;
        reconnectConfig.currentAttempts++;

        // Calculate backoff delay with exponential factor
        const delay = reconnectConfig.baseDelay * Math.pow(1.5, reconnectConfig.currentAttempts - 1);

        console.info(`Attempting reconnection ${reconnectConfig.currentAttempts}/${reconnectConfig.maxAttempts} in ${delay}ms`);

        // Schedule reconnection attempt
        reconnectConfig.timerId = window.setTimeout(() => {
            if (lobbyId.value) {
                // Double-check we're still online before attempting
                if (!networkOnline.value) {
                    console.warn("Network went offline during reconnection delay");
                    return;
                }

                connect(lobbyId.value).catch((error) => {
                    console.error("Reconnection attempt failed:", error);
                    // Only try again if we're still online
                    if (networkOnline.value) {
                        attemptReconnection(); // Try again with increasing backoff
                    }
                });
            } else {
                state.value = ConnectionState.DISCONNECTED;
            }
        }, delay);
    };

    const cancelReconnection = (): void => {
        if (reconnectConfig.timerId !== null) {
            clearTimeout(reconnectConfig.timerId);
            reconnectConfig.timerId = null;
        }
    };

    // Utility functions
    const buildWebSocketUrl = (id: string): string => {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) {
            throw new Error("Backend API configuration not available");
        }

        // Convert http(s):// to ws(s)://
        const apiUrl = backendAPI.replace(/(http)(s)?:\/\//, "ws$2://");
        return `${apiUrl}/lobbySocket?id=${encodeURIComponent(id)}`;
    };

    // Public API
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

    // Network status handlers
    const handleOffline = (): void => {
        console.warn("Device went offline, suspending WebSocket connection");
        networkOnline.value = false; // Set our internal state
        wasConnectedBeforeOffline.value = state.value === ConnectionState.CONNECTED || state.value === ConnectionState.RECONNECTING;

        // Cancel any pending reconnection attempts since they'll fail
        cancelReconnection();

        // Don't close the socket immediately, let the heartbeat mechanism detect the issue
        // This prevents unnecessarily closing the socket during brief connectivity blips
        if (connection.value && connection.value.readyState === WebSocket.OPEN) {
            console.info("Connection open during offline event, will wait for heartbeat failure");
        }
    };

    const handleOnline = (): void => {
        console.info("Device back online, checking WebSocket connection");
        networkOnline.value = true; // Set our internal state

        // Only attempt to reconnect if we were previously connected or reconnecting
        if (wasConnectedBeforeOffline.value && lobbyId.value) {
            console.info("Attempting to restore WebSocket connection after coming online");

            // Small delay to ensure network is fully restored
            setTimeout(() => {
                if (connection.value?.readyState !== WebSocket.OPEN) {
                    // If we were in RECONNECTING state, continue from where we left off
                    if (state.value === ConnectionState.RECONNECTING) {
                        attemptReconnection();
                    } else {
                        // Otherwise try a fresh connection
                        connect(lobbyId.value!).catch((error) => {
                            console.error("Failed to reconnect after coming online:", error);
                            // If initial reconnect fails, start the reconnection process
                            attemptReconnection();
                        });
                    }
                }
            }, 1000);
        }
    };

    // Setup and remove network status listeners
    const setupNetworkListeners = (): void => {
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
    };

    const removeNetworkListeners = (): void => {
        console.log("Removing NETWORK status listeners");

        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
    };

    // When component using the store is unmounted
    onUnmounted(() => {
        disconnect();
    });

    return {
        // Expose connection state as readonly
        connectionState: computed(() => state.value),

        // Public methods
        connect,
        disconnect,
        sendMessage,

        // For debugging/development
        isConnected: computed(() => state.value === ConnectionState.CONNECTED),
        isOnline: computed(() => networkOnline.value), // Use our internal tracker instead
    };
});
