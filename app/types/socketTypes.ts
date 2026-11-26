import {
    type Coordinates,
    type LiveResultsHashMap,
    type LobbyInfo,
    type Results,
    type ResultData,
    type TotalResults,
    type LobbyPhase,
    type playerListObject,
    type Powerup,
} from "~/types/appTypes";

import type { PowerupCommand, PowerupEffect, PowerupState } from "./powerups";

export enum SocketStatus {
    NORMAL = "OK",
    WARNING = "WRN",
    ERROR = "ERR",
}

export enum SocketType {
    POWERUP_STATE = "POWERUP_STATE",
    POWERUP_USED = "POWERUP_USED",
    POWERUP_READY = "POWERUP_READY",
    DUEL_FROM = "DUEL_FROM",
    JOINED_LOBBY = "JOINED_LOBBY",
    LEFT_LOBBY = "LEFT_LOBBY",
    REJOIN_ROUND = "REJOIN_ROUND",
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

export interface SocketEnvelope {
    /** Lobby event order, not a contiguous replay log. Reset on a new socket. */
    seq?: number;
}

export interface GameIdentity {
    gameId?: string;
}

export interface RequestErrorMessage extends SocketEnvelope {
    status: SocketStatus.ERROR;
    type: "REQUEST_ERROR";
    payload: { command: string; code: string; message: string };
}

// Main socket type interface
export interface SocketMessage<T = unknown> extends SocketEnvelope {
    status: SocketStatus;
    type: SocketType;
    payload: T & GameIdentity;
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

export type MsgRejoinRound = SocketMessage<{
    phase: LobbyPhase;
    round: number;
    lobby: LobbyInfo;
    location?: Coordinates;
    players: playerListObject;
    powerLog: Powerup[];
    timeRemaining: number;
    fullroundRes: LiveResultsHashMap;
    roundRes: Results;
    totalResults: TotalResults;
}>;

export type MsgUpdatedLobbyData = SocketMessage<{
    lobby: LobbyInfo;
}>;

export type MsgStartRoundData = SocketMessage<{
    powerupState?: PowerupState;
    location: Coordinates;
    players: playerListObject;
    powerLog: Powerup[];
    phase: "PLAYING";
    round: number;
    /** Server deadline remainder in milliseconds, including preparation time. */
    timeRemaining?: number;
}>;

export type MsgNewResultData = SocketMessage<{
    playerRes: ResultData;
    user: string;
    round: number;
    phase: "PLAYING";
}>;

export type MsgRoundResultData = SocketMessage<{
    powerupState?: PowerupState;
    powerLog: Powerup[];
    round: number;
    players: playerListObject;
    fullroundRes: LiveResultsHashMap;
    location: Coordinates;
    totalResults: TotalResults;
    roundRes: Results;
    phase: "MID-ROUND" | "FINISHED";
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
    endedEarly?: boolean;
    players?: playerListObject;
    powerupState?: PowerupState;
    results: Record<number, LiveResultsHashMap>;
    /** Detached scored history/answers; optional for older servers. */
    endResults?: LobbyInfo["endResults"];
    revealedAnswers?: Record<number, Coordinates>;
    totalResults: TotalResults;
    phase: "FINISHED";
    round: number;
}>;

export type MsgNoCountryData = SocketMessage<{
    no_country: any;
}>;

export type LobbySettingsPatch = Partial<Omit<LobbyInfo["conf"], "scoreScaleKm" | "ccList">> & { ccList?: string[] | null };

export type SocketCommand =
    | PowerupCommand
    | { command: "start"; gameId?: string; round?: number }
    | { command: "end_game"; gameId: string; round: number }
    | { command: "setReady"; ready: boolean }
    | { command: "submit_location"; location: Coordinates }
    | { command: "update_lobby_settings"; conf: LobbySettingsPatch };

type EventPayloads = {
    [SocketType.POWERUP_STATE]: { gameId?: string; round: number; phase: LobbyPhase; players: playerListObject; powerupState: PowerupState };
    [SocketType.POWERUP_USED]: { gameId: string; requestId: string; effect: PowerupEffect; powerupState: PowerupState; players: playerListObject };
    [SocketType.POWERUP_READY]: { gameId: string; requestId: string; powerupState: PowerupState };
    [SocketType.DUEL_FROM]: { user: string; gameId: string; round: number; effectId: string };
    [SocketType.JOINED_LOBBY]: MsgJoinedLobbyData["payload"];
    [SocketType.LEFT_LOBBY]: MsgLeftLobbyData["payload"];
    [SocketType.REJOIN_ROUND]: MsgRejoinRound["payload"];
    [SocketType.UPDATED_LOBBY]: MsgUpdatedLobbyData["payload"];
    [SocketType.START_ROUND]: MsgStartRoundData["payload"];
    [SocketType.NEW_RESULT]: MsgNewResultData["payload"];
    [SocketType.ROUND_RESULT]: MsgRoundResultData["payload"];
    [SocketType.GAME_END]: MsgGameEndData["payload"];
    [SocketType.ROUND_FINISHED]: undefined;
    [SocketType.TIMES_UP]: undefined;
    [SocketType.NO_COUNTRY]: undefined;
    [SocketType.CC]: { polygon?: unknown; cc?: string };
};

export type GameSocketEvent<T extends SocketType = SocketType> = { [K in T]: { type: K; payload: EventPayloads[K] } }[T];
export type SocketEventHandlers = { [T in SocketType]: (event: GameSocketEvent<T>) => void };
