import type { LobbyInfo } from "~/types/appTypes";

export const lobbyService = {
    /**
     * Create a new lobby on the server
     */
    async createLobby(accessToken: string, lobbyParams: { name: string; roundTime: number }): Promise<LobbyInfo> {
        const endpoint = useAppStore().backendEndpoint;
        const response = await fetch(`${endpoint}/lobby`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: accessToken,
            },
            body: JSON.stringify(lobbyParams),
        });

        if (!response.ok) {
            throw new Error(`Failed to create lobby: ${response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Get list of available lobbies
     */
    async fetchLobbyList(): Promise<Record<string, LobbyInfo>> {
        const endpoint = useAppStore().backendEndpoint;
        const response = await fetch(`${endpoint}/lobby`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch lobbies: ${response.statusText}`);
        }

        return await response.json();
    },
};

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
