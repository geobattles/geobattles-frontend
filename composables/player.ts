import type { User, Results, TotalResults } from "@/types/appTypes";

export const usePlayerInfo = () => useState<User>("user_info", () => ({}) as User);
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);
export const useIsLoginDialogVisible = () => useState("isLoginDialogVisible", () => false);

export const useLiveResults = () => useState<Results>("live_results", () => ({}) as Results);
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({}) as TotalResults);

export const getPlayerColorByID = (id: string | number): string | undefined => {
    // Get lobby settings from the store
    const { lobbySettings } = useLobbyStore();
    if (!lobbySettings) {
        console.error("Lobby settings are undefined in getPlayerColorByID function.");
        return undefined;
    }

    // Get the player with the given ID
    const player = lobbySettings.playerList[id];
    if (!player) {
        console.error(`Player with ID ${id} not found`);
        return undefined;
    }

    // Return the player's color
    return player.color;
};

export const getPlayerNameFromID = (id: string | number): string | undefined => {
    // Get lobby settings from the store
    const { lobbySettings } = useLobbyStore();
    if (!lobbySettings) {
        console.error("Lobby settings are undefined in getPlayerNameFromID function.");
        return undefined;
    }

    // Get the player with the given ID
    const player = lobbySettings.playerList[id];
    if (!player) {
        console.error(`Player with ID ${id} not found`);
        return undefined;
    }

    // Return the player's name
    return player.name;
};
