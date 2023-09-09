// Type describing current user session
export type User = {
    name: string;
    color: string;
    isConnectedToLobby: boolean;
    ID?: string; // Only if in a lobby
};

// Type used to define lobby info
export type LobbyInfo = {
    ID: string;
    admin: string;
    conf: LobbyConfig;
    currentRound: number;
    endResults: any; //TODO: Define this
    numPlayers: number;
    playerList: playerListObject;
    results: any; //TODO: Define this
    totalResults: any; //TODO: Define this
};

// Type defines a list of players
export type playerListObject = {
    [key: string]: {
        name: string;
        color: string;
        powerups: number[];
    };
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

// Used for coordinates. Same as google.maps.LatLng
type Coordinates = {
    lat: number;
    lng: number;
};

// For handling all players results
export type Results = {
    [key: string]: ResultInfo;
};
type ResultInfo = {
    attempt: number;
    baseScr: number;
    distance: number;
    lives: number;
    location: Coordinates;
};

// Main socket type interface
export type SocketMessage = {
    status: SocketStatus;
    type: SocketType;
    lobby?: LobbyInfo;
    user?: string;
    location?: Coordinates;
    playerRes?: ResultInfo;
    roundRes?: Results;
    totalResults?: Results;
};

type GameFlow = "WAITING" | "STARTING" | "PLAYING" | "MID-ROUND" | "FINISHED" | undefined; // Undefined when not connected to a lobby (socket)
