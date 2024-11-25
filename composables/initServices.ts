import { WebSocketService } from "../services/WebSocketService";
import { UIManager } from "../services/UIManager";
import type { GameType } from "~/types/appTypes";
import { GameFlowManager } from "../services/GameFlowManager";
import { AuthenticationService } from "../services/AuthenticationService";

// --------- WEB SOCKET SERVICE --------- //

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
