import type { User, Lobby } from "~/types";

export const userInfo = () => useState<User>("user_info", () => ({} as User));
export const lobbySettings = () => useState<Lobby>("lobby_settings", () => ({} as Lobby));
