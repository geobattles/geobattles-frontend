import { Coordinates, RoundResults, TotalResults, ResultsInfo } from "~/types";

export class BattleRoyale extends Gameplay {
    static startRound = () => {
        useGameFlow().value = "STARTING"; // Change game flow state
        setTimeout(() => (useGameFlow().value = "PLAYING"), 3000); // For 3 seconds countdown

        const router = useRouter();
        if (router.currentRoute.value.name !== "gameplay") router.push({ path: `/gameplay/BattleRoyale-${useLobbySettings().value.ID}` }); // Redirect to gameplay page if not already there
        else updatePanoramaView(useCoordinates().value); // Update panorama view for next round

        // Clear Map before starting round
        removePolyLinesFromMap(true);
        removeMarkersFromMap(true);

        if (useGoogleMap().value) {
            setMapCenter({ lat: 0, lng: 0 });
            setMapZoom(2);
        }
    };

    static finishRound = (total_results: TotalResults, round_results: RoundResults) => {
        useGameFlow().value = "MID-ROUND"; // Change game flow state

        // Apply total results
        useTotalResults().value = total_results;
        useTotalResults().value = Object.fromEntries(Object.entries(useTotalResults().value).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));

        // Apply round results
        useRoundResults().value = round_results; // Just refresh round results with data from server.

        // Edit map
        removeMarkersFromMap(true);
        const marker = createSearchedLocationMarker(useCoordinates().value);
        useMapMarkers().value.push(marker); // Save marker to state

        // Draw player pins and polylines to searched location
        const round_res = useRoundResults().value;
        for (const key in round_res) {
            if (Object.keys(round_res[key].location).length === 0) continue; // Skip if location object is empty

            drawPolyLine(useCoordinates().value, round_res[key].location);

            const color = getPlayerColorByID(key);
            if (!color) throw new Error("Player color is not defined");

            const marker = addNewMapMarker(round_res[key].location, color);
            useMapMarkers().value.push(marker); // Save marker to state
        }
        setTimeout(() => {
            this.setMapBounds();
        }, 1000);
    };

    static processMapPin = (coordinates: Coordinates) => {
        if (useGameFlow().value !== "PLAYING") return;

        useCurrentPin().value = coordinates; // Save current pin coordinates to state

        const used_pins = useMapMarkers().value.length; // Number of guesses already made iun current round
        const player_id = getPlayerIDFromName(usePlayerInfo().value.name);
        if (!player_id) throw new Error("Player ID is not defined");

        // START OF PIN PLACEMENT LOGIC
        // If there are no lives available, return
        if (useResults().value[player_id].lives === 0) {
            console.log("All lives are used!!"); // TODO: Make toast that all lives are used.
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

        // If no submitted results yet || there are stii lives left, change last marker position
        if (!useResults().value[player_id] || useResults().value[player_id].lives > 0) {
            const last_marker = useMapMarkers().value[used_pins - 1]; // Get last marker
            last_marker.setPosition(coordinates); // Change last marker position
            return;
        }
        // END OF PIN PLACEMENT LOGIC
    };

    /**
     * Function is used to change GoogleMap HTMLElement position in the DOM. This is used
     * to minimize GoogleMaps API usage. With such approach, GoogleMap is only loaded for
     * every user once in a lobby instance.
     *
     * @param google_map
     */
    static googleMapDOMTracker = (google_map: HTMLElement) => {
        const game_flow = useGameFlow();
        watch(game_flow, (newVal) => {
            console.log("Game flow changed to: " + newVal); //! Dev
            if (newVal === "MID-ROUND") {
                const mid_round_cointainer = document.getElementById("midround_container"); // Element is found in GameplayMidRound component.
                if (google_map && mid_round_cointainer) {
                    mid_round_cointainer.appendChild(google_map);

                    // Chnage class
                    google_map.classList.add("google-map-midround"); // Change class
                    google_map.classList.remove("google-map-hover");
                    google_map.classList.remove("google-map-gameplay");
                }
            }
            if (newVal === "PLAYING") {
                const mid_round_cointainer = document.getElementById("gameplay_container");
                if (google_map && mid_round_cointainer) {
                    mid_round_cointainer.appendChild(google_map);

                    // Change class
                    google_map.classList.remove("google-map-midround"); // Change class
                    google_map.classList.add("google-map-gameplay");
                }
            }
        });
    };

    /**
     * Function is used to set map bounds to fit all displayed markers.
     */
    static setMapBounds = () => {
        let bounds = new google.maps.LatLngBounds();

        const round_res = useRoundResults().value;
        for (const key in round_res) {
            if (Object.keys(round_res[key].location).length === 0) continue; // Skip if location object is empty
            bounds.extend(round_res[key].location);
        }
        bounds.extend(useCoordinates().value);

        // Dont fit bounds if there is only one marker on map (only searched location marker)
        if (useMapMarkers().value.length === 1) {
            setMapZoom(3);
            setMapCenter(useCoordinates().value);
            return;
        } else {
            // Fit all displayed markers bounds
            if (bounds) fitCustomBounds(bounds, 50);
            // TODO: Fix the zooming problem ???
            // console.log("BOUNDS", bounds); //! Development
            // console.log(bounds.getCenter().lat(), bounds.getCenter().lng()); //! Development
        }
    };

    static processNewResult = (user: string, player_result: ResultsInfo) => {
        const results = useResults().value; // Get results from state

        if (player_result.baseScr < results[user]?.baseScr || (player_result.baseScr === 0 && player_result.distance > results[user].distance)) {
            // Update attempts and lives, not the score or distance
            results[user].lives = player_result.lives;
            results[user].attempt = player_result.attempt;
        } else {
            results[user] = player_result; // Update everything
            // Sort results by score
            useResults().value = Object.fromEntries(Object.entries(results).sort(([, a], [, b]) => a.distance - b.distance));
        }
        useIsSubmitDisabled().value = false; // Enable submit button
    };
}
