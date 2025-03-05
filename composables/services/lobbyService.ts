import type { LobbyInfo } from "~/types/appTypes";

export const lobbyService = {
    /**
     * Create a new lobby on the server
     */
    async createLobby(token: string, lobbyParams: { name: string; roundTime: number }): Promise<LobbyInfo> {
        const backendAPI = useBackendAPI().value;
        const response = await fetch(`${backendAPI}/lobby`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
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
        const backendAPI = useBackendAPI().value;
        const response = await fetch(`${backendAPI}/lobby`, {
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
