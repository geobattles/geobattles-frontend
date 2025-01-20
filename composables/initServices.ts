import { UIManager } from "../services/UIManager";
import type { GameType } from "~/types/appTypes";
import { GameFlowManager } from "../services/GameFlowManager";
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
