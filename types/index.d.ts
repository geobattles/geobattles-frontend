// Type describing current user session
export type User = {
    username: string;
    password: string;
    ID: string; // Only if in a lobby

    color: string;
    isConnectedToLobby: boolean;
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
    };
};

type CountryFlagMap = Map<string, { name: string; x: number; y: number }>;

// Used for coordinates. Same as google.maps.LatLng
type Coordinates = {
    lat: number;
    lng: number;
};

// For handling all players results
export type Results = {
    [key: string]: ResultsInfo;
};
interface ResultsInfo {
    attempt: number;
    baseScr: number;
    distance: number;
    lives: number;
    location: Coordinates;
    cc: string;
    player_countries: string[];
}

export type TotalResults = {
    [key: string]: TotalResultInfo;
};

interface TotalResultInfo extends ResultInfo {
    total: number | undefined; // Not defined by backend if user scores 0 points
}

type GameFlow = "WAITING" | "STARTING" | "PLAYING" | "MID-ROUND" | "FINISHED" | undefined; // Undefined when not connected to a lobby (socket)

type GameType = "BattleRoyale" | "CountryBattle" | undefined; // Undefined when not connected to a lobby (socket)

interface GameMode {
    startRound(): void;
    finishRound(totalResults: TotalResults, roundResults: Results, polygon?: any): void;
    finishGame(): void;
    processMapPin(coordinates: Coordinates): void;
    processNewResult(user: string, player_result: ResultsInfo): void;
    processClickedCountry?(polygon: any, country_code: string): void;
    gameType: GameType;
    // Add other common methods here
}
