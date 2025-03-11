// Type describing current user session
export type User = {
    username: string;
    displayName: string;
    ID: string | undefined; // Only if in a lobby\
    color: string;
    guest: boolean | undefined;
};

// Type used to define lobby info
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

export type CountryFlagMap = Map<string, { name: string; x: number; y: number }>;

// Used for coordinates. Same as google.maps.LatLng
export type Coordinates = {
    lat: number;
    lng: number;
};

// For handling all players results
export type Results = {
    [key: string]: ResultsInfo;
};

export interface ResultsInfo {
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

interface TotalResultInfo extends ResultsInfo {
    total: number | undefined; // Not defined by backend if user scores 0 points
}

interface LiveResults {
    attempt: number;
    baseScr: number;
    distance: number;
    lives: number;
    location: Coordinates;
}

export type LiveResultsHashMap = {
    [key: string]: Array<LiveResults>;
};

export type GameFlow = "WAITING" | "STARTING" | "PLAYING" | "MID-ROUND" | "FINISHED" | undefined; // Undefined when not connected to a lobby (socket)

export type GameType = "BattleRoyale" | "CountryBattle"; // Undefined when not connected to a lobby (socket)

export enum GameState {
    WAITING = "WAITING",
    STARTING = "STARTING",
    PLAYING = "PLAYING",
    MID_ROUND = "MID-ROUND",
    FINISHED = "FINISHED",
}
