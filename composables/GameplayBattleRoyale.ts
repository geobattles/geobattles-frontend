import type { Coordinates, TotalResults, ResultsInfo, Results, GameMode, GameType } from "~/types";
import { GameFlowManager, GameState } from "./GameFlowManager";

export class BattleRoyale implements GameMode {
    private gameFlowManager: GameFlowManager;
    public gameType: GameType;

    constructor(gameFlowManager: GameFlowManager) {
        this.gameFlowManager = gameFlowManager;
        this.gameType = "BattleRoyale";
    }

    startRound(): void {
        const router = useRouter();
        const route_name = router.currentRoute.value.name as string;

        // Redirect to gampeplay route if not already there
        if (!route_name.includes("gameplay")) {
            router.push({ path: `/gameplay-${useLobbySettings().value.ID}` });
        } else {
            updatePanoramaView(this.gameFlowManager.searchedLocationCoords.value);
            isGoogleMap().setCenter({ lat: 0, lng: 0 });
            isGoogleMap().setZoom(2);
        }

        removePolyLinesFromMap(true);
        removeMarkersFromMap(true);
    }

    finishRound(total_results: TotalResults, round_results: Results): void {
        // Apply total results
        useTotalResults().value = total_results;
        useTotalResults().value = Object.fromEntries(Object.entries(useTotalResults().value).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));

        removeMarkersFromMap(true); // Remove all markers from map

        // Add searched location marker
        const marker = createSearchedLocationMarker(this.gameFlowManager.searchedLocationCoords.value);
        useMapMarkers().value.push(marker); // Save marker to state

        // Draw player pins and polylines to searched location
        const round_res = round_results;
        for (const key in round_res) {
            if (Object.keys(round_res[key].location).length === 0) continue; // Skip if location object is empty

            drawPolyLine(this.gameFlowManager.searchedLocationCoords.value, round_res[key].location);

            const color = getPlayerColorByID(key);
            if (!color) throw new Error("Player color is not defined");

            const marker = addNewMapMarker(round_res[key].location, color);
            useMapMarkers().value.push(marker); // Save marker to state
        }

        setMapZoom(3);
        setTimeout(() => {
            this.setMapBounds(round_res);
        }, 300);
    }

    finishGame(): void {
        removePolyLinesFromMap(true);
        removeMarkersFromMap(true);
    }

    // Keyword this wont work at start?
    // Yes, this is true at the start. The 'this' keyword won't work as expected because this method is called by GoogleMap.addListener
    processMapPin(coordinates: Coordinates): void {
        const gameFlowManager = useGameFlowManager().value;
        if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

        if (gameFlowManager.currentState !== GameState.PLAYING) return;
        gameFlowManager.currentMapPin.value = coordinates;

        const used_pins = useMapMarkers().value.length; // Number of guesses already made in current round
        const player_id = getPlayerIDFromName(usePlayerInfo().value.name);
        if (!player_id) throw new Error("Player ID is not defined");

        // START OF PIN PLACEMENT LOGIC
        if (useResults().value[player_id].lives === 0) {
            console.warn("All lives are used!!"); // TODO: Make toast that all lives are used.
            return;
        }

        // Place first pin if no pins yet, or if pins and submits are the same
        if (used_pins === 0 || useResults().value[player_id].attempt === used_pins) {
            // get player color from name
            const color = getPlayerColorByName(usePlayerInfo().value.name);
            if (!color) throw new Error("Player color is not defined");
            const marker = addNewMapMarker(coordinates, color); // Create new marker
            useMapMarkers().value.push(marker); // Add marker to markers state
            return;
        }

        // If no submitted results yet || there are stil lives left, change last marker position
        if (!useResults().value[player_id] || useResults().value[player_id].lives > 0) {
            const last_marker = useMapMarkers().value[used_pins - 1]; // Get last marker
            last_marker.setPosition(coordinates); // Change last marker position
            return;
        }
        // END OF PIN PLACEMENT LOGIC
    }

    // Implement other methods (finishRound, processMapPin, etc.) similarly
    static poly_lines_array: Ref<google.maps.Polyline[]> = ref([]); // Array of polylines on the map

    /**
     * Function is used to set map bounds to fit all displayed markers.
     */
    setMapBounds(round_results: Results): void {
        let bounds = new google.maps.LatLngBounds();

        for (const key in round_results) {
            if (Object.keys(round_results[key].location).length === 0) continue; // Skip if location object is empty
            bounds.extend(round_results[key].location);
        }
        bounds.extend(this.gameFlowManager.searchedLocationCoords.value);

        // Dont fit bounds if there is only one marker on map (only searched location marker)
        if (useMapMarkers().value.length === 1) {
            isGoogleMap().setCenter(this.gameFlowManager.searchedLocationCoords.value);
            return;
        } else {
            if (bounds) fitCustomBounds(bounds, 50); // Fit all displayed markers bounds
        }
    }

    /**
     * Function process new result sent from the server. It updates the results state and
     * applies styles to the player leaderboard during gameplay based on the new result.
     *
     * @param user_id - Player's ID whos result was sent
     * @param player_result - Object that contains information about player's processing result
     */
    processNewResult(user_id: string, player_result: ResultsInfo): void {
        const results = useResults().value; // Get results from state
        const leader_before = Object.keys(results).reduce((a, b) => (results[a].distance < results[b].distance ? a : b)); // Returns player ID

        if (player_result.baseScr < results[user_id]?.baseScr || (player_result.baseScr === 0 && player_result.distance > results[user_id].distance)) {
            // Update attempts and lives, not the score or distance
            results[user_id].lives = player_result.lives;
            results[user_id].attempt = player_result.attempt;
        } else {
            results[user_id] = player_result; // Update everything because the new user's result is better than current best
            useResults().value = Object.fromEntries(Object.entries(results).sort(([, a], [, b]) => a.distance - b.distance)); // Sort results by score
        }

        const new_leader = Object.keys(results).reduce((a, b) => (results[a].distance < results[b].distance ? a : b)); // Returns player ID

        GameFlowManager.applyGuessStyles(user_id, leader_before, new_leader);
    }
}
