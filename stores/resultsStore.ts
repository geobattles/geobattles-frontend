import type { GameType, Results, ResultsInfo, TotalResults } from "~/types/appTypes";

export const useResultsStore = defineStore("results", () => {
    // State
    const liveResults = ref<Results>({});
    const totalResults = ref<TotalResults>({});
    const gameMode = useGameMode();

    function resetResults() {
        liveResults.value = {};
        totalResults.value = {};
    }

    const applySingleResult = (userID: string, resultsData: ResultsInfo) => {
        processSingleResult(gameMode.currentMode, userID, resultsData);
    };

    const syncRoundResults = (roundResults: Results) => {
        switch (gameMode.currentMode) {
            case "BattleRoyale":
                // Sort round results properly by distance
                const sortedResults = Object.fromEntries(Object.entries(roundResults).sort(([, a], [, b]) => (a.distance ?? 999999999) - (b.distance ?? 999999999)));
                liveResults.value = sortedResults;
                break;
            default:
                console.error(`Unknown game mode: ${gameMode}`);

                break;
        }
    };

    const syncTotalResults = (_totalResults: TotalResults) => {
        switch (gameMode.currentMode) {
            case "BattleRoyale":
                // Sort total results properly by total score
                totalResults.value = Object.fromEntries(Object.entries(_totalResults).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));
                break;
            default:
                console.error(`Unknown game mode: ${gameMode}`);

                break;
        }
    };

    const processSingleResult = (gameMode: GameType, userID: string, playerResult: ResultsInfo) => {
        switch (gameMode) {
            case "BattleRoyale":
                // Get leader before aplying the new result
                const leaderBefore = getCurrentRoundLeader();

                // Check if the new score is better than the current best score
                const isNewScoreBetter = playerResult.baseScr < liveResults.value[userID]?.baseScr;
                const isNewDistanceFurther = playerResult.baseScr === 0 && playerResult.distance > liveResults.value[userID].distance;

                if (isNewScoreBetter || isNewDistanceFurther) {
                    // Update attempts and lives, not the score or distance if new guess is worse
                    liveResults.value[userID].lives = playerResult.lives;
                    liveResults.value[userID].attempt = playerResult.attempt;
                } else {
                    // Update everything because the new user's result is better than his current best
                    liveResults.value[userID] = playerResult;
                }

                // Sort results by distance
                sortResultsByDistance();
                const leaderAfter = getCurrentRoundLeader();

                // Apply styles to the leaderboard
                useUIManager().value.applyGuessStyles(userID, leaderBefore, leaderAfter);
                break;

            default:
                console.error(`Unknown game mode: ${gameMode}`);

                break;
        }
    };

    // ======================== HELPERS ========================
    const getCurrentRoundLeader = () => {
        // return Object.keys(liveResults.value).reduce((a, b) => (liveResults.value[a].distance < liveResults.value[b].distance ? a : b));
        const firstKey = Object.keys(liveResults.value)[0];
        return firstKey;
    };

    const sortResultsByDistance = (): void => {
        liveResults.value = Object.fromEntries(Object.entries(liveResults.value).sort(([, a], [, b]) => (a.distance ?? 999999999) - (b.distance ?? 999999999)));
    };

    return {
        // State
        liveResults,
        totalResults,

        // Actions
        applySingleResult,
        syncRoundResults,
        syncTotalResults,
        processSingleResult,
        resetResults,
    };
});
