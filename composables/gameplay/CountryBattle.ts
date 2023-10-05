import { Coordinates, ResultsInfo } from "~/types";

export class CountryBattle extends Gameplay {
    static selected_country: string | undefined = undefined;
    static selected_countries: string[] = [];
    static total_attempts = new Map<string | number, number>();

    static startRound = () => {
        useGameFlow().value = "STARTING"; // Change game flow state
        setTimeout(() => (useGameFlow().value = "PLAYING"), 3000); // For 3 seconds countdown

        const router = useRouter();
        if (router.currentRoute.value.name !== "gameplay") router.push({ path: `/gameplay/CountryBattle-${useLobbySettings().value.ID}` }); // Redirect to gameplay page if not already there
        else updatePanoramaView(useCoordinates().value); // Update panorama view for next round

        // Clear Map before starting round
        removePolyLinesFromMap(true);
        removeMarkersFromMap(true);

        if (useGoogleMap().value) {
            setMapCenter({ lat: 0, lng: 0 });
            setMapZoom(2);
        }

        const results = useResults(); // Get results from state
        for (const player_id in results.value) this.total_attempts.set(player_id, results.value[player_id].lives);
    };

    static processMapPin = (coordinates: Coordinates) => {
        if (useGameFlow().value !== "PLAYING") return;
        useCurrentPin().value = coordinates; // Save current pin coordinates to state

        const socket_message = {
            command: "loc_to_cc",
            location: { ...coordinates },
        };

        useSocketConnection().value.send(JSON.stringify(socket_message));
    };

    static submitGuess = () => {
        const socket_message = {
            command: "submit_location",
            location: { ...useCurrentPin().value },
        };
        useSocketConnection().value.send(JSON.stringify(socket_message));
    };

    /**
     * Method will draw a polygon of the country on a GoogleMap
     * @param polygon Arrays of coordinates to be passed to geojson.
     * @param country_code Country code
     */
    static processClickedCountry = (polygon: any, country_code: string) => {
        const player_id = usePlayerInfo().value.ID;
        const results = useResults().value;
        if (!player_id) throw new Error("Player ID is not defined");

        const nr_polygons = this.numberOfDrawnPolygons();

        // If there are no lives available, return
        if (useResults().value[player_id].lives === 0) {
            console.log("All lives are used!!"); // TODO: Make toast that all lives are used.
            return;
        }

        // Return if clicked on the same country
        if (country_code === this.selected_country) return;

        // Place first pin if no pins yet, or if pins and submits are the same
        if (nr_polygons === 0 || results[player_id].attempt === nr_polygons) {
            // Draw polygon to map and push to selected countries
            console.log("Drawin polygon to map"); //! Dev
            this.drawPolygonToMap(polygon, country_code);
            this.selected_country = country_code;
            return;
        }

        // If no submitted results yet || there are stii lives left, change last marker position
        if (!results[player_id] || results[player_id].lives > 0) {
            const map_instance = isGoogleMap();
            map_instance.data.forEach((e) => {
                //@ts-ignore
                if (this.selected_country === e.h.id) map_instance.data.remove(e);
            });
            this.drawPolygonToMap(polygon, country_code);
            this.selected_country = country_code; // Set new selected_country
            return;
        }
    };

    /**
     * @returns Number of drawn polygons on the map
     */
    static numberOfDrawnPolygons = () => {
        const map_instance = isGoogleMap();
        let count = 0;
        map_instance.data.forEach(() => count++);
        return count;
    };

    static processNewResult = (user: string, player_result: ResultsInfo) => {
        const results = useResults().value; // Get results from state

        // Remove click event listner if player guessed country or ran out of lives
        if (player_result.lives === 0 || player_result.cc === "XX") removeMapEventListener("click");

        // Update results
        if (player_result.baseScr < results[user]?.baseScr || player_result.baseScr === 0) {
            // Update attempts and lives, not the score or distance
            results[user].lives = player_result.lives;
            results[user].attempt = player_result.attempt;
        } else {
            results[user] = player_result; // Update everything
            // Sort results by score
            useResults().value = Object.fromEntries(Object.entries(results).sort(([, a], [, b]) => a.distance - b.distance));
        }

        // Create or update player countries array
        if (!results[user].player_countries) results[user].player_countries = [player_result.cc];
        else results[user].player_countries.push(player_result.cc);
    };

    /**
     * Method draws new polygon to the existing google map.
     * @param {*} polygon_coordinates
     */
    static drawPolygonToMap = (polygon_coordinates: any, country: string) => {
        let geo_json = {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: polygon_coordinates,
                clickable: false,
            },
            properties: {
                id: "",
            },
        };

        geo_json.properties.id = country;
        addGeoJSON(geo_json);
    };
}
