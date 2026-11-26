import { computed } from "vue";
import type { Coordinates } from "~/types/appTypes";
import type {
    CompletedGameInput,
    JournalAttempt,
    JournalDocument,
    JournalMatch,
    JournalPersonalBests,
    JournalRecordResult,
    JournalRound,
    JournalStorageStatus,
} from "~/types/journal";

const MATCH_LIMIT = 30;
// Conservative UTF-16 accounting: no more than 2 MiB for one identity's document.
const MAX_DOCUMENT_CHARS = 1_048_576;
const MAX_ROUNDS = 100;
// Backend NumAttempt is at most 100; later dynamic-lives rounds allow NumAttempt + 1.
const MAX_ATTEMPTS = 101;
const STORAGE_PREFIX = "geobattles:journal:v1:";

type UnknownRecord = Record<string, unknown>;
type JournalState = { ownerId: string | null; matches: JournalMatch[]; status: JournalStorageStatus };

const object = (value: unknown): value is UnknownRecord => !!value && typeof value === "object" && !Array.isArray(value);
const identifier = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 128 && !/\s|[\u0000-\u001f]/u.test(value);
const integer = (value: unknown, min = -1_000_000_000, max = 1_000_000_000): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
const distance = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 50_000_000;
const coordinates = (value: unknown): Coordinates | null => {
    if (!object(value) || typeof value.lat !== "number" || typeof value.lng !== "number") return null;
    if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng) || Math.abs(value.lat) > 90 || Math.abs(value.lng) > 180) return null;
    return { lat: value.lat, lng: value.lng };
};
const sameCoordinates = (a: Coordinates, b: Coordinates) => a.lat === b.lat && a.lng === b.lng;
const keyFor = (ownerId: string) => `${STORAGE_PREFIX}${encodeURIComponent(ownerId)}`;

// Both recording and session/device reloads evict whole oldest matches at either limit.
const boundedDocument = (ownerId: string, newestFirst: JournalMatch[]) => {
    const matches = newestFirst.slice(0, MATCH_LIMIT);
    const document: JournalDocument = { version: 1, ownerId, matches };
    let serialized = JSON.stringify(document);
    while (serialized.length > MAX_DOCUMENT_CHARS && matches.length) {
        matches.pop();
        serialized = JSON.stringify(document);
    }
    return { matches, serialized };
};

// Reconstruct a whitelist instead of trusting/casting parsed browser storage.
const readRound = (value: unknown, expectedRound: number): JournalRound | null => {
    if (!object(value) || value.round !== expectedRound || !Array.isArray(value.attempts) || value.attempts.length > MAX_ATTEMPTS) return null;
    const answer = coordinates(value.answer);
    if (!answer || !integer(value.baseScore, 0, 5000) || !integer(value.bonusScore) || !integer(value.score)) return null;
    if (value.score !== value.baseScore + value.bonusScore) return null;
    const missed = value.missed;
    if (missed !== undefined && (missed !== true || value.bestAttempt !== null || value.bonusScore !== 0)) return null;
    const attempts: JournalAttempt[] = [];
    for (const [index, raw] of value.attempts.entries()) {
        if (!object(raw) || raw.attempt !== index + 1 || !distance(raw.distanceMeters) || !integer(raw.baseScore, 0, 5000)) return null;
        const guess = coordinates(raw.guess);
        if (!guess) return null;
        attempts.push({ attempt: index + 1, guess, distanceMeters: raw.distanceMeters, baseScore: raw.baseScore });
    }
    if (value.bestAttempt === null) {
        if (attempts.length || value.distanceMeters !== null || value.baseScore !== 0) return null;
        return {
            round: expectedRound,
            answer,
            attempts,
            bestAttempt: null,
            distanceMeters: null,
            baseScore: 0,
            bonusScore: value.bonusScore,
            score: value.score,
            ...(missed && { missed }),
        };
    }
    if (!integer(value.bestAttempt, 1, attempts.length) || !distance(value.distanceMeters)) return null;
    const best = attempts[value.bestAttempt - 1];
    if (!best || best.distanceMeters !== value.distanceMeters || best.baseScore !== value.baseScore) return null;
    if (attempts.some((attempt) => attempt.distanceMeters < best.distanceMeters)) return null;
    return {
        round: expectedRound,
        answer,
        attempts,
        bestAttempt: value.bestAttempt,
        distanceMeters: value.distanceMeters,
        baseScore: value.baseScore,
        bonusScore: value.bonusScore,
        score: value.score,
    };
};

const readMatch = (value: unknown, ownerId: string): JournalMatch | null => {
    if (!object(value) || value.playerId !== ownerId || !identifier(value.gameId) || !identifier(value.lobbyId) || value.mode !== "BattleRoyale") return null;
    if (!integer(value.completedAt, 0, 8_640_000_000_000_000) || !integer(value.totalScore)) return null;
    if (!integer(value.participants, 1, 10_000) || !integer(value.rank, 1, value.participants)) return null;
    if (!Array.isArray(value.rounds) || !value.rounds.length || value.rounds.length > MAX_ROUNDS) return null;
    const rounds: JournalRound[] = [];
    for (const [index, raw] of value.rounds.entries()) {
        const round = readRound(raw, index + 1);
        if (!round) return null;
        rounds.push(round);
    }
    if (rounds.every((round) => round.missed) || rounds.reduce((sum, round) => sum + round.score, 0) !== value.totalScore) return null;
    return {
        gameId: value.gameId,
        lobbyId: value.lobbyId,
        playerId: ownerId,
        mode: "BattleRoyale",
        completedAt: value.completedAt,
        totalScore: value.totalScore,
        rank: value.rank,
        participants: value.participants,
        rounds,
    };
};

const readDevice = (ownerId: string): { matches: JournalMatch[]; status: JournalStorageStatus } => {
    try {
        const raw = window.localStorage.getItem(keyFor(ownerId));
        if (raw === null) return { matches: [], status: "saved" };
        if (raw.length > MAX_DOCUMENT_CHARS) return { matches: [], status: "invalid" };
        const document: unknown = JSON.parse(raw);
        if (!object(document) || document.version !== 1 || document.ownerId !== ownerId || !Array.isArray(document.matches) || document.matches.length > MATCH_LIMIT)
            return { matches: [], status: "invalid" };
        const matches: JournalMatch[] = [];
        const ids = new Set<string>();
        for (const rawMatch of document.matches) {
            const match = readMatch(rawMatch, ownerId);
            if (!match || ids.has(match.gameId)) return { matches: [], status: "invalid" };
            ids.add(match.gameId);
            matches.push(match);
        }
        return { matches: matches.sort((a, b) => b.completedAt - a.completedAt), status: "saved" };
    } catch (error) {
        return { matches: [], status: error instanceof SyntaxError ? "invalid" : "session" };
    }
};

const buildMatch = (input: CompletedGameInput, ownerId: string): JournalMatch | null => {
    if (!object(input) || !identifier(input.gameId) || !identifier(input.lobbyId) || input.playerId !== ownerId || input.phase !== "FINISHED") return null;
    if (!integer(input.roundCount, 1, MAX_ROUNDS) || input.round !== input.roundCount) return null;
    if (!object(input.results) || !object(input.totalResults) || !object(input.endResults) || !object(input.answers)) return null;
    if (
        Object.keys(input.results).length !== input.roundCount ||
        Object.keys(input.endResults).length !== input.roundCount ||
        Object.keys(input.answers).length !== input.roundCount
    )
        return null;
    const ownTotal = input.totalResults[ownerId];
    if (!Object.hasOwn(input.totalResults, ownerId) || !object(ownTotal) || !integer(ownTotal.total ?? 0)) return null;
    const totals = Object.values(input.totalResults);
    if (!totals.length || totals.length > 10_000 || totals.some((row) => !object(row) || !integer(row.total ?? 0))) return null;
    const rounds: JournalRound[] = [];
    for (let round = 1; round <= input.roundCount; round++) {
        const rawRound = input.results[round];
        const scoredRound = input.endResults[round];
        const answer = coordinates(input.answers[round]);
        if (!object(rawRound) || !object(scoredRound) || !answer) return null;
        const rawAttempts: unknown = rawRound[ownerId] ?? [];
        if (!Array.isArray(rawAttempts) || rawAttempts.length > MAX_ATTEMPTS) return null;
        if (!Object.hasOwn(scoredRound, ownerId)) {
            if (rawAttempts.length) return null;
            rounds.push({ round, answer, attempts: [], bestAttempt: null, distanceMeters: null, baseScore: 0, bonusScore: 0, score: 0, missed: true });
            continue;
        }
        const scored = scoredRound[ownerId];
        if (!object(scored) || !integer(scored.attempt, 0, MAX_ATTEMPTS) || !integer(scored.baseScr, 0, 5000)) return null;
        const attempts: JournalAttempt[] = [];
        for (const raw of rawAttempts) {
            if (!object(raw) || !integer(raw.attempt, 0, MAX_ATTEMPTS)) return null;
            // An authoritative zero-attempt placeholder is never a perfect guess.
            if (raw.attempt === 0) {
                if (rawAttempts.length !== 1 || scored.attempt !== 0 || raw.baseScr !== 0) return null;
                continue;
            }
            const guess = coordinates(raw.location);
            if (!guess || !distance(raw.distance) || !integer(raw.baseScr, 0, 5000)) return null;
            attempts.push({ attempt: raw.attempt, guess, distanceMeters: raw.distance, baseScore: raw.baseScr });
        }
        attempts.sort((a, b) => a.attempt - b.attempt);
        const bonuses = [scored.placeScr ?? 0, scored.dblScr ?? 0, scored.duelScr ?? 0];
        if (!bonuses.every((score) => integer(score)) || !integer(scored.total ?? 0)) return null;
        const bonusScore = bonuses.reduce((sum: number, score) => sum + Number(score), 0);
        if ((scored.total ?? 0) !== scored.baseScr + bonusScore) return null;
        if (scored.attempt > 0) {
            const best = attempts.find((attempt) => attempt.attempt === scored.attempt);
            const bestLocation = coordinates(scored.location);
            if (!best || !bestLocation || !sameCoordinates(best.guess, bestLocation) || best.distanceMeters !== scored.distance) return null;
        }
        const debrief = readRound(
            {
                round,
                answer,
                attempts,
                bestAttempt: scored.attempt > 0 ? scored.attempt : null,
                distanceMeters: scored.attempt > 0 ? scored.distance : null,
                baseScore: scored.baseScr,
                bonusScore,
                score: scored.total ?? 0,
            },
            round
        );
        if (!debrief) return null;
        rounds.push(debrief);
    }
    return readMatch(
        {
            gameId: input.gameId,
            lobbyId: input.lobbyId,
            playerId: ownerId,
            mode: input.mode,
            completedAt: Date.now(),
            totalScore: ownTotal.total ?? 0,
            rank: 1 + totals.filter((row) => (row.total ?? 0) > (ownTotal.total ?? 0)).length,
            participants: totals.length,
            rounds,
        },
        ownerId
    );
};

/**
 * Native Nuxt state only. This facade owns no global watcher/listener or auth data.
 * Pages call load() in their own mounted identity watcher; completion calls load()
 * synchronously. Computed identity gates hide old rows immediately on logout or a
 * switch, even when no journal page is mounted. SSR never accesses localStorage.
 */
export const useMatchJournal = () => {
    const player = usePlayerInfo();
    const auth = useAuthStore();
    const state = useState<JournalState>("journal:device", () => ({ ownerId: null, matches: [], status: "unloaded" }));
    const identityId = computed(() => (import.meta.client && auth.isAuthenticated && identifier(player.value.ID) ? player.value.ID : null));
    const matches = computed(() => (identityId.value && state.value.ownerId === identityId.value ? state.value.matches : []));
    const storageStatus = computed<JournalStorageStatus>(() => (identityId.value && state.value.ownerId === identityId.value ? state.value.status : "unloaded"));
    const storageMessage = computed(() => {
        if (storageStatus.value === "invalid") return "This device's saved journal could not be read safely. Clear this identity's local journal to reset it.";
        if (storageStatus.value === "session") return "Browser storage is unavailable or full. New matches are visible for this open session only; they may not survive a reload.";
        return null;
    });
    const load = (): JournalStorageStatus => {
        const ownerId = identityId.value;
        if (!import.meta.client || !ownerId) {
            state.value = { ownerId: null, matches: [], status: "unloaded" };
            return "unloaded";
        }
        const device = readDevice(ownerId);
        const unsaved = state.value.ownerId === ownerId && state.value.status === "session" ? state.value.matches : [];
        if (device.status === "invalid") state.value = { ownerId, ...device };
        else {
            const merged = new Map([...device.matches, ...unsaved].map((match) => [match.gameId, match]));
            const next = boundedDocument(
                ownerId,
                [...merged.values()].sort((a, b) => b.completedAt - a.completedAt)
            );
            state.value = { ownerId, matches: next.matches, status: device.status === "session" || unsaved.length > 0 ? "session" : "saved" };
        }
        return state.value.status;
    };
    const clear = (): boolean => {
        const ownerId = identityId.value;
        if (!import.meta.client || !ownerId) return false;
        try {
            window.localStorage.removeItem(keyFor(ownerId));
            if (window.localStorage.getItem(keyFor(ownerId)) !== null) throw new Error("Journal removal was not confirmed.");
            state.value = { ownerId, matches: [], status: "saved" };
            return true;
        } catch {
            state.value = { ownerId, matches: [], status: "session" };
            return false;
        }
    };
    const recordCompletedGame = (input: CompletedGameInput): JournalRecordResult => {
        if (!import.meta.client) return { status: "skipped", reason: "not-client" };
        const ownerId = identityId.value;
        if (!ownerId || !object(input) || input.playerId !== ownerId) return { status: "skipped", reason: "identity" };
        if (input.mode !== "BattleRoyale") return { status: "skipped", reason: "unsupported-mode" };
        const match = buildMatch(input, ownerId);
        if (!match) return { status: "skipped", reason: "incomplete" };
        load();
        if (state.value.status === "invalid") return { status: "skipped", reason: "invalid-storage" };
        if (state.value.matches.some((previous) => previous.gameId === match.gameId)) return { status: "duplicate" };
        const { matches: next, serialized } = boundedDocument(ownerId, [match, ...state.value.matches]);
        if (!next.length) return { status: "skipped", reason: "capacity" };
        let persistence: "device" | "session" = "device";
        try {
            window.localStorage.setItem(keyFor(ownerId), serialized);
            if (window.localStorage.getItem(keyFor(ownerId)) !== serialized) persistence = "session";
        } catch {
            persistence = "session";
        }
        state.value = { ownerId, matches: next, status: persistence === "device" ? "saved" : "session" };
        return { status: "recorded", persistence };
    };
    const personalBests = computed<JournalPersonalBests>(() => {
        const bests: JournalPersonalBests = { highestScore: null, closestGuess: null, highestRound: null, totalRounds: 0, guessedRounds: 0, totalAttempts: 0 };
        for (const match of matches.value) {
            if (!bests.highestScore || match.totalScore > bests.highestScore.score) bests.highestScore = { score: match.totalScore, gameId: match.gameId };
            for (const round of match.rounds) {
                if (round.missed) continue;
                bests.totalRounds++;
                bests.totalAttempts += round.attempts.length;
                if (!bests.highestRound || round.score > bests.highestRound.score) bests.highestRound = { score: round.score, gameId: match.gameId, round: round.round };
                if (round.distanceMeters === null) continue;
                bests.guessedRounds++;
                if (!bests.closestGuess || round.distanceMeters < bests.closestGuess.distanceMeters)
                    bests.closestGuess = { distanceMeters: round.distanceMeters, gameId: match.gameId, round: round.round };
            }
        }
        return bests;
    });
    return { matches, identityId, storageStatus, storageMessage, personalBests, matchLimit: MATCH_LIMIT, load, clear, recordCompletedGame };
};
