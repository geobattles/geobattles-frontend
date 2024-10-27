import type { LobbyInfo, Results, TotalResults } from "~/types";
import { WebSocketService } from "~/services/WebSocketService";

// LOBBY STATES
export const useLobbySettings = () => useState<LobbyInfo>("lobby_settings", () => ({} as LobbyInfo));
export const useLobbySettingsOriginal = () => useState<LobbyInfo>("lobby_settings_original", () => ({} as LobbyInfo));
export const useLobbyList = () => useState<string[]>("lobby_list", () => []);
export const useModifySettingsModal = () => useState<boolean>("modify_settings_modal", () => false);

export const useResults = () => useState<Results>("live_results", () => ({} as Results));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({} as TotalResults));

/**
 * Function handles lobby creation
 */
export const createLobby = async () => {
    const player_info = usePlayerInfo();
    const lobby_settings = useLobbySettings();
    const router = useRouter();

    const lobby_post_params = {
        name: `${player_info.value.username}'s Lobby`,
        roundTime: 100,
    };

    try {
        // Make post request to create lobby
        const authToken = getToken(); // Assuming you have a composable to get the auth token
        const response = await fetch(`${useBackendAPI().value}/lobby`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${authToken}`,
            },
            body: JSON.stringify(lobby_post_params),
        });
        if (!response.ok) throw new Error(`Failed to create lobby: ${response.statusText}`);

        // Await for created lobby data
        lobby_settings.value = await response.json();

        // Initialize WebSocket connection to created lobby
        const { initializeWebSocket } = useWebSocket();
        await initializeWebSocket(() => WebSocketService.getSocketUrl(lobby_settings.value.ID, player_info.value.username));

        // Redirect to created lobby
        router.push({ path: `/lobby/${lobby_settings.value.ID}` });
    } catch (error) {
        console.error("Error creating lobby:", error);
        throw error; // Re-throw the error for the caller to handle
    }
};

/**
 * Function is used to join a lobby. It will initialize socket connection
 * and connect player to a lobby. Will throw an error if connection fails.
 *
 * @param lobby_id
 */
export const joinLobby = async (lobby_id: string) => {
    const router = useRouter();
    try {
        const { initializeWebSocket } = useWebSocket();
        await initializeWebSocket(() => WebSocketService.getSocketUrl(lobby_id, usePlayerInfo().value.username));
        router.push({ path: `/lobby/${lobby_id}` });
    } catch (error: any) {
        console.error("Error joining lobby:", error);
        throw new Error("Could not connect to a lobby.");
    }
};

/**
 * Function will set user ID to undefined and close connection to the lobby.
 */
export const leaveLobby = () => {
    try {
        // usePlayerInfo().value.ID = undefined;
        const { closeConnection } = useWebSocket();
        closeConnection();
    } catch (error: any) {
        console.log(error.message);
        throw new Error("Could not leave lobby.");
    }
};

/**
 * Function is used when a player joins the lobby. It will update
 * lobby data and notify players.
 * @param lobby_info
 * @param player User id dedicated from server
 */
export const joinedLobby = (lobby_info: LobbyInfo, user_id: string) => {
    updateNestedLobbySettings(lobby_info);
    if (useLobbySettings().value.conf.ccList.length === 0) useLobbySettings().value.conf.ccList = useCountryList().value;

    if (!usePlayerInfo().value.ID) usePlayerInfo().value.ID = user_id; // Update player ID when player join lobby // TODO: Should be fixed somehow from backend
    console.log("Player " + user_id + " joined the lobby!"); //! Dev: Change this to toast later and to user name
};

/**
 * Function is used when a player leaves the lobby. It will update lobby data.
 * @param lobby_info
 * @param user_id
 */
export const leftLobby = (lobby_info: LobbyInfo, user_id: string) => {
    updateNestedLobbySettings(lobby_info);
    const results = useResults();
    const totalResults = useTotalResults();

    // Remove player from live results
    if (results.value[user_id]) {
        delete results.value[user_id];
    }

    // Remove player from total results
    if (totalResults.value[user_id]) {
        delete totalResults.value[user_id];
    }
};

/**
 * Function is called when updated lobby settings are received from server.
 * @param lobby_info
 */
export const fetchLobbySettings = (lobby_info: LobbyInfo) => {
    updateNestedLobbySettings(lobby_info);
    if (useLobbySettings().value.conf.ccList.length === 0) useLobbySettings().value.conf.ccList = useCountryList().value;
};

/**
 * Function is called when admin updates lobby settings.
 */
export const applyLobbySettings = () => {
    const ls = useLobbySettings();
    const lso = useLobbySettingsOriginal();

    //@ts-ignore If ccList is empty (=wrong input) dont send it so it wont update on server. Empty arrray if every country is selected
    if (ls.value.conf.ccList.length === 0) delete lso.value.conf.ccList;
    else if (ls.value.conf.ccList.length === useCountryList().value.length) ls.value.conf.ccList = [];

    // If objects are equal delete them from original settings, else update original settings
    for (const field in lso.value.conf) {
        //@ts-ignore  Nested objects (ccList) are always different so they are stringified and compared as such
        if (typeof lso.value.conf[field] == "object") {
            //@ts-ignore
            if (JSON.stringify(lso.value.conf[field]) == JSON.stringify(ls.value.conf[field])) delete lso.value.conf[field]; //@ts-ignore
            else lso.value.conf[field] = ls.value.conf[field];
        } else {
            //@ts-ignore
            if (lso.value.conf[field] === ls.value.conf[field]) delete lso.value.conf[field]; //@ts-ignore
            else lso.value.conf[field] = ls.value.conf[field];
        }
    }
    const settings = {
        command: "update_lobby_settings",
        conf: { ...lso.value.conf },
    };

    const { sendMessage } = useWebSocket();
    sendMessage(settings);
};

/**
 * Function updates LobbySettings and LobbySettingsOriginal states with new data.
 * To properly update deeply nested objects, this function is used.
 * @param lobby_info LobbyInfo object received from server
 */
const updateNestedLobbySettings = (lobby_info: LobbyInfo) => {
    const ls = useLobbySettings();
    const lso = useLobbySettingsOriginal();

    // Update info and nested lobby settings object
    ls.value = structuredClone(lobby_info);
    ls.value.conf = structuredClone(lobby_info.conf);
    lso.value = structuredClone(lobby_info);
    lso.value.conf = structuredClone(lobby_info.conf);

    const gameFlowManager = useGameFlowManager().value;
    if (gameFlowManager) {
        if (ls.value.conf.mode === 1) {
            gameFlowManager.updateGameMode("BattleRoyale");
        } else if (ls.value.conf.mode === 2) {
            gameFlowManager.updateGameMode("CountryBattle");
        } else {
            console.warn("Unknown game mode");
        }
    }
};

export const fetchLobbyList = async () => {
    const response = await fetch(`${useBackendAPI().value}/lobby`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Check if response is valid
    if (!response.ok) {
        throw new Error(response.statusText);
    } else {
        useLobbyList().value = await response.json();
    }
};

/**
 * Function check if lobby exists.
 * Will throw an error if lobby does not exist.
 * @param lobby_id
 * @returns
 */
export const checkIfLobby = async (lobby_id: string) => {
    await fetchLobbyList();
    if (!Object.keys(useLobbyList().value).includes(lobby_id)) throw new Error("Lobby does not exist");
};

/**
 * Returns true if player is admin of the lobby. Else returns false.
 * @returns
 */
export const isPlayerAdmin = () => {
    if (useLobbySettings().value.admin === usePlayerInfo().value.ID) return true;
    else return false;
};
