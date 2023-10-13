import type { LobbyInfo } from "~/types";
/**
 * Function handles lobby creation
 */
export const createLobby = async () => {
    const player_info = usePlayerInfo();
    const lobby_settings = useLobbySettings();
    const router = useRouter();

    // Define post parameters for lobby creation
    const lobby_post_params = {
        name: player_info.value.name || "Player" + "'s Lobby",
        roundTime: 30,
    };

    const response = await fetch(`${useBackendAPI().value}/lobby`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...lobby_post_params }), // Empty body means gather today's data
    });

    // Check if response is valid
    if (!response.ok) {
        throw new Error(response.statusText);
    } else {
        lobby_settings.value = await response.json();
        console.log(lobby_settings.value); //! Dev

        // Initialize socket connection
        initializeSocketConnection(lobby_settings.value.ID);

        // On success redirect to lobby page
        router.push({ path: `/lobby/${lobby_settings.value.ID}` });
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
        await initializeSocketConnection(lobby_id); // Create socket connection
        router.push({ path: `/lobby/${lobby_id}` });
    } catch (error: any) {
        console.log(error.message); // Log socket error
        throw new Error("Could not connect to a lobby.");
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

    if (!usePlayerInfo().value.ID) usePlayerInfo().value.ID = user_id; // Update player ID if no ID yet
    console.log("Player " + user_id + " joined the lobby!"); //! Dev: Change this to toast later and to user name
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

    // console.log(settings); //! Dev
    useSocketConnection().value.send(JSON.stringify(settings));
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

    // Define gametype
    if (ls.value.conf.mode === 1) useGameType().value = "BattleRoyale";
    else if (ls.value.conf.mode === 2) useGameType().value = "CountryBattle";
    else useGameType().value = undefined;
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
        console.log(useLobbyList().value); //! Dev
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
    const lobby_settings = useLobbySettings();
    if (lobby_settings.value.admin === usePlayerInfo().value.ID) return true;
    else return false;
};
