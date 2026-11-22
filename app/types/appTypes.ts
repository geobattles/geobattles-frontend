import type { PowerupState } from "./powerups";

// ====================== User data ======================
export type User = {
    username: string;
    displayName: string;
    ID: string | undefined; // Only if in a lobby\
    color: string;
    guest: boolean | undefined;
};

// ====================== Lobby data ======================
export type LobbyPhase = "WAITING" | "PLAYING" | "MID-ROUND" | "FINISHED";

export type LobbyInfo = {
    ID: string;
    /** Stable for one successfully started match, including recovery/results. */
    gameId?: string;
    admin: string;
    conf: LobbyConfig;
    currentRound: number;
    phase: LobbyPhase;
    round: number;
    endResults: Record<number, Results>;
    /** Member-only answers for finalized rounds; absent on public/legacy snapshots. */
    revealedAnswers?: Record<number, Coordinates>;
    fullroundRes: LiveResultsHashMap;
    roundRes: Results;
    timeRemaining: number;
    powerLog: Powerup[];
    powerupState?: PowerupState;
    location?: Coordinates;
    numPlayers: number;
    playerList: playerListObject;
    results: {
        [round: number]: LiveResultsHashMap;
    };
    totalResults: TotalResults;
};

// Type used to define lobby settings
type LobbyConfig = {
    name: string;
    ccList: string[];
    dynLives: boolean;
    maxPlayers: number;
    mode: number;
    numAttempt: number;
    numRounds: number;
    placeBonus: boolean;
    powerups: boolean[];
    roundTime: number;
    scoreFactor: number;
    /** New servers default to region-adaptive scoring; manual is an Advanced override. */
    scoringMode?: "auto" | "manual";
    /** Server-computed half-score decay distance in kilometres. Never sent as an override. */
    scoreScaleKm?: number;
};

// Type defines a list of players
export type Player = {
    name: string;
    color: string;
    lives?: number; // Backend omits zero lives.
    powerups?: boolean[];
    connected: boolean;
    /** Optional for older servers; only explicit true counts as ready. */
    ready?: boolean;
};
export type playerListObject = Record<string, Player>;
export type Powerup = { type: number; source: string; target?: string };

// ====================== RESULTS TYPES ======================
export type Results = {
    [key: string]: ResultData;
};

// Single result data
export interface ResultData {
    attempt: number;
    baseScr: number;
    distance: number;
    lives: number;
    location: Coordinates;
    placeScr?: number;
    dblScr?: number;
    duelScr?: number;
    total?: number;
    time?: number;
    cc?: string;
    player_countries?: string[];
}

export type TotalResults = {
    [key: string]: TotalResultInfo;
};

// Single total result data
interface TotalResultInfo extends ResultData {
    total: number | undefined; // Not defined by backend if user scores 0 points
}

// Hash map of live results
export type LiveResultsHashMap = {
    [key: string]: Array<ResultData>;
};

// ====================== GameType and GameState ======================
export type GameType = "BattleRoyale" | "CountryBattle"; // Undefined when not connected to a lobby (socket)

export enum GameState {
    WAITING = "WAITING",
    STARTING = "STARTING",
    PLAYING = "PLAYING",
    MID_ROUND = "MID-ROUND",
    FINISHED = "FINISHED",
}

// ====================== Extra ======================
export type CountryFlagMap = Map<string, { name: string; x: number; y: number }>;
export type Coordinates = {
    lat: number;
    lng: number;
};
