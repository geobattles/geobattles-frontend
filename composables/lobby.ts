import type { LobbyInfo } from "~/types";

/**
 * Function handles lobby creation
 */
export const createLobby = async () => {
    const username = usePlayerInfo();
    const lobby_settings = useLobbySettings();
    const router = useRouter();

    // Define post parameters for lobby creation
    const lobby_post_params = {
        name: username.value.name || "Player" + "'s Lobby",
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
    useLobbySettings().value = lobby_info; // Update lobby settings state
    if (!usePlayerInfo().value.ID) usePlayerInfo().value.ID = user_id; // Update player ID if no ID yet
    console.log("Player " + user_id + " joined the lobby!"); // Change this to toast later and to user name
};
