import type { User } from "@/types";

export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);
export const useIsLoginDialogVisible = () => useState("isLoginDialogVisible", () => false);

export const getPlayerColorByID = (id: string | number): string | undefined => {
    const lobby_info = useLobbySettings();
    const player = lobby_info.value.playerList[id];
    if (!player) return undefined;
    return player.color;
};

export const getPlayerNameFromID = (id: string | number): string | undefined => {
    const lobby_info = useLobbySettings();
    const player = lobby_info.value.playerList[id];
    if (!player) return undefined;
    return player.name;
};
