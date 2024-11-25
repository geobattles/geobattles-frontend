import { type Coordinates, type LobbyInfo, type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";

export enum SocketStatus {
    NORMAL = "OK",
    WARNING = "WRN",
    ERROR = "ERR",
}

export enum SocketType {
    JOINED_LOBBY = "JOINED_LOBBY",
    LEFT_LOBBY = "LEFT_LOBBY",
    UPDATED_LOBBY = "UPDATED_LOBBY",
    START_ROUND = "START_ROUND",
    NEW_RESULT = "NEW_RESULT",
    ROUND_RESULT = "ROUND_RESULT",
    TIMES_UP = "TIMES_UP",
    ROUND_FINISHED = "ROUND_FINISHED",
    CC = "CC",
    GAME_END = "GAME_END",
    NO_COUNTRY = "NO_COUNTRY",
}

// Main socket type interface
export interface SocketMessage<T = any> {
    status: number;
    type: SocketType;
    payload: T;
}

// Define types for each message type
export type MsgJoinedLobbyData = SocketMessage<{
    lobby: LobbyInfo;
    user: string;
}>;

export type MsgLeftLobbyData = SocketMessage<{
    lobby: LobbyInfo;
    user: string;
}>;

export type MsgUpdatedLobbyData = SocketMessage<{
    lobby: LobbyInfo;
}>;

export type MsgStartRoundData = SocketMessage<{
    location: Coordinates;
    players: Results;
}>;

export type MsgNewResultData = SocketMessage<{
    playerRes: ResultsInfo;
    user: string;
}>;

export type MsgRoundResultData = SocketMessage<{
    powerLog: any;
    round: number;
    totalResults: TotalResults;
    roundRes: any;
    polygon?: any;
}>;

export type MsgTimesUpData = SocketMessage<{
    polygon: any;
    cc: string;
}>;

export type MsgRoundFinishedData = SocketMessage<{
    polygon: any;
    cc: string;
}>;

export type MsgCCData = SocketMessage<{
    polygon: any;
    cc: string;
}>;

export type MsgGameEndData = SocketMessage<{
    totalResults: TotalResults;
}>;

export type MsgNoCountryData = SocketMessage<{
    no_country: any;
}>;
