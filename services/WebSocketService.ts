import { SocketType } from "~/types/socketTypes";

/**
 * Enum representing the connection status of the WebSocket.
 */
enum ConnectionStatus {
    Connected = "connected",
    Reconnecting = "reconnecting",
    Disconnected = "disconnected",
}

/**
 * Service for managing WebSocket connections, including automatic reconnection,
 * ping/pong heartbeat, and message handling.
 */
export class WebSocketService {
    private socket: WebSocket | null = null;
    private connectionStatus: ConnectionStatus = ConnectionStatus.Disconnected;
    private reconnectAttempts = 0;
    private reconnectTimeout: number | null = null;
    private pingIntervalId: number | null = null;
    private pongTimeoutId: number | null = null;

    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private readonly INITIAL_RECONNECT_DELAY = 2000; // milliseconds
    private readonly PING_INTERVAL = 5000; // milliseconds
    private readonly PONG_TIMEOUT = 5000; // milliseconds

    /**
     * Creates an instance of WebSocketService.
     * @param getSocketUrl A function that returns the WebSocket URL.
     */
    constructor(private getSocketUrl: () => string) {}

    /**
     * Initiates the WebSocket connection.
     * @returns A promise that resolves to the WebSocket object when the connection is established.
     */
    connect(): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            const authToken = useCookie("saved_token").value;
            if (!authToken || typeof authToken !== "string") {
                return reject("No valid auth token found");
            }
            this.socket = new WebSocket(this.getSocketUrl(), ["json", authToken]);

            this.socket.onopen = () => this.handleOpen(resolve);
            this.socket.onmessage = (event) => this.handleMessage(event);
            this.socket.onclose = (event) => this.handleClose(event);
            this.socket.onerror = (event) => this.handleError(reject, event);
        });
    }

    /**
     * Handles the WebSocket open event.
     * @param resolve The resolve function of the connection promise.
     */
    private handleOpen(resolve: (value: WebSocket | PromiseLike<WebSocket>) => void) {
        console.log("WebSocket connection established");
        this.connectionStatus = ConnectionStatus.Connected;
        this.reconnectAttempts = 0;
        this.startPinging();
        resolve(this.socket!);
    }

    /**
     * Starts the ping interval to send heartbeat messages to the server.
     */
    private startPinging() {
        this.stopPinging(); // Clear any existing intervals
        this.sendPing(); // Send the first ping immediately
        this.pingIntervalId = window.setInterval(() => {
            this.sendPing();
        }, this.PING_INTERVAL);
    }

    /**
     * Stops the ping interval and clears any pong timeouts.
     */
    private stopPinging() {
        if (this.pingIntervalId !== null) {
            clearInterval(this.pingIntervalId);
            this.pingIntervalId = null;
        }
        if (this.pongTimeoutId !== null) {
            clearTimeout(this.pongTimeoutId);
            this.pongTimeoutId = null;
        }
    }

    /**
     * Sends a ping message to the server and awaits a pong response.
     */
    private sendPing() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ command: "ping" }));
            this.waitForPong();
        }
    }

    /**
     * Sets a timeout waiting for a pong response from the server.
     */
    private waitForPong() {
        if (this.pongTimeoutId !== null) {
            clearTimeout(this.pongTimeoutId);
        }
        this.pongTimeoutId = window.setTimeout(() => {
            console.warn("No pong received, considering connection lost");
            this.socket?.close();
            // Attempt to reconnect after closing the connection
            this.attemptReconnect();
        }, this.PONG_TIMEOUT);
    }

    /**
     * Handles incoming WebSocket messages.
     * @param event The message event containing the data from the server.
     */
    private handleMessage(event: MessageEvent) {
        const data = JSON.parse(event.data);
        console.log("RECEIVED SOCKET MESSAGE:", data);
        if (data.type === "PONG") {
            if (this.pongTimeoutId !== null) {
                clearTimeout(this.pongTimeoutId);
                this.pongTimeoutId = null;
            }
        } else {
            // Handle other message types
            this.parseSocketMessage(data);
        }
    }

    /**
     * Handles the WebSocket close event.
     * @param event The close event containing information about the closure.
     */
    private handleClose(event: CloseEvent) {
        console.log("WebSocket connection closed");
        this.stopPinging();
        if (!event.wasClean) {
            this.attemptReconnect();
        } else {
            this.connectionStatus = ConnectionStatus.Disconnected;
        }
    }

    /**
     * Handles WebSocket errors.
     * @param reject The reject function of the connection promise.
     * @param event The error event.
     */
    private handleError(reject: (reason?: any) => void, event: Event) {
        console.error("WebSocket error:", event);
        this.connectionStatus = ConnectionStatus.Disconnected;
        this.stopPinging();
        this.attemptReconnect();
        reject(event);
    }

    /**
     * Attempts to reconnect the WebSocket connection with exponential backoff.
     */
    private attemptReconnect() {
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            this.connectionStatus = ConnectionStatus.Reconnecting;
            console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.MAX_RECONNECT_ATTEMPTS}`);
            const delay = this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);
            this.reconnectTimeout = window.setTimeout(() => this.connect(), delay);
        } else {
            console.log("Max reconnection attempts reached. Stopping reconnection.");
            this.connectionStatus = ConnectionStatus.Disconnected;
        }
    }

    /**
     * Parses and handles the socket message based on its type.
     * @param data The data received from the server.
     */
    private parseSocketMessage(data: any) {
        const type = data.type;
        if (this.isValidSocketType(type)) {
            const handler = messageHandlers[type]; // Define messageHandlers accordingly
            if (handler) {
                handler(data);
            } else {
                console.warn(`No handler for socket message type: ${type}`);
            }
        } else {
            console.warn(`Unknown socket message type: ${type}`);
        }
    }

    /**
     * Validates whether the given type is a valid SocketType.
     * @param type The message type to validate.
     * @returns True if the type is valid, false otherwise.
     */
    private isValidSocketType(type: string): type is SocketType {
        return Object.values(SocketType).includes(type as SocketType);
    }

    /**
     * Sends a message to the server through the WebSocket.
     * @param message The message object to send.
     */
    send(message: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error("WebSocket is not open. Cannot send message:", message);
        }
    }

    /**
     * Closes the WebSocket connection.
     */
    close() {
        this.stopPinging();
        this.socket?.close();
        this.socket = null;
        this.connectionStatus = ConnectionStatus.Disconnected;
    }

    /**
     * Retrieves the current connection status.
     * @returns The current ConnectionStatus.
     */
    getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    /**
     * Static method to construct the WebSocket URL.
     * @param lobbyId The lobby ID to connect to.
     * @param playerName The player's name.
     * @returns The constructed WebSocket URL string.
     */
    static getSocketUrl(lobbyId: string, playerName: string): string {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) throw new Error("Backend API is undefined");
        const apiUrl = backendAPI.replace(/(http)(s)?:\/\//, "ws$2://");
        return `${apiUrl}/lobbySocket?id=${encodeURIComponent(lobbyId)}&name=${encodeURIComponent(playerName)}`;
    }
}
