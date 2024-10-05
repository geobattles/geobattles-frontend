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
        const gameFlow = useGameFlow();

        socket.onopen = () => {
            console.log("WebSocket connection established");
            playerInfo.value.isConnectedToLobby = true; // Set user state to connected
            gameFlow.value = "WAITING";
            resolve(socket);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            playerInfo.value.isConnectedToLobby = false; // Set user state to disconnected
            gameFlow.value = undefined;
            reject(error);
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed");
            playerInfo.value.isConnectedToLobby = false; // Set user state to disconnected
            gameFlow.value = undefined;
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
    [SocketType.COUNTRY_CODE]: MsgCCData;
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
    [SocketType.COUNTRY_CODE]: handleCC,
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

function handleStartRound(data: MsgStartRoundData) {
    if (!data.location || !data.players) {
        console.error("Missing data in START_ROUND message", data);
        return;
    }
    Gameplay.searched_location_coords.value = data.location; // Set new search location
    useResults().value = data.players; // Set new player results for live statistics

    const gameType = useGameType().value;
    if (gameType === "CountryBattle") {
        CountryBattle.startRound();
    } else if (gameType === "BattleRoyale") {
        BattleRoyale.startRound();
    }
}

function handleNewResult(data: MsgNewResultData) {
    if (!data.playerRes || !data.user) return console.error("Missing data in NEW_RESULT message", data);

    const gameType = useGameType().value;
    if (gameType === "BattleRoyale") {
        BattleRoyale.processNewResult(data.user, data.playerRes);
    } else if (gameType === "CountryBattle") {
        CountryBattle.processNewResult(data.user, data.playerRes);
    }
}

function handleRoundResult(data: MsgRoundResultData) {
    if (!data.totalResults || !data.roundRes) return console.error("Missing data in ROUND_RESULT message", data);

    const gameType = useGameType().value;
    if (gameType === "BattleRoyale") {
        BattleRoyale.finishRound(data.totalResults, data.roundRes);
    } else if (gameType === "CountryBattle") {
        if (!data.polygon) {
            console.error("Missing polygon data in ROUND_RESULT message for CountryBattle", data);
            return;
        }
        CountryBattle.finishRound(data.totalResults, data.roundRes, data.polygon);
    }
}

function handleTimesUp(data: MsgTimesUpData) {
    return;
}

function handleRoundFinished(data: MsgRoundFinishedData) {
    return;
}

function handleCC(data: MsgCCData) {
    if (!data.polygon || !data.cc) {
        console.error("Missing data in CC message", data);
        return;
    }
    CountryBattle.processClickedCountry(data.polygon, data.cc);
}

function handleGameEnd(data: MsgGameEndData) {
    if (!data.totalResults) {
        console.error("Missing data in GAME_END message", data);
        return;
    }
    useGameFlow().value = "FINISHED";
    // TODO: Process endgame results and display them
}

function handleNoCountry(data: MsgNoCountryData) {
    return;
}
