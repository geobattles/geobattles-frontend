import type { User, Coordinates, Results, GameFlow, TotalResults, RoundResults, playerListObject } from "~/types";

// States
export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);

// Gameplay states
export const useGameFlow = () => useState<GameFlow>("game_flow", () => undefined);
export const useCoordinates = () => useState<Coordinates>("game_coordinates", () => ({} as Coordinates));
export const useCurrentPin = () => useState<Coordinates>("current_pin", () => ({} as Coordinates));
export const useResults = () => useState<Results>("live_results", () => ({} as Results));
export const useRoundResults = () => useState<RoundResults>("live_results", () => ({} as RoundResults));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({} as TotalResults));
export const usePolyLines = () => useState<google.maps.Polyline[]>("poly_lines", () => [] as google.maps.Polyline[]);
export const useIsSubmitDisabled = () => useState<boolean>("submit_button", () => false);

// Additional helper functions
/**
 * Function returns player color based on provided name.
 *
 * @param name Player name from LobbyInfo.playerList
 * @returns Player color from LobbyInfo.playerList
 */
export const getPlayerColorByName = (name: string): string | undefined => {
    const lobby_info = useLobbySettings();
    for (const player_id in lobby_info.value.playerList as playerListObject) {
        const player = lobby_info.value.playerList[player_id];
        if (player.name === name) return player.color;
    }
    return undefined;
};

export const getPlayerColorByID = (id: string | number): string | undefined => {
    const lobby_info = useLobbySettings();
    const player = lobby_info.value.playerList[id];
    if (!player) return undefined;
    return player.color;
};

export const getPlayerIDFromName = (name: string): string | undefined => {
    const lobby_info = useLobbySettings();
    for (const player_id in lobby_info.value.playerList as playerListObject) {
        const player = lobby_info.value.playerList[player_id];
        if (player.name === name) return player_id;
    }
    return undefined;
};

export const getPlayerNameFromID = (id: string | number): string | undefined => {
    const lobby_info = useLobbySettings();
    const player = lobby_info.value.playerList[id];
    if (!player) return undefined;
    return player.name;
};
