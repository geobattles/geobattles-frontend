import type { GameType, LiveResultsHashMap, Results, ResultsInfo, TotalResults } from "~/types/appTypes";

export const useResultsStore = defineStore("results", () => {
    // State
    const liveResults = ref<Results>({});
    const totalResults = ref<TotalResults>({});
    const gameMode = useGameMode();

    const resetResults = () => {
        liveResults.value = {};
        totalResults.value = {};
    };

    const applySingleResult = (userID: string, resultsData: ResultsInfo) => {
        processSingleResult(gameMode.currentMode, userID, resultsData);
    };

    const syncRoundResults = (roundResults: Results) => {
        switch (gameMode.currentMode) {
            case "BattleRoyale":
                liveResults.value = roundResults;
                sortResultsByDistance();
                break;
            default:
                console.error(`Unknown game mode: ${gameMode}`);

                break;
        }
    };

    const syncLiveResults = (liveResultsHashMap: LiveResultsHashMap) => {
        const playerID = usePlayerInfo().value.ID;
        console.log(playerID);

        // Sort results by distance based on the current game mode
        switch (gameMode.currentMode) {
            case "BattleRoyale":
                // Extract key and value for each entry in the hash map
                Object.entries(liveResultsHashMap).forEach(([key, value]) => {
                    // For each user, find their best result (lowest distance)
                    if (value.length > 0) {
                        const bestResult = value.reduce((best, current) => (current.distance < best.distance ? current : best), value[0]);

                        // Update the live results with the best result for this user
                        liveResults.value[key] = bestResult;
                        liveResults.value[key].lives = value[value.length - 1].lives;
                        liveResults.value[key].attempt = value[value.length - 1].attempt;
                    }

                    // Draw the markers for the current user
                    if (key === playerID && playerID) {
                        value.forEach((guess) => {
                            const color = getPlayerColorByID(playerID);
                            console.log(color);
                            if ("drawMarker" in gameMode.modeLogic && color) gameMode.modeLogic.drawMarker(guess.location, color);
                        });
                    }
                });

                // Sort results by distance
                sortResultsByDistance();
                break;
            default:
                console.error(`Unknown game mode: ${gameMode.currentMode}`);
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
        // liveResults.value = Object.fromEntries(Object.entries(liveResults.value).sort(([, a], [, b]) => (a.distance ?? 999999999) - (b.distance ?? 999999999)));

        // Do this temporarily until the backend is fixed not to send 0 distance on no result
        liveResults.value = Object.fromEntries(
            Object.entries(liveResults.value).sort(([, a], [, b]) => {
                const distanceA = a.distance === 0 ? 999999999 : (a.distance ?? 999999999);
                const distanceB = b.distance === 0 ? 999999999 : (b.distance ?? 999999999);
                return distanceA - distanceB;
            })
        );
    };

    return {
        // State
        liveResults,
        totalResults,

        // Actions
        applySingleResult,
        syncRoundResults,
        syncTotalResults,
        syncLiveResults,
        processSingleResult,
        resetResults,
    };
});
