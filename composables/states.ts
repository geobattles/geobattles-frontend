import type { User, LobbyInfo } from "~/types";

// Here are defined all states that are used in the app
export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useLobbySettings = () => useState<LobbyInfo>("lobby_settings", () => ({} as LobbyInfo));
export const useSocketConnection = () => useState<WebSocket>("socket_connection", () => ({} as WebSocket));
