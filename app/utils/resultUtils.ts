import type { Coordinates, ResultData, Results, TotalResults, playerListObject } from "~/types/appTypes";

export type RankedResult = { id: string; score: number; rank: number };

const rankScores = (rows: { id: string; score: number }[]): RankedResult[] => {
    let rank = 0;
    let previousScore: number | undefined;
    return rows
        .sort((a, b) => b.score - a.score)
        .map(({ id, score }, index) => {
            if (score !== previousScore) rank = index + 1;
            previousScore = score;
            return { id, score, rank };
        });
};

export const rankTotalResults = (totals: TotalResults) => rankScores(Object.entries(totals).map(([id, result]) => ({ id, score: result.total ?? 0 })));

export const roundResultPoints = (result: ResultData): number => result.total ?? result.baseScr + (result.placeScr ?? 0) + (result.dblScr ?? 0) + (result.duelScr ?? 0);

export const rankRoundResults = (results: Results) => rankScores(Object.entries(results).map(([id, result]) => ({ id, score: roundResultPoints(result) })));

export type ExpeditionStop = { round: number; position: Coordinates };

export const expeditionStops = (answers: Readonly<Record<number, Coordinates>>, lastRound: number): ExpeditionStop[] => {
    const stops = Object.entries(answers)
        .map(([round, position]) => ({ round: Number(round), position }))
        .filter(({ round }) => Number.isInteger(round) && round >= 1 && round <= lastRound)
        .sort((a, b) => a.round - b.round);
    if (stops.length === lastRound) return stops;
    const final = answers[lastRound];
    return final ? [{ round: lastRound, position: final }] : [];
};

export const roundResultBounds = (answer: Coordinates, guesses: readonly Coordinates[]) => {
    const points = [answer, ...guesses];
    const lats = points.map(({ lat }) => lat);
    const lngs = points.map(({ lng }) => lng).sort((a, b) => a - b);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    let west = lngs[0] ?? answer.lng;
    let east = lngs.at(-1) ?? answer.lng;
    let largestGap = west + 360 - east;
    // Cover the shorter arc when guesses straddle the date line.
    for (let i = 1; i < lngs.length; i++) {
        const current = lngs[i]!;
        const previous = lngs[i - 1]!;
        if (current - previous <= largestGap) continue;
        largestGap = current - previous;
        west = current;
        east = previous;
    }
    // Give an exact or isolated answer some local context.
    const minSpan = 0.018;
    const latPad = Math.max(0, (minSpan - (north - south)) / 2);
    const lngPad = Math.max(0, (minSpan - (360 - largestGap)) / 2);
    return {
        north: Math.min(90, north + latPad),
        south: Math.max(-90, south - latPad),
        west: west - lngPad < -180 ? west - lngPad + 360 : west - lngPad,
        east: east + lngPad > 180 ? east + lngPad - 360 : east + lngPad,
    };
};

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

export type LiveGuessFeedback = { playerId: string; attempt: number; kind: "guess" | "climb" | "lead"; passed: number };

// Follow the live table's best-distance order. A tie never counts as a pass.
export const describeLiveGuess = (rows: Results, playerId: string, latest: ResultData): LiveGuessFeedback | undefined => {
    const previous = rows[playerId];
    if (!previous || !hasGuess(latest)) return;
    const before = guessDistance(previous);
    const after = Math.min(before, latest.distance);
    let closestRival = Infinity;
    let passed = 0;
    for (const [id, row] of Object.entries(rows)) {
        if (id === playerId || !hasGuess(row)) continue;
        const distance = row.distance;
        closestRival = Math.min(closestRival, distance);
        if (before >= distance && after < distance) passed++;
    }
    const kind = after < closestRival && before >= closestRival ? "lead" : passed > 0 ? "climb" : "guess";
    return { playerId, attempt: latest.attempt, kind, passed };
};

export const formatGuessDistance = (result: ResultData): string => {
    if (!hasGuess(result)) return "--";
    const meters = result.distance < 1000;
    return `${Math.round((meters ? result.distance : result.distance / 1000) * 10) / 10} ${meters ? "m" : "km"}`;
};
