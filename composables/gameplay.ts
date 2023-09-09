import { Coordinates } from "~/types";

export const startGame = () => {
    useGameFlow().value = "PLAYING"; // Change game flow state

    const router = useRouter();
    router.push("/gameplay");
};

export const nextRound = () => {
    // Start new round
    const game = {
        command: "start",
    };
    useSocketConnection().value.send(JSON.stringify(game));
};

export const endRound = () => {};

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

export const finishRound = () => {
    useGameFlow().value = "MID-ROUND"; // Change game flow state
};

export const googleMapDOMTracker = (google_map: HTMLElement) => {
    const game_flow = useGameFlow();

    watch(game_flow, (newVal) => {
        console.log(newVal);
        if (newVal === "MID-ROUND") {
            const mid_round_cointainer = document.getElementById("midround_container"); // Element is found in GameplayMidRound component.
            if (google_map && mid_round_cointainer) {
                console.log("appending child");
                mid_round_cointainer.appendChild(google_map);
                // TODO: Change Map styles to be larger
            }
        }
        if (newVal === "PLAYING") {
            const mid_round_cointainer = document.getElementById("playing");
            if (google_map && mid_round_cointainer) {
                console.log("appending child");
                mid_round_cointainer.appendChild(google_map);
                // TODO: Change Map styles to be larger
            }
        }
    });
};
