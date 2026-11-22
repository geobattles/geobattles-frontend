export const useGoogleStore = () => useNuxtApp().$gameRuntime.google;
export const useWebSocketStore = () => useNuxtApp().$gameRuntime.socket;
export const useLobbySocketActions = () => useNuxtApp().$gameRuntime.socketActions;
export const useUIManagerStore = () => useNuxtApp().$gameRuntime.ui;
