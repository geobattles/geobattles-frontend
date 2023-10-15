import type { playerListObject } from "~/types";

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
