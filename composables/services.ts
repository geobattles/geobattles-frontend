import { UIManager } from "../core/UIManager";

// --------- UI MANAGER SERVICE --------- //
export const useUIManager = () => useState<UIManager>("uiManager", () => new UIManager());
