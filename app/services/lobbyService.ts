import type { LobbyInfo, LobbySummary } from "~/types/appTypes";

export const createLobbyService = (baseEndpoint: string) => ({
    /**
     * Create a new lobby on the server
     */
    async createLobby(accessToken: string, lobbyParams: { name: string; roundTime: number }): Promise<LobbyInfo> {
        const endpoint = baseEndpoint;
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

    async directory(token?: string | null, signal?: AbortSignal): Promise<Record<string, LobbySummary>> {
        const response = await fetch(`${baseEndpoint}/lobby/directory`, { cache: "no-store", signal, headers: token ? { Authorization: token } : {} });
        if (!response.ok) throw new Error("Lobby directory unavailable");
        return response.json();
    },
    async find(code: string, signal?: AbortSignal): Promise<LobbySummary | null> {
        const response = await fetch(`${baseEndpoint}/lobby/directory/${encodeURIComponent(code)}`, { cache: "no-store", signal });
        if (response.status === 404 && (await response.json()).code === "LOBBY_NOT_FOUND") return null;
        if (!response.ok) throw new Error("Lobby lookup unavailable");
        return response.json();
    },
    async admission(code: string, token: string, signal: AbortSignal): Promise<{ code: string; retained?: boolean }> {
        const response = await fetch(`${baseEndpoint}/lobby/admission?id=${encodeURIComponent(code)}`, { cache: "no-store", signal, headers: { Authorization: token } });
        if (!response.ok) throw new Error("Lobby admission unavailable");
        return response.json();
    },
});
