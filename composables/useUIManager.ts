import { UIManager } from "./services/UIManager";
export const useUIManager = () => useState<UIManager>("uiManager", () => new UIManager());
