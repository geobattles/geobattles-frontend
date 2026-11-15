import type { User, Results, TotalResults, playerListObject } from "~/types/appTypes";

export const usePlayerInfo = () => useState<User>("user_info", () => ({}) as User);
export const useLiveResults = () => useState<Results>("live_results", () => ({}));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({}));

export const usePlayerLookup = () => {
    const { lobbySettings, playerPresentation } = useLobbyState();
    const rememberPlayers = (lobbyId: string, players: playerListObject) => {
        if (playerPresentation.value.lobbyId !== lobbyId) playerPresentation.value = { lobbyId, players: {} };
        for (const [id, player] of Object.entries(players)) {
            const previous = playerPresentation.value.players[id];
            playerPresentation.value.players[id] = { name: player.name || previous?.name || id, color: player.color || previous?.color || "#64748b" };
        }
    };
    const retained = (id: string | number) => (playerPresentation.value.lobbyId === lobbySettings.value?.ID ? playerPresentation.value.players[id] : undefined);
    return {
        rememberPlayers,
        // Fresh snapshots cannot recover departed names from the result DTO.
        // Safe text identity/default color preserve every historical row/winner.
        getPlayerColorByID: (id: string | number) => lobbySettings.value?.playerList[id]?.color || retained(id)?.color || "#64748b",
        getPlayerNameFromID: (id: string | number) => lobbySettings.value?.playerList[id]?.name || retained(id)?.name || String(id),
    };
};
