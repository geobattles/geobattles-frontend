import type { MsgJoinedLobbyData, MsgLeftLobbyData, MsgUpdatedLobbyData, MsgStartRoundData, MsgNewResultData, MsgRoundResultData, MsgCCData, MsgGameEndData, MsgTimesUpData, MsgRoundFinishedData, MsgNoCountryData } from "~/types/socketTypes"; // Adjust the path according to your project structure
import { SocketType } from "~/types/socketTypes"; // Adjust the path according to your project structure

// Map SocketType to the corresponding message data types
interface SocketMessageMap {
    [SocketType.JOINED_LOBBY]: MsgJoinedLobbyData;
    [SocketType.LEFT_LOBBY]: MsgLeftLobbyData;
    [SocketType.UPDATED_LOBBY]: MsgUpdatedLobbyData;
    [SocketType.START_ROUND]: MsgStartRoundData;
    [SocketType.NEW_RESULT]: MsgNewResultData;
    [SocketType.ROUND_RESULT]: MsgRoundResultData;
    [SocketType.TIMES_UP]: MsgTimesUpData;
    [SocketType.ROUND_FINISHED]: MsgRoundFinishedData;
    [SocketType.CC]: MsgCCData;
    [SocketType.GAME_END]: MsgGameEndData;
    [SocketType.NO_COUNTRY]: MsgNoCountryData;
}

// Map of message handlers
export const messageHandlers: {
    [K in SocketType]: (data: SocketMessageMap[K]) => void;
} = {
    [SocketType.JOINED_LOBBY]: handleJoinedLobby,
    [SocketType.LEFT_LOBBY]: handleLeftLobby,
    [SocketType.UPDATED_LOBBY]: handleUpdatedLobby,
    [SocketType.START_ROUND]: handleStartRound,
    [SocketType.NEW_RESULT]: handleNewResult,
    [SocketType.ROUND_RESULT]: handleRoundResult,
    [SocketType.TIMES_UP]: handleTimesUp,
    [SocketType.ROUND_FINISHED]: handleRoundFinished,
    [SocketType.CC]: handleCC,
    [SocketType.GAME_END]: handleGameEnd,
    [SocketType.NO_COUNTRY]: handleNoCountry,
};

// Implement handlers for each message type
function handleJoinedLobby(message: MsgJoinedLobbyData) {
    const { joinedLobby } = useLobbyStore();
    const data = message.payload;
    if (!data.lobby || !data.user) return console.error("Missing data in JOINED_LOBBY message", data);
    joinedLobby(data.lobby, data.user);
}

function handleLeftLobby(message: MsgLeftLobbyData) {
    const { leftLobby } = useLobbyStore();
    const data = message.payload;
    if (!data.lobby || !data.user) return console.error("Missing data in LEFT_LOBBY message", data);
    useUIManager().value.showPlayerLeftToast(getPlayerNameFromID(data.user) ?? "Unknown Player");
    leftLobby(data.lobby, data.user);
}

function handleUpdatedLobby(message: MsgUpdatedLobbyData) {
    const { fetchLobbySettings } = useLobbyStore();
    const data = message.payload;
    if (!data.lobby) return console.error("Missing lobby data in UPDATED_LOBBY message", data);
    fetchLobbySettings(data.lobby);
}

/**
 * This function is called when a START_ROUND message is received from the server.
 * It sets up the new searched location for the round and inits the frontend results
 * based on the players of the lobby aka data.players.
 *
 * @param data - The data received from the START_ROUND message
 */
function handleStartRound(message: MsgStartRoundData) {
    const data = message.payload;
    if (!data.location || !data.players) return console.error("Missing data in START_ROUND message", data);

    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");
    gameFlowManager.searchedLocationCoords.value = data.location;

    useLiveResults().value = data.players; // Set new player results for live statistics

    const gameType = gameFlowManager.gameMode.gameType;

    switch (gameType) {
        case "CountryBattle":
            gameFlowManager.startRound();
            break;
        case "BattleRoyale":
            gameFlowManager.startRound();
            break;
        default:
            console.warn(`Unhandled game type: ${gameType}`);
    }

    // Log the start of the new round
    console.log(`New round started. Game type: ${gameType}, Players:`, data.players);
}

function handleNewResult(message: MsgNewResultData) {
    const data = message.payload;
    if (!data.playerRes || !data.user) return console.error("Missing data in NEW_RESULT message", data);
    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

    const gameType = gameFlowManager.gameMode.gameType;
    if (gameType === "BattleRoyale") {
        gameFlowManager.processNewResult(data.user, data.playerRes);
    } else if (gameType === "CountryBattle") {
        gameFlowManager.processNewResult(data.user, data.playerRes);
    }
}

function handleRoundResult(message: MsgRoundResultData) {
    const data = message.payload;
    if (!data.totalResults || !data.roundRes) return console.error("Missing data in ROUND_RESULT message", data);
    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

    // Update gameRound in ganeFlowManager
    gameFlowManager.gameRound = data.round;

    // Call gameType finishRound
    const gameType = gameFlowManager.gameMode.gameType;
    switch (gameType) {
        case "BattleRoyale":
            gameFlowManager.finishRound(data.totalResults, data.roundRes);
            break;
        case "CountryBattle":
            if (!data.polygon) return console.error("Missing polygon data in ROUND_RESULT message for CountryBattle", data);
            gameFlowManager.finishRound(data.totalResults, data.roundRes, data.polygon);
            break;
        default:
            console.warn(`Unhandled game type in handleRoundResult: ${gameType}`);
    }
}

function handleTimesUp(data: MsgTimesUpData) {
    return;
}

function handleRoundFinished(data: MsgRoundFinishedData) {
    return;
}

function handleCC(messsage: MsgCCData) {
    const data = messsage.payload;
    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

    if (!data.polygon || !data.cc) {
        console.error("Missing data in CC message", data);
        return;
    }

    const gameType = gameFlowManager.gameMode.gameType;
    if (gameType === "CountryBattle") gameFlowManager.gameMode.processClickedCountry?.(data.polygon, data.cc);
}

function handleGameEnd(messsge: MsgGameEndData) {
    const data = messsge.payload;
    if (!data.totalResults) return console.error("Missing data in GAME_END message", data);

    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

    gameFlowManager.finishGame();
    gameFlowManager.gameRound = 0;
    // TODO: Process endgame results and display them
}

function handleNoCountry(data: MsgNoCountryData) {
    return;
}
