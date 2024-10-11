import type { SocketMessage, MsgJoinedLobbyData, MsgLeftLobbyData, MsgUpdatedLobbyData, MsgStartRoundData, MsgNewResultData, MsgRoundResultData, MsgCCData, MsgGameEndData, MsgTimesUpData, MsgRoundFinishedData, MsgNoCountryData } from "~/types/socketTypes"; // Adjust the path according to your project structure
import { SocketType } from "~/types/socketTypes"; // Adjust the path according to your project structure

// Define default socket connection state
export const useSocketConnection = () => useState<WebSocket | null>("socket_connection", () => null);

/**
 * Initializes a WebSocket connection to the server and connects the player to a lobby.
 * @param lobby_id - The ID of the lobby to connect to.
 * @returns A promise that resolves with the WebSocket instance when connected.
 */
export const initializeSocketConnection = (lobby_id: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        const backendAPI = useBackendAPI().value;
        if (!backendAPI) return reject(new Error("Backend API is undefined"));

        const apiUrl = backendAPI.replace(/(http)(s)?:\/\//, "ws$2://");
        const lobbyId = encodeURIComponent(lobby_id);
        const playerName = encodeURIComponent(usePlayerInfo().value.name);
        const socketUrl = `${apiUrl}/lobbySocket?id=${lobbyId}&name=${playerName}`;
        const socket = new WebSocket(socketUrl);

        // Save socket connection to state
        useSocketConnection().value = socket;

        const playerInfo = usePlayerInfo();

        socket.onopen = () => {
            console.log("WebSocket connection established");
            playerInfo.value.isConnectedToLobby = true; // Set user state to connected
            resolve(socket);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            playerInfo.value.isConnectedToLobby = false; // Set user state to disconnected
            reject(error);
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed");
            playerInfo.value.isConnectedToLobby = false; // Set user state to disconnected
            // TODO: Implement reconnection logic here
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Received WebSocket message:", data); //! Dev

                parseSocketMessage(data);
            } catch (e) {
                console.error("Error parsing WebSocket message:", e);
            }
        };
    });
};

// Function to close the WebSocket connection and clean up
export const closeSocketConnection = () => {
    const socket = useSocketConnection().value;
    if (socket) {
        socket.close();
        useSocketConnection().value = null;
    }
};

// Function to send a message over the WebSocket connection
export const sendSocketMessage = (message: any) => {
    const socket = useSocketConnection().value;
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error("WebSocket is not open. Cannot send message:", message);
    }
};

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
const messageHandlers: {
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

// Function to parse and handle incoming socket messages
const parseSocketMessage = (data: any) => {
    const type = data.type; // Extract socket message type

    if (isValidSocketType(type)) {
        const handler = messageHandlers[type]; // Get the handler function for the message type
        if (handler) handler(data); // Type assertion due to dynamic type at runtime
        else console.warn(`No handler for socket message type: ${type}`);
    } else {
        console.warn(`Unknown socket message type: ${type}`);
    }
};

// Function to check if a given string is a valid SocketType
const isValidSocketType = (type: string): type is SocketType => {
    return Object.values(SocketType).includes(type as SocketType);
};

// Implement handlers for each message type
function handleJoinedLobby(data: MsgJoinedLobbyData) {
    if (!data.lobby || !data.user) return console.error("Missing data in JOINED_LOBBY message", data);
    joinedLobby(data.lobby, data.user);
}

function handleLeftLobby(data: MsgLeftLobbyData) {
    if (!data.lobby || !data.user) return console.error("Missing data in LEFT_LOBBY message", data);
    leftLobby(data.lobby, data.user);
}

function handleUpdatedLobby(data: MsgUpdatedLobbyData) {
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
function handleStartRound(data: MsgStartRoundData) {
    if (!data.location || !data.players) return console.error("Missing data in START_ROUND message", data);

    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");
    gameFlowManager.searchedLocationCoords.value = data.location;

    useResults().value = data.players; // Set new player results for live statistics

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

function handleNewResult(data: MsgNewResultData) {
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

function handleRoundResult(data: MsgRoundResultData) {
    if (!data.totalResults || !data.roundRes) return console.error("Missing data in ROUND_RESULT message", data);
    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

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

function handleCC(data: MsgCCData) {
    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

    if (!data.polygon || !data.cc) {
        console.error("Missing data in CC message", data);
        return;
    }

    const gameType = gameFlowManager.gameMode.gameType;
    if (gameType === "CountryBattle") gameFlowManager.gameMode.processClickedCountry?.(data.polygon, data.cc);
}

function handleGameEnd(data: MsgGameEndData) {
    if (!data.totalResults) return console.error("Missing data in GAME_END message", data);

    const gameFlowManager = useGameFlowManager().value;
    if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

    gameFlowManager.finishGame();
    // TODO: Process endgame results and display them
}

function handleNoCountry(data: MsgNoCountryData) {
    return;
}
