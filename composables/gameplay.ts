import { Coordinates, RoundResults, TotalResults } from "~/types";

// Start the game
export const startRound = () => {
    useGameFlow().value = "STARTING"; // Change game flow state
    setTimeout(() => (useGameFlow().value = "PLAYING"), 3000); // For 3 seconds countdown

    const router = useRouter();
    if (router.currentRoute.value.name !== "gameplay") router.push("/gameplay"); // Redirect to gameplay page if not already there
    else updatePanoramaView(useCoordinates().value); // Update panorama view for next round
};

// Send signal to backend to start new round
export const nextRound = () => {
    const game = {
        command: "start",
    };
    useSocketConnection().value.send(JSON.stringify(game));
};

export const finishRound = (total_results: TotalResults, round_results: RoundResults) => {
    useGameFlow().value = "MID-ROUND"; // Change game flow state

    // Apply total results
    useTotalResults().value = total_results;
    useTotalResults().value = Object.fromEntries(Object.entries(useTotalResults().value).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));

    // Apply round results
    useRoundResults().value = round_results; // Just refresh round results with data from server.

    // Edit map
    removeMarkersFromMap();
    deleteSavedMarkers();
};

export const processMapPin = (coordinates: Coordinates) => {
    useCurrentPin().value = coordinates; // Save current pin coordinates to state

    const used_pins = useMapMarkers().value.length; // Number of guesses already made iun current round
    const player_id = getPlayerIDFromName(usePlayerInfo().value.name);
    if (!player_id) throw new Error("Player ID is not defined");

    // START OF PIN PLACEMENT LOGIC
    // If there are no lives available, return
    if (useResults().value[player_id]?.lives === 0) {
        console.log("All lives are used!!"); // TODO: Make toast that all lives are used.
        return;
    }

    // Place first pin if no pins yet, or if pins and submits are the same
    if (used_pins === 0 || useResults().value[player_id]?.attempt === used_pins) {
        const marker = addNewMapMarker(coordinates); // Create new marker
        useMapMarkers().value.push(marker); // Add marker to markers state
        return;
    }

    // If no submitted results yet || there are stii lives left, change last marker position
    if (!useResults().value[player_id] || useResults().value[player_id].lives > 0) {
        const last_marker = useMapMarkers().value[used_pins - 1]; // Get last marker
        last_marker.setPosition(coordinates); // Change last marker position
        return;
    }
    // END OF PIN PLACEMENT LOGIC
};

export const submitGuess = () => {
    const socket_message = {
        command: "submit_location",
        location: useCurrentPin().value,
    };

    useSocketConnection().value.send(JSON.stringify(socket_message));
};

/**
 * Function is used to change GoogleMap HTMLElement position in the DOM. This is used
 * to minimize GoogleMaps API usage. With such approach, GoogleMap is only loaded for
 * every user once in a lobby instance.
 *
 * @param google_map
 */
export const googleMapDOMTracker = (google_map: HTMLElement) => {
    const game_flow = useGameFlow();

    watch(game_flow, (newVal) => {
        console.log(newVal);
        if (newVal === "MID-ROUND") {
            const mid_round_cointainer = document.getElementById("midround_container"); // Element is found in GameplayMidRound component.
            if (google_map && mid_round_cointainer) {
                console.log("appending child");
                mid_round_cointainer.appendChild(google_map);
                // TODO: Change Map styles
            }
        }
        if (newVal === "PLAYING") {
            const mid_round_cointainer = document.getElementById("gameplay_container");
            if (google_map && mid_round_cointainer) {
                console.log("appending child");
                mid_round_cointainer.appendChild(google_map);
                // TODO: Change Map styles
            }
        }
    });
};

export const showRoundResults = () => {};
