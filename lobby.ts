export async function createLobby() {
    const username = userInfo();
    const lobby_settings = lobbySettings();

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
        console.log(lobby_settings.value);
    }
}
