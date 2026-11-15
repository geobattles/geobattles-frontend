import type { LiveResultsHashMap, ResultData, Results, TotalResults, playerListObject } from "~/types/appTypes";

export const useResultsStore = () => {
    const liveResults = useLiveResults();
    const totalResults = useTotalResults();
    const rawResults = useState<LiveResultsHashMap>("results:rawRound", () => ({}));
    const bestResults = useState<Results>("results:bestRound", () => ({}));
    const currentMode = useSelectedGameMode();
    const { lobbySettings } = useLobbyState();
    const sortResultsByDistance = () => {
        liveResults.value = Object.fromEntries(Object.entries(liveResults.value).sort(([, a], [, b]) => guessDistance(a) - guessDistance(b)));
    };
    const getCurrentRoundLeader = () => Object.entries(liveResults.value).find(([, result]) => hasGuess(result))?.[0];
    const resetResults = () => {
        liveResults.value = {};
        totalResults.value = {};
        rawResults.value = {};
        bestResults.value = {};
    };
    const syncMembers = (players: playerListObject) => {
        if (currentMode.value !== "BattleRoyale") return;
        const members = playersToResults(players);
        liveResults.value = Object.fromEntries(
            Object.entries(members).map(([id, member]) => {
                const guesses = rawResults.value[id] ?? [];
                const latest = guesses[guesses.length - 1];
                let best = bestResults.value[id];
                // Prefer authoritative geometry/bonuses; raw history is also
                // complete when the round's best row has not been emitted yet.
                if (!hasGuess(best)) for (const guess of guesses) best = selectBestGuess(best, guess);
                best ??= member;
                return [id, { ...best, attempt: latest?.attempt ?? best.attempt, lives: member.lives }];
            })
        );
        sortResultsByDistance();
    };
    const restoreRound = (players: playerListObject, attempts: LiveResultsHashMap, roundResults: Results) => {
        if (currentMode.value !== "BattleRoyale") return;
        rawResults.value = normalizeRawResults(attempts);
        bestResults.value = normalizeResults(roundResults);
        // Historical overlay participants need not still be members. Preserve
        // authoritative best/bonuses; derive geometry only when not emitted yet.
        for (const [id, guesses] of Object.entries(rawResults.value)) {
            if (hasGuess(bestResults.value[id])) continue;
            for (const guess of guesses) bestResults.value[id] = selectBestGuess(bestResults.value[id], guess);
        }
        syncMembers(players);
    };
    const syncTotalResults = (totals: TotalResults) => {
        if (currentMode.value !== "BattleRoyale") return;
        totalResults.value = Object.fromEntries(
            Object.entries(totals)
                .map(([id, result]) => [id, { ...normalizeResult(result), total: result.total }] as const)
                .sort(([, a], [, b]) => (b.total ?? 0) - (a.total ?? 0))
        );
    };
    const applySingleResult = (userID: string, result: ResultData) => {
        if (currentMode.value !== "BattleRoyale") return;
        const leaderBefore = getCurrentRoundLeader();
        result = normalizeResult(result);
        const attempts = rawResults.value[userID] ?? [];
        rawResults.value[userID] = [...attempts, result];
        if (lobbySettings.value?.playerList[userID]) liveResults.value[userID] = mergeBestGuess(liveResults.value[userID], result);
        bestResults.value[userID] = selectBestGuess(bestResults.value[userID], result);
        sortResultsByDistance();
        return { leaderBefore, leaderAfter: getCurrentRoundLeader() };
    };
    return reactive({ liveResults, totalResults, rawResults, bestResults, applySingleResult, restoreRound, syncMembers, syncTotalResults, resetResults });
};
