import { type SocketMessage } from "~/types";
import { SocketType } from "~/types/enums";

export const useSocketConnection = () => useState<WebSocket>("socket_connection", () => ({} as WebSocket));

/**
 * Function that initializes socket connection to the server.
 * It connects player to a lobby.
 * @param lobby_id
 */
export const initializeSocketConnection = (lobby_id: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(`${useBackendAPI().value}`.replace(/(http)(s)?\:\/\//, "ws$2://") + `/lobbySocket?id=${lobby_id}&name=${usePlayerInfo().value.name}`);
        const username = usePlayerInfo();

        // Save socket connection to state
        useSocketConnection().value = socket;

        socket.onopen = () => {
            console.log("Socket connection established");
            username.value.isConnectedToLobby = true; // Set user state to connected
            useGameFlow().value = "WAITING";
            resolve(socket);
        };
        socket.onerror = (error) => {
            console.log(`WebSocket error: ${error}`);
            username.value.isConnectedToLobby = false; // Set user state to disconnected
            useGameFlow().value = undefined;
            reject();
        };
        socket.onclose = () => {
            console.log("Socket connection closed");
            username.value.isConnectedToLobby = false; // Set user state to disconnected
            useGameFlow().value = undefined;
        };
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data); //! Dev
            parseSocketMessage(data);
        };
    });
};

/**
 * Parses socket message and performs actions based on the type of message
 * @param data
 */
const parseSocketMessage = (data: SocketMessage) => {
    switch (data.type) {
        case SocketType.JOINED_LOBBY:
            // Perform checks
            if (!data.lobby) throw new Error(`Lobby data in SocketMessage type: ${data.type} is not defined`);
            if (!data.user) throw new Error(`User data in SocketMessage type: ${data.type} is not defined`);

            // Process
            joinedLobby(data.lobby, data.user);

            break;
        case SocketType.LEFT_LOBBY:
            // Perform checks
            if (!data.lobby) throw new Error(`Lobby data in SocketMessage type: ${data.type} is not defined`);
            if (!data.user) throw new Error(`User data in SocketMessage type: ${data.type} is not defined`);

            // Process
            leftLobby(data.lobby, data.user);

            break;
        case SocketType.UPDATED_LOBBY:
            // Perform checks
            if (!data.lobby) throw new Error(`Lobby data in SocketMessage type: ${data.type} is not defined`);

            // Process
            fetchLobbySettings(data.lobby);

            break;
        case SocketType.START_ROUND:
            // Perform checks
            if (!data.location) throw new Error(`Location for search in SocketMessage type: ${data.type} is not defined.`);
            if (!data.players) throw new Error(`Players info in SocketMessage type: ${data.type} is not defined.`);

            // Process
            useCoordinates().value = data.location; // Set new search location
            useResults().value = data.players; // Set new player results for live statistics

            if (useGameType().value === "CountryBattle") CountryBattle.startRound();
            else if (useGameType().value === "BattleRoyale") BattleRoyale.startRound();

            break;
        case SocketType.NEW_RESULT:
            // Perform checks
            if (!data.playerRes) throw new Error(`Player result in SocketMessage type: ${data.type}  is not defined`);
            if (!data.user) throw new Error(`User data in SocketMessage type: ${data.type} is not defined`);

            // Process
            if (useGameType().value === "BattleRoyale") BattleRoyale.processNewResult(data.user, data.playerRes);
            else if (useGameType().value === "CountryBattle") CountryBattle.processNewResult(data.user, data.playerRes);

            break;
        case SocketType.ROUND_RESULT:
            // Perform checks
            if (!data.totalResults) throw new Error(`totalResults in SocketMessage type: ${data.type} is not defined`);
            if (!data.roundRes) throw new Error(`roundRes in SocketMessage type: ${data.type} is not defined`);
            if (!data.polygon && useGameType().value === "CountryBattle") throw new Error(`Searched polygon coordinates in SocketMessage type: ${data.type} is not defined`);

            // Process
            if (useGameType().value === "BattleRoyale") BattleRoyale.finishRound(data.totalResults, data.roundRes);
            else if (useGameType().value === "CountryBattle") CountryBattle.finishRound(data.totalResults, data.roundRes, data.polygon);

            break;
        case SocketType.TIMES_UP:
            // TODO: anything??
            break;
        case SocketType.ROUND_FINISHED:
            // TODO: anything??
            break;
        case SocketType.COUNTRY_CODE:
            // Perform checks
            if (!data.polygon) throw new Error(`Polygon in SocketMessage type: ${data.type} is not defined`);
            if (!data.cc) throw new Error(`Countrycode in SocketMessage type: ${data.type} is not defined`);

            // Process
            CountryBattle.processClickedCountry(data.polygon, data.cc);
            break;
        case SocketType.GAME_END:
            // Perform checks
            if (!data.totalResults) throw new Error(`totalResults in SocketMessage type: ${data.type} is not defined`);

            // Process
            useGameFlow().value = "FINISHED";
            // TODO: Process Endgame results and stuff

            break;
        default:
            throw new Error("Unknown socket message type: " + data.type);
    }
};

export const closeSocketConnection = () => {
    useSocketConnection().value.close();
    useSocketConnection().value = {} as WebSocket;
};

export const sendSocketMessage = () => {
    // TODO
};
