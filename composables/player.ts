import type { User, playerListObject } from "@/types";

export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);
// TODO: Will also be used when Users backend is added to the APP

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
