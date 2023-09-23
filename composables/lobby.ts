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

    const response = await fetch("http://localhost:8080/lobby", {
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
 * Function is used to join a lobby from a link or home page.
 *
 * @param lobby_id
 */
export const joinLobby = async (lobby_id: string) => {
    const router = useRouter();

    // TODO: Perfrom checks if lobby exists and is joinable

    // Create socket connection
    initializeSocketConnection(lobby_id);
    router.push({ path: `/lobby/${lobby_id}` });
};

/**
 * Function is used when a player joints the lobby. It will update
 * lobby data and notify players.
 *
 * @param lobby_info
 * @param player User id dedicated from server
 */
export const joinedLobby = (lobby_info: LobbyInfo, user_id: string) => {
    useLobbySettings().value = { ...structuredClone(lobby_info) };
    useLobbySettings().value.conf = { ...structuredClone(lobby_info.conf) };
    useLobbySettingsOriginal().value = { ...structuredClone(lobby_info) };
    useLobbySettingsOriginal().value.conf = { ...structuredClone(lobby_info.conf) };

    if (useLobbySettings().value.conf.ccList?.length === 0) {
        useLobbySettings().value.conf.ccList = useCountryList().value;
    }

    if (!usePlayerInfo().value.ID) usePlayerInfo().value.ID = user_id; // Update player ID if no ID yet
    console.log("Player " + user_id + " joined the lobby!"); // Change this to toast later and to user name
};

export const fetchLobbySettings = (lobby_info: LobbyInfo) => {
    console.log("fetchLobbySettings()"); //! Dev
    useLobbySettings().value = { ...structuredClone(lobby_info) };
    useLobbySettings().value.conf = { ...structuredClone(lobby_info.conf) };
    useLobbySettingsOriginal().value = { ...structuredClone(lobby_info) };
    useLobbySettingsOriginal().value.conf = { ...structuredClone(lobby_info.conf) };

    if (useLobbySettings().value.conf.ccList?.length === 0) useLobbySettings().value.conf.ccList = useCountryList().value;
};

export const applyLobbySettings = () => {
    // If ccList is empty (=wrong input) dont send it so it wont update on server. Empty arrray if every country is selected
    if (useLobbySettings().value.conf.ccList?.length === 0) delete useLobbySettingsOriginal().value.conf.ccList;
    else if (useLobbySettings().value.conf.ccList?.length === useCountryList().value.length) useLobbySettings().value.conf.ccList = [];

    // If objects are equal delete them from original settings, else update original settings
    for (const field in useLobbySettingsOriginal().value.conf) {
        // Nested objects (ccList) are always different so they are stringified and compared as such
        if (typeof useLobbySettingsOriginal().value.conf[field] == "object") {
            if (JSON.stringify(useLobbySettingsOriginal().value.conf[field]) == JSON.stringify(useLobbySettings().value.conf[field])) delete useLobbySettingsOriginal().value.conf[field];
            else useLobbySettingsOriginal().value.conf[field] = useLobbySettings().value.conf[field];
        } else {
            if (useLobbySettingsOriginal().value.conf[field] === useLobbySettings().value.conf[field]) delete useLobbySettingsOriginal().value.conf[field];
            else useLobbySettingsOriginal().value.conf[field] = useLobbySettings().value.conf[field];
        }
    }
    const settings = {
        command: "update_lobby_settings",
        conf: { ...useLobbySettingsOriginal().value.conf },
    };

    console.log(settings); //! Dev
    useSocketConnection().value.send(JSON.stringify(settings));
};
