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
    // Extract and validate data from the message
    const data = message.payload;
    if (!data.location || !data.players) return console.error("Missing data in START_ROUND message", data);

    // Apply the searched location coordinates and start the round
    const gameStore = useGameplayStore();
    gameStore.searchedLocationCoords = data.location;
    gameStore.startRound();

    // Set new player results for live statistics
    useLiveResults().value = data.players;
}

function handleNewResult(message: MsgNewResultData) {
    // Extract and validate data from the message
    const data = message.payload;
    if (!data.playerRes || !data.user) return console.error("Missing data in NEW_RESULT message", data);

    // Process the new result
    const gameStore = useGameplayStore();
    gameStore.processNewResult(data.user, data.playerRes);
}

function handleRoundResult(message: MsgRoundResultData) {
    const gameStore = useGameplayStore();
    const data = message.payload;

    if (!data.totalResults || !data.roundRes) return console.error("Missing data in ROUND_RESULT message", data);
    if (!data.polygon && gameStore.currentMode === "CountryBattle") return console.error("Missing polygon data in ROUND_RESULT message for CountryBattle", data);

    // Apply the total results and finish the round
    gameStore.currentRound = data.round;
    gameStore.finishRound(data.totalResults, data.roundRes);
}

function handleTimesUp(data: MsgTimesUpData) {
    return;
}

function handleRoundFinished(data: MsgRoundFinishedData) {
    return;
}

function handleCC(messsage: MsgCCData) {
    const data = messsage.payload;
    const gameStore = useGameplayStore();
    if (!data.polygon || !data.cc) {
        console.error("Missing data in CC message", data);
        return;
    }
    gameStore.processClickedCountry(data.polygon, data.cc);
}

function handleGameEnd(messsge: MsgGameEndData) {
    // Extract and validate data from the message
    const data = messsge.payload;
    if (!data.totalResults) return console.error("Missing data in GAME_END message", data);

    const gameStore = useGameplayStore();
    gameStore.finishGame();
    // TODO: Process endgame results and display them
}

function handleNoCountry(data: MsgNoCountryData) {
    return;
}
