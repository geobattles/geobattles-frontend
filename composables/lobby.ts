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
        username.value.isConnectedToLobby = true; // Set user state to connected
    }
};

export const joinLobby = () => {};
