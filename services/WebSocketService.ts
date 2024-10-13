import { SocketType } from "~/types/socketTypes"; // Adjust the path according to your project structure

export class WebSocketService {
    private socket: WebSocket | null = null;
    private isConnected: boolean = false;
    private isReconnecting: boolean = false;
    private reconnectAttempts = 0;
    private reconnectTimeout: number | null = null;
    private pingTimeout: number | null = null;
    private pongTimeout: number | null = null;

    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private readonly INITIAL_RECONNECT_DELAY = 1000;
    private readonly PING_INTERVAL = 15000;
    private readonly PONG_TIMEOUT = 10000;

    constructor(private getSocketUrl: () => string) {}

    connect(): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(this.getSocketUrl());
            this.socket = socket;

            socket.onopen = this.handleOpen.bind(this, resolve);
            socket.onmessage = this.handleMessage.bind(this);
            socket.onclose = this.handleClose.bind(this);
            socket.onerror = this.handleError.bind(this, reject);
        });
    }

    private handleOpen(resolve: (value: WebSocket | PromiseLike<WebSocket>) => void) {
        console.log("WebSocket connection established");
        this.setConnected(true);
        this.reconnectAttempts = 0;
        this.waitForPing();
        resolve(this.socket!);
    }

    private handleMessage(event: MessageEvent) {
        const data = JSON.parse(event.data);
        console.log("RECEIVED SOCKET MESSAGE:", data); //! Dev
        if (data.type === "ping") {
            this.sendPong();
            this.waitForPing();
        } else {
            // Handle other message types
            this.parseSocketMessage(data);
        }
    }

    private handleClose(event: CloseEvent) {
        console.log("WebSocket connection closed");
        this.setConnected(false);
        this.clearTimeouts();
        if (!event.wasClean) {
            this.attemptReconnect();
        }
    }

    private handleError(reject: (reason?: any) => void, event: Event) {
        console.error("WebSocket error:", event);
        this.setConnected(false);
        reject(event);
    }

    private waitForPing() {
        // TODO: Implement ping/pong mechanism from server
        // this.clearTimeouts()
        // this.pingTimeout = window.setTimeout(() => {
        //   console.log("No ping received, considering connection lost")
        //   this.socket?.close()
        // }, this.PING_INTERVAL + this.PONG_TIMEOUT)
    }

    private sendPong() {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "pong" }));
        }
    }

    private clearTimeouts() {
        if (this.pingTimeout) clearTimeout(this.pingTimeout);
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            this.setReconnecting(true);
            console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.MAX_RECONNECT_ATTEMPTS}`);
            const delay = this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);
            this.reconnectTimeout = window.setTimeout(() => this.connect(), delay);
        } else {
            console.log("Max reconnection attempts reached. Stopping reconnection.");
            this.setReconnecting(false);
        }
    }

    private parseSocketMessage(data: any) {
        const type = data.type;
        if (this.isValidSocketType(type)) {
            const handler = messageHandlers[type]; // messageHandlers is defined in composables/socket_handlers.ts
            if (handler) {
                handler(data);
            } else {
                console.warn(`No handler for socket message type: ${data.type}`);
            }
        } else {
            console.warn(`Unknown socket message type: ${data.type}`);
        }
    }

    private isValidSocketType(type: string): type is SocketType {
        return Object.values(SocketType).includes(type as SocketType);
    }

    static getSocketUrl(lobbyId: string, playerName: string): string {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) throw new Error("Backend API is undefined");
        const apiUrl = backendAPI.replace(/(http)(s)?:\/\//, "ws$2://");
        return `${apiUrl}/lobbySocket?id=${encodeURIComponent(lobbyId)}&name=${encodeURIComponent(playerName)}`;
    }

    send(message: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error("WebSocket is not open. Cannot send message:", message);
        }
    }

    close() {
        this.socket?.close();
        this.socket = null;
    }

    private setConnected(status: boolean) {
        this.isConnected = status;
        this.isReconnecting = false;
    }

    private setReconnecting(status: boolean) {
        this.isReconnecting = status;
    }

    getConnectionStatus(): "connected" | "reconnecting" | "disconnected" {
        if (this.isConnected) return "connected";
        if (this.isReconnecting) return "reconnecting";
        return "disconnected";
    }
}
