// --------- UI MANAGER SERVICE --------- //
export const useUIManager = () => useState<UIManager>("uiManager", () => new UIManager());
