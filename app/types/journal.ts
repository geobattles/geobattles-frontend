import type { Coordinates, GameType, LobbyInfo, ResultData, User } from "~/types/appTypes";
import type { MsgGameEndData } from "~/types/socketTypes";

/** Only call from the captured authoritative GAME_END / FINISHED snapshot path. */
export type CompletedGameInput = Pick<MsgGameEndData["payload"], "phase" | "round" | "results" | "totalResults"> & {
    gameId: string;
    lobbyId: LobbyInfo["ID"];
    playerId: NonNullable<User["ID"]>;
    mode: GameType;
    roundCount: LobbyInfo["conf"]["numRounds"];
    /** Every revealed answer from authoritative finalized-round events or member archives. */
    answers: Record<number, Coordinates>;
    /** Final scored best rows, not the unscored raw guess history. */
    endResults: LobbyInfo["endResults"];
};

export interface JournalAttempt {
    attempt: ResultData["attempt"];
    guess: Coordinates;
    distanceMeters: ResultData["distance"];
    baseScore: ResultData["baseScr"];
}

export interface JournalRound {
    round: number;
    answer: Coordinates;
    attempts: JournalAttempt[];
    /** Null is no guess; distance 0 and coordinates {0, 0} are legitimate guesses. */
    bestAttempt: number | null;
    distanceMeters: number | null;
    baseScore: number;
    bonusScore: number;
    score: number;
}

export interface JournalMatch {
    gameId: string;
    lobbyId: string;
    playerId: NonNullable<User["ID"]>;
    mode: "BattleRoyale";
    completedAt: number;
    totalScore: number;
    rank: number;
    participants: number;
    rounds: JournalRound[];
}

export interface JournalDocument {
    version: 1;
    ownerId: NonNullable<User["ID"]>;
    matches: JournalMatch[];
}

export type JournalStorageStatus = "unloaded" | "saved" | "session" | "invalid";

export type JournalRecordResult =
    | { status: "recorded"; persistence: "device" | "session" }
    | { status: "duplicate" }
    | { status: "skipped"; reason: "not-client" | "identity" | "incomplete" | "unsupported-mode" | "invalid-storage" | "capacity" };

export interface JournalPersonalBests {
    highestScore: { score: number; gameId: string } | null;
    closestGuess: { distanceMeters: number; gameId: string; round: number } | null;
    highestRound: { score: number; gameId: string; round: number } | null;
    totalRounds: number;
    guessedRounds: number;
    totalAttempts: number;
}
