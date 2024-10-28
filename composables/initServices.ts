import { WebSocketService } from "../services/WebSocketService";
import { UIManager } from "../services/UIManager";
import type { GameType } from "~/types";
import { GameFlowManager } from "../services/GameFlowManager";
import { AuthenticationService } from "../services/AuthenticationService";

// --------- WEB SOCKET SERVICE --------- //
export const useWebSocketService = () => useState<WebSocketService | null>("webSocketService", () => null);

export const useWebSocket = () => {
    const webSocketService = useWebSocketService();
    const connectionStatus = ref<"connected" | "reconnecting" | "disconnected">("disconnected");

    const initializeWebSocket = async (getSocketUrl: () => string) => {
        webSocketService.value = new WebSocketService(getSocketUrl);
        await webSocketService.value.connect();
        updateConnectionStatus();
    };

    const sendMessage = (message: any) => {
        webSocketService.value?.send(message);
    };

    const closeConnection = () => {
        webSocketService.value?.close();
        webSocketService.value = null;
        connectionStatus.value = "disconnected";
    };

    const updateConnectionStatus = () => {
        if (webSocketService.value) {
            connectionStatus.value = webSocketService.value.getConnectionStatus();
        }
    };

    // Set up an interval to periodically update the connection status
    setInterval(updateConnectionStatus, 1000);

    return {
        webSocketService: readonly(webSocketService),
        initializeWebSocket,
        sendMessage,
        closeConnection,
        connectionStatus: readonly(connectionStatus),
    };
};

// --------- AUTHENTICATION SERVICE --------- //
export const useAuthenticationService = () => useState<AuthenticationService>("authenticationService", () => new AuthenticationService(useRouter()));

// --------- GAMEFLOW MANAGER SERVICE --------- //
export const useGameFlowManager = () => useState<GameFlowManager | null>("gameFlowManager", () => null);

export const initGameFlowManager = (gameType: GameType) => {
    const gameFlowManager = useGameFlowManager();
    if (!gameFlowManager.value) {
        gameFlowManager.value = new GameFlowManager(gameType);
    }
};

// --------- UI MANAGER SERVICE --------- //
export const useUIManager = () => useState<UIManager>("uiManager", () => new UIManager());
