import { SocketType } from "~/types/socketTypes";

enum ConnectionStatus {
    Connected = "connected",
    Reconnecting = "reconnecting",
    Disconnected = "disconnected",
}

export const useWebSocketStore = defineStore("web_socket_store", () => {
    // Main WebSocket object
    const socket: Ref<WebSocket | null> = ref(null);

    // Socket connection status
    const connectionStatus = ref(ConnectionStatus.Disconnected);
    const reconnectAttempts = ref(0);

    const MAX_RECONNECT_ATTEMPTS = 5;
    const INITIAL_RECONNECT_DELAY = 2000;
    let reconnectTimeout: number | null = null;

    // Ping variables
    const PING_INTERVAL = 5000;
    const PONG_TIMEOUT = 5000;
    let pingIntervalId: number | null = null;
    let pongTimeoutId: number | null = null;

    // Lobby
    const connectionID: Ref<string | null> = ref(null);

    /**
     * Initializes WebSocket connection
     * @param lobbyId
     */
    const initWebSocket = async (lobbyId: string) => {
        // Save connection ID as lobby ID
        connectionID.value = lobbyId;

        // Connect to Server
        await connect();
    };

    /**
     * Connects web socket
     * @returns A promise that resolves to the WebSocket object when the connection is established.
     */
    const connect = (): Promise<WebSocket> => {
        if (!socket) return Promise.reject("Socket is not initialized");

        return new Promise((resolve, reject) => {
            // Read Authentication Token
            const authToken = useCookie("saved_token").value;
            if (!authToken || typeof authToken !== "string") return reject("No valid auth token found");

            // Create new WebSocket
            socket.value = new WebSocket(getSocketUrl(), ["json", authToken]);

            // Define socket events
            socket.value.onopen = () => handleOpen(resolve);
            socket.value.onmessage = (event) => handleMessage(event);
            socket.value.onclose = (event) => handleClose(event);
            socket.value.onerror = (event) => handleError(reject, event);
        });
    };

    /**
     * Handles the WebSocket open event.
     * @param resolve The resolve function of the promise.
     */
    const handleOpen = (resolve: (value: WebSocket | PromiseLike<WebSocket>) => void): void => {
        connectionStatus.value = ConnectionStatus.Connected;
        reconnectAttempts.value = 0;
        startPinging();
        resolve(socket.value as WebSocket);
    };

    /**
     * Handles the WebSocket message event.
     * @param event The message event.
     */
    const handleMessage = (event: MessageEvent): void => {
        const data = JSON.parse(event.data);
        console.log("RECEIVED SOCKET MESSAGE:", data); //! Dev

        // Handle PONG message type
        if (data.type === "PONG") {
            if (pongTimeoutId !== null) {
                clearTimeout(pongTimeoutId);
                pongTimeoutId = null;
            }
        } else {
            // Handle other message types
            parseSocketMessage(data);
        }
    };

    /**
     * Handles the WebSocket close event.
     * @param event The close event.
     */
    const handleClose = (event: CloseEvent): void => {
        console.info("WebSocket connection closed");
        stopPinging();
        if (!event.wasClean) attemptReconnect();
        else connectionStatus.value = ConnectionStatus.Disconnected;
    };

    /**
     * Handles the WebSocket error event.
     * @param reject The reject function of the promise.
     * @param event The error event.
     */
    const handleError = (reject: (reason?: any) => void, event: Event): void => {
        connectionStatus.value = ConnectionStatus.Disconnected;
        console.error("WebSocket error:", event);
        reject(event);
    };

    const startPinging = () => {
        stopPinging(); // Clear any existing intervals
        sendPing(); // Send the first ping immediately
        pingIntervalId = window.setInterval(() => sendPing(), PING_INTERVAL);
    };

    const stopPinging = () => {
        if (pingIntervalId !== null) {
            clearInterval(pingIntervalId);
            pingIntervalId = null;
        }
        if (pongTimeoutId !== null) {
            clearTimeout(pongTimeoutId);
            pongTimeoutId = null;
        }
    };

    const sendPing = () => {
        if (socket && socket.value?.readyState === WebSocket.OPEN) {
            socket.value.send(JSON.stringify({ command: "ping" }));
            waitForPong();
        }
    };

    const waitForPong = () => {
        if (pongTimeoutId !== null) {
            clearTimeout(pongTimeoutId);
        }
        pongTimeoutId = window.setTimeout(() => {
            console.warn("No pong received, considering connection lost");
            socket.value?.close();
            // Attempt to reconnect after closing the connection
            attemptReconnect();
        }, PONG_TIMEOUT);
    };

    const parseSocketMessage = (data: any) => {
        const type = data.type;
        if (isValidSocketType(type)) {
            const handler = messageHandlers[type]; // Define messageHandlers accordingly
            if (handler) {
                handler(data);
            } else {
                console.warn(`No handler for socket message type: ${type}`);
            }
        } else {
            console.warn(`Unknown socket message type: ${type}`);
        }
    };

    const isValidSocketType = (type: string): type is SocketType => {
        return Object.values(SocketType).includes(type as SocketType);
    };

    const sendMessage = (message: any) => {
        if (socket.value?.readyState === WebSocket.OPEN) socket.value.send(JSON.stringify(message));
        else console.error("WebSocket is not open. Cannot send message:", message);
    };

    /**
     * Closes the WebSocket connection.
     */
    const closeConnection = () => {
        stopPinging();
        socket.value?.close();
        socket.value = null;
        connectionStatus.value = ConnectionStatus.Disconnected;
    };

    const attemptReconnect = () => {
        if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts.value++;
            connectionStatus.value = ConnectionStatus.Reconnecting;

            console.log(`Reconnection attempt ${reconnectAttempts.value} of ${MAX_RECONNECT_ATTEMPTS}`);

            // Set delay and try to reconnect
            const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.value - 1);
            reconnectTimeout = window.setTimeout(() => connect(), delay);
        } else {
            console.log("Max reconnection attempts reached. Stopping reconnection.");
            connectionStatus.value = ConnectionStatus.Disconnected;
        }
    };

    /**
     * @returns The WebSocket URL.
     */
    const getSocketUrl = (): string => {
        // Backed API URL check
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) throw new Error("Backend API is undefined");
        const apiUrl = backendAPI.replace(/(http)(s)?:\/\//, "ws$2://");

        // Connection ID check
        if (!connectionID.value) throw new Error("Connection ID in WebSocketStore is null or undefined");
        return `${apiUrl}/lobbySocket?id=${encodeURIComponent(connectionID.value)}`;
    };

    return { connectionStatus: readonly(connectionStatus), initWebSocket, sendMessage, closeConnection };
});
