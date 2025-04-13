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
    async fetchLobbyList(): Promise<string[]> {
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
