import type { LobbyInfo, Coordinates, ResultInfo } from "~/types";

export const initializeSocketConnection = (lobby_id: string): void => {
    const socket = new WebSocket("http://localhost:8080".replace(/(http)(s)?\:\/\//, "ws$2://") + `/lobbySocket?id=${lobby_id}&name=${usePlayerInfo().value.name}`);
    const username = usePlayerInfo();

    // Save socket connection to state
    useSocketConnection().value = socket;

    socket.onopen = () => {
        console.log("Socket connection established");
        username.value.isConnectedToLobby = true; // Set user state to connected
    };
    socket.onerror = (error) => {
        console.log(`WebSocket error: ${error}`);
        username.value.isConnectedToLobby = false; // Set user state to connected
    };
    socket.onclose = () => {
        console.log("Socket connection closed");
        username.value.isConnectedToLobby = false; // Set user state to connected
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data); //! Dev
        parseSocketMessage(data);
    };
};

const parseSocketMessage = (data: any) => {
    switch (data.type) {
        case "JOINED_LOBBY":
            joinedLobby(data.lobby as LobbyInfo, data.user as string);
            break;
        case "UPDATED_LOBBY":
            useLobbySettings().value = data.lobby as LobbyInfo; // Update lobby settings state
            break;
        case "START_ROUND":
            useCoordinates().value = data.location as Coordinates;
            startRound();
            break;
        case "NEW_RESULT":
            useResults().value[data.user as string] = data.playerRes as ResultInfo;
            break;
        case "ROUND_RESULT" || "TIMES_UP":
            break;
        default:
            break;
    }
};
