import type {
    MsgJoinedLobbyData,
    MsgLeftLobbyData,
    MsgUpdatedLobbyData,
    MsgStartRoundData,
    MsgNewResultData,
    MsgRoundResultData,
    MsgCCData,
    MsgGameEndData,
    MsgTimesUpData,
    MsgRoundFinishedData,
    MsgNoCountryData,
    MsgRejoinRound,
} from "~/types/socketTypes";
import { SocketType } from "~/types/socketTypes";

// Messages that client sends to the server
export const SOCKET_COMMANDS = {
    START: "start",
    SUBMIT_LOCATION: "submit_location",
    LOC_TO_CC: "loc_to_cc",
    UPDATE_LOBBY_SETTINGS: "update_lobby_settings",
};

// Map SocketType to the corresponding message data types
interface SocketMessageMap {
    [SocketType.JOINED_LOBBY]: MsgJoinedLobbyData;
    [SocketType.LEFT_LOBBY]: MsgLeftLobbyData;
    [SocketType.REJOIN_ROUND]: MsgRejoinRound;
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
    [SocketType.REJOIN_ROUND]: handleRejoinRound,
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
    joinedLobby({ ...data.lobby }, data.user);

    // Apply the live round results when player joins the lobby
    const resultsStore = useResultsStore();
    // @ts-ignore (ignore until proper definition is synched from backend)
    resultsStore.liveResults = { ...data.lobby.playerList };
    resultsStore.syncLiveResults({ ...data.lobby.results[data.lobby.currentRound] });
}

function handleLeftLobby(message: MsgLeftLobbyData) {
    const uiManager = useUIManagerStore();
    const { leftLobby } = useLobbyStore();
    const data = message.payload;
    if (!data.lobby || !data.user) return console.error("Missing data in LEFT_LOBBY message", data);
    uiManager.showPlayerLeftToast(getPlayerNameFromID(data.user) ?? "Unknown Player");
    leftLobby(data.lobby, data.user);
}

async function handleRejoinRound(message: MsgRejoinRound) {
    const data = message.payload;
    if (!data.location || !data.players || !data.timeRemaining || !data.fullroundRes) return console.error("Missing data in REJOIN_ROUND message", data);

    const gameMode = useGameMode();
    // Update the searched location coordinates
    gameMode.modeLogic.setSearchedLocationCoords(data.location);

    // Update the time remaining
    const lobbyStore = useLobbyStore();
    lobbyStore.rejoinTimer = Math.round(data.timeRemaining / 1000);

    // Start the round
    await gameMode.startRound(false);

    // Apply the live round results
    const resultsStore = useResultsStore();
    resultsStore.liveResults = data.players;
    resultsStore.syncLiveResults(data.fullroundRes);
}

function handleUpdatedLobby(message: MsgUpdatedLobbyData) {
    const { fetchLobbySettings } = useLobbyStore();
    const data = message.payload;
    if (!data.lobby) return console.error("Missing lobby data in UPDATED_LOBBY message", data);
    fetchLobbySettings(data.lobby);
}

function handleStartRound(message: MsgStartRoundData) {
    // Extract and validate data from the message
    const data = message.payload;
    if (!data.location || !data.players) return console.error("Missing data in START_ROUND message", data);

    // Apply the searched location coordinates and start the round
    const gameMode = useGameMode();
    gameMode.modeLogic.setSearchedLocationCoords(data.location);
    gameMode.startRound();

    // TODO: Should update lobby settings here or at least the round. But its not being sent from the backend yet

    // Set new player results for live statistics
    const resultsStore = useResultsStore();
    resultsStore.liveResults = data.players;

    const lobbyStore = useLobbyStore();
    if (lobbyStore.lobbySettings) lobbyStore.lobbySettings.currentRound++;
}

function handleNewResult(message: MsgNewResultData) {
    // Extract and validate data from the message
    const data = message.payload;
    if (!data.playerRes || !data.user) return console.error("Missing data in NEW_RESULT message", data);

    // Process the new result
    const resultsStore = useResultsStore();
    resultsStore.applySingleResult(data.user, data.playerRes);
}

function handleRoundResult(message: MsgRoundResultData) {
    const gameMode = useGameMode();
    const data = message.payload;

    if (!data.totalResults || !data.roundRes) return console.error("Missing data in ROUND_RESULT message", data);
    if (!data.polygon && gameMode.currentMode === "CountryBattle") return console.error("Missing polygon data in ROUND_RESULT message for CountryBattle", data);

    // Apply the round results and total results
    const resultsStore = useResultsStore();
    resultsStore.syncRoundResults(data.roundRes);
    resultsStore.syncTotalResults(data.totalResults);

    // Finish the round in the game mode
    gameMode.finishRound(data.round, data.polygon);
}

function handleTimesUp(data: MsgTimesUpData) {
    return;
}

function handleRoundFinished(data: MsgRoundFinishedData) {
    // Set the rejoin timer to null
    const lobbyStore = useLobbyStore();
    lobbyStore.rejoinTimer = null;
    return;
}

function handleCC(messsage: MsgCCData) {
    const data = messsage.payload;
    const gameMode = useGameMode();
    if (!data.polygon || !data.cc) return console.error("Missing data in CC message", data);

    gameMode.processClickedCountry(data.polygon, data.cc);
}

function handleGameEnd(messsge: MsgGameEndData) {
    // Extract and validate data from the message
    const data = messsge.payload;
    if (!data.totalResults) return console.error("Missing data in GAME_END message", data);

    const gameMode = useGameMode();
    gameMode.finishGame();
    // TODO: Process endgame results and display them

    const lobbyStore = useLobbyStore();
    if (lobbyStore.lobbySettings) lobbyStore.lobbySettings.currentRound = 0;
}

function handleNoCountry(data: MsgNoCountryData) {
    return;
}
