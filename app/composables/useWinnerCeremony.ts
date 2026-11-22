import { computed, shallowRef, watch } from "vue";
import type { LobbyInfo } from "~/types/appTypes";
import { rankTotalResults } from "~/utils/resultUtils";

export type ChampionIdentity = { leaders: { id: string; name: string }[]; points: number; solo: boolean };

type ObservedMatch = Pick<LobbyInfo, "ID" | "gameId">;
const sameMatch = (match: ObservedMatch, lobbyId: string | undefined, gameId: string | undefined) => match.ID === lobbyId && (!match.gameId || !gameId || match.gameId === gameId);

export const useWinnerCeremony = (snapshot: () => LobbyInfo | null, phase: () => string, ready: () => boolean, nameOf: (id: string) => string) => {
    const rankings = computed(() => {
        const totals = snapshot()?.totalResults;
        return ready() && totals ? rankTotalResults(totals) : [];
    });
    const champion = computed<ChampionIdentity | null>(() => {
        const first = rankings.value[0];
        if (!first) return null;
        return {
            leaders: rankings.value.filter(({ rank }) => rank === 1).map(({ id }) => ({ id, name: nameOf(id) })),
            points: first.score,
            solo: rankings.value.length === 1,
        };
    });
    const ceremony = shallowRef<(ChampionIdentity & { key: string; match: ObservedMatch }) | null>(null);
    const presented = new Set<string>();
    let armed: ObservedMatch | null = null;
    const dismiss = () => (ceremony.value = null);

    // Socket handlers can publish FINISHED before replacing the totals in the same
    // turn. Observe the applied transaction, not its individual mutations.
    watch(
        [() => snapshot()?.ID, () => snapshot()?.gameId, () => snapshot()?.phase, phase, champion],
        ([lobbyId, gameId, serverPhase, localPhase, identity]) => {
            const finished = serverPhase === "FINISHED" && localPhase === "FINISHED";
            if (ceremony.value && (!finished || !identity || !sameMatch(ceremony.value.match, lobbyId, gameId))) dismiss();
            if (armed && (!sameMatch(armed, lobbyId, gameId) || serverPhase === "WAITING" || localPhase === "WAITING")) armed = null;
            if (!lobbyId) return;

            if ((serverPhase === "PLAYING" || serverPhase === "MID-ROUND") && (localPhase === "STARTING" || localPhase === "PLAYING" || localPhase === "MID-ROUND")) {
                armed = { ID: lobbyId, gameId: gameId ?? armed?.gameId };
                return;
            }
            if (!armed || !finished || !identity) return;

            // Older servers omit the match ID. The observed live phase arms each rematch.
            const match = { ID: lobbyId, gameId: gameId ?? armed.gameId };
            const key = JSON.stringify([match.ID, match.gameId]);
            armed = null;
            if (match.gameId && presented.has(key)) return;
            if (match.gameId) presented.add(key);
            ceremony.value = { key, match, ...identity };
        },
        { immediate: true }
    );

    return { ceremony, champion, rankings, dismiss };
};
