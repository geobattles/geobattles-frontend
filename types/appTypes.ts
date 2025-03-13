// ====================== User data ======================
export type User = {
    username: string;
    displayName: string;
    ID: string | undefined; // Only if in a lobby\
    color: string;
    guest: boolean | undefined;
};

// ====================== Lobby data ======================
export type LobbyInfo = {
    ID: string;
    admin: string;
    conf: LobbyConfig;
    currentRound: number;
    numPlayers: number;
    playerList: playerListObject;
    results: Results;
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
};

// Type defines a list of players
export type playerListObject = {
    [key: string]: {
        name: string;
        color: string;
        lives: number;
        powerups: number[];
        connected: boolean;
    };
};

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
