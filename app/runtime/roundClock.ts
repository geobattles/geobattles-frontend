import type { Ref } from "vue";

type ActiveRound = { lobbyId: string; playerId: string; gameId?: string; round: number };

// Keep the authority limit separate from the visible countdown. Transport
// expiry can hide the timer without granting extra time on a deliberate Retry.
export const createRoundClock = (visibleDeadline: Ref<number | null>) => {
    let ceiling: (ActiveRound & { deadline: number }) | undefined;
    return {
        apply: (round: ActiveRound, remainingMs: number) => {
            const now = Date.now();
            const candidate = now + remainingMs;
            const deadline =
                ceiling && ceiling.lobbyId === round.lobbyId && ceiling.playerId === round.playerId && ceiling.gameId === round.gameId && ceiling.round === round.round
                    ? Math.min(ceiling.deadline, candidate)
                    : candidate;
            ceiling = { ...round, deadline };
            visibleDeadline.value = deadline;
            return Math.max(0, Math.ceil((deadline - now) / 1000));
        },
        suspend: () => {
            // Legacy servers lack the only reliable way to tell a replay from
            // the old match after dropping the previous membership snapshot.
            if (!ceiling?.gameId) ceiling = undefined;
            visibleDeadline.value = null;
        },
        reset: () => {
            ceiling = undefined;
            visibleDeadline.value = null;
        },
    };
};
