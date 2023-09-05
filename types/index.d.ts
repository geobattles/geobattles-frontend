export type User = {
    name: string;
    color: string;
    isConnectedToLobby: boolean;
};

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

export type LobbyInfo = {
    ID: string;
    admin: string;
    conf: LobbyConfig;
    currentRound: number;
    endResults: any; //TODO: Define this
    numPlayers: number;
    playerList: string[];
    results: any; //TODO: Define this
    totalResults: any; //TODO: Define this
};
