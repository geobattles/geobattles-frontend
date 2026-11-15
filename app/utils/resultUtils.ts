import type { ResultData, Results, playerListObject } from "~/types/appTypes";

// Presence comes from an actual attempt, never distance/location truthiness.
export const hasGuess = (result: Pick<ResultData, "attempt" | "distance"> | null | undefined): boolean =>
    !!result && result.attempt > 0 && Object.hasOwn(result, "distance") && Number.isFinite(result.distance);

export const guessDistance = (result: ResultData): number => (hasGuess(result) ? result.distance : Infinity);

export const playersToResults = (players: playerListObject): Results =>
    Object.fromEntries(
        Object.entries(players).map(([id, player]) => [
            id,
            {
                attempt: 0,
                baseScr: 0,
                distance: 0,
                lives: player.lives ?? 0,
                location: { lat: 0, lng: 0 },
            },
        ])
    );

// Zero/invalid results are not guesses, even when the server emits {0, 0}.
// Membership lives are independent: timeout's empty Result must not consume them.
export const normalizeResult = (result: ResultData): ResultData =>
    hasGuess(result) ? { ...result } : { ...result, attempt: 0, distance: 0, baseScr: 0, location: { lat: 0, lng: 0 } };

export const normalizeResults = (results: Results): Results => Object.fromEntries(Object.entries(results).map(([id, result]) => [id, normalizeResult(result)]));

export const normalizeRawResults = (results: Record<string, ResultData[]>): Record<string, ResultData[]> =>
    Object.fromEntries(Object.entries(results).map(([id, attempts]) => [id, attempts.map(normalizeResult)]));

export const selectBestGuess = (previous: ResultData | undefined, latest: ResultData): ResultData =>
    previous && hasGuess(previous) && (!hasGuess(latest) || previous.distance <= latest.distance) ? previous : latest;

// Live presentation combines best geometry with the latest submission counters.
export const mergeBestGuess = (previous: ResultData | undefined, latest: ResultData): ResultData => ({
    ...selectBestGuess(previous, latest),
    attempt: latest.attempt,
    lives: latest.lives,
});

export const formatGuessDistance = (result: ResultData): string => {
    if (!hasGuess(result)) return "--";
    const meters = result.distance < 1000;
    return `${Math.round((meters ? result.distance : result.distance / 1000) * 10) / 10} ${meters ? "m" : "km"}`;
};
