import { type SocketMessage } from "~/types";
import { SocketType } from "~/types/enums";

export const initializeSocketConnection = (lobby_id: string): void => {
    const socket = new WebSocket("http://localhost:8080".replace(/(http)(s)?\:\/\//, "ws$2://") + `/lobbySocket?id=${lobby_id}&name=${usePlayerInfo().value.name}`);
    const username = usePlayerInfo();

    // Save socket connection to state
    useSocketConnection().value = socket;

    socket.onopen = () => {
        console.log("Socket connection established");
        username.value.isConnectedToLobby = true; // Set user state to connected
        useGameFlow().value = "WAITING";
    };
    socket.onerror = (error) => {
        console.log(`WebSocket error: ${error}`);
        username.value.isConnectedToLobby = false; // Set user state to connected
        useGameFlow().value = undefined;
    };
    socket.onclose = () => {
        console.log("Socket connection closed");
        username.value.isConnectedToLobby = false; // Set user state to connected
        useGameFlow().value = undefined;
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data); //! Dev
        parseSocketMessage(data);
    };
};

const parseSocketMessage = (data: SocketMessage) => {
    switch (data.type) {
        case SocketType.JOINED_LOBBY:
            // Perform checks
            if (!data.lobby) throw new Error(`Lobby data in SocketMessage type: ${SocketType.JOINED_LOBBY} is not defined`);
            if (!data.user) throw new Error(`User data in SocketMessage type: ${SocketType.JOINED_LOBBY} is not defined`);

            // Process
            joinedLobby(data.lobby, data.user);
            break;
        case SocketType.UPDATED_LOBBY:
            // Perform checks
            if (!data.lobby) throw new Error(`Lobby data in SocketMessage type: ${SocketType.UPDATED_LOBBY} is not defined`);

            // Process
            useLobbySettings().value = data.lobby; // Update lobby settings state
            break;
        case SocketType.START_ROUND:
            // Perform checks
            if (!data.location) throw new Error(`Location for search in SocketMessage type: ${SocketType.START_ROUND} is not defined.`);

            // Process
            useCoordinates().value = data.location;
            startGame();
            break;
        case SocketType.NEW_RESULT:
            // Perform checks
            if (!data.playerRes) throw new Error(`Player result in SocketMessage type: ${SocketType.NEW_RESULT}  is not defined`);
            if (!data.user) throw new Error(`User data in SocketMessage type: ${SocketType.NEW_RESULT} is not defined`);

            // Process
            processNewResult(data.user, data.playerRes);
            break;
        case SocketType.ROUND_RESULT || SocketType.TIMES_UP:
            // Perform checks
            if (!data.totalResults) throw new Error(`totalResults in SocketMessage type: ${SocketType.ROUND_RESULT} is not defined`);
            finishRound();
            break;
        default:
            break;
    }
};

export const sendSocketMessage = () => {
    // TODO
};
