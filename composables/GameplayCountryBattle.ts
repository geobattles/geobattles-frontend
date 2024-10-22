import type { Coordinates, ResultsInfo, TotalResults, Results, GameType } from "~/types";
import type { GameMode } from "~/types";
import { GameFlowManager, GameState } from "../services/GameFlowManager";

export class CountryBattle implements GameMode {
    private gameFlowManager: GameFlowManager;
    public gameType: GameType;

    constructor(gameFlowManager: GameFlowManager) {
        this.gameFlowManager = gameFlowManager;
        this.gameType = "CountryBattle";
    }

    private selected_country: string | undefined = undefined;
    private selected_countries: string[] = [];
    private searched_polygon: google.maps.Data | undefined = undefined;

    startRound(): void {
        const router = useRouter();
        const route_name = router.currentRoute.value.name as string;

        // Redirect to gameplay routes if not already there
        if (!route_name.includes("gameplay")) router.push({ path: `/gameplay-${useLobbySettings().value.ID}` });

        // Reset panorama and map views
        if (useGoogleMapHTML().value && useGooglePanoramaHTML().value) {
            updatePanoramaView(this.gameFlowManager.searchedLocationCoords.value);
            isGoogleMap().setCenter({ lat: 0, lng: 0 });
            isGoogleMap().setZoom(2);

            // Clear Map before starting round
            this.deleteAllPolygons();
            addMapClickListener(this.processMapPin); // Add click listener to map as it is somehow removed the initial one in onMounted hook
        }

        removePolyLinesFromMap(true);
        removeMarkersFromMap(true);

        // const results = useResults(); // Get results from state
        // for (const player_id in results.value) this.total_attempts.set(player_id, results.value[player_id].lives);
    }

    processMapPin(coordinates: Coordinates): void {
        const gameFlowManager = useGameFlowManager().value;
        if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

        if (gameFlowManager.currentState !== GameState.PLAYING) return;
        gameFlowManager.currentMapPin.value = coordinates; // Save current pin coordinates to state

        const socket_message = {
            command: "loc_to_cc",
            location: { ...coordinates },
        };

        const { sendMessage } = useWebSocket();
        sendMessage(socket_message);
    }

    /**
     * Method will draw a polygon of the country on a GoogleMap
     * @param polygon Arrays of coordinates to be passed to geojson.
     * @param country_code Country code
     */
    processClickedCountry(polygon: any, country_code: string): void {
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
            this.drawCountryPolygon(polygon, country_code);
            this.selected_country = country_code;
            return;
        }

        // If no submitted results yet || there are stii lives left, change last marker position
        if (!results[player_id] || results[player_id].lives > 0) {
            const map_instance = isGoogleMap();
            map_instance.data.forEach((e) => {
                // @ts-ignore
                if (this.selected_country === e.Fg.id) map_instance.data.remove(e); // TODO: This is updated regulary by Google so should be changed somehow
            });
            this.drawCountryPolygon(polygon, country_code);
            this.selected_country = country_code; // Set new selected_country
            return;
        }
    }

    /**
     * Method will process new results from server and update results state.
     * @param user
     * @param player_result
     */
    processNewResult(user: string, player_result: ResultsInfo): void {
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
    }

    /**
     * Method is called when round is finished. It processes total results and round results.
     * It also displays searched polygon on the map.
     * @param total_results
     * @param round_results
     * @param polygon Coordinates of the searched polygon.
     */
    finishRound(total_results: TotalResults, round_results: Results, polygon: any): void {
        // Apply total results
        useTotalResults().value = total_results;
        useTotalResults().value = Object.fromEntries(Object.entries(useTotalResults().value).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));

        this.displaySearchedPolygon(polygon);
        this.selected_country = undefined;
        this.selected_countries = [];
    }

    finishGame(): void {
        this.deleteAllPolygons();
    }

    /**
     * @returns Number of drawn polygons on the map
     */
    private numberOfDrawnPolygons(): number {
        const map_instance = isGoogleMap();
        let count = 0;
        map_instance.data.forEach(() => count++);
        return count;
    }

    /**
     * Method draws new polygon to the existing google map.
     * @param {*} polygon_coordinates
     */
    private drawCountryPolygon(polygon_coordinates: any, country: string): void {
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
    }

    /**
     * Function draws winner polygon on the map after every round. It also zooms in on the polygon.
     */
    private displaySearchedPolygon(polygon_coordinates: any): void {
        // Declare new polygon
        this.searched_polygon = new google.maps.Data();

        // Create geojson
        const geo_json = {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: polygon_coordinates,
            },
        };

        // Set polygon styles
        this.searched_polygon.setStyle({
            fillColor: "green",
            strokeColor: "black",
            strokeOpacity: 1,
            strokeWeight: 2,
        });
        this.searched_polygon.addGeoJson(geo_json);
        drawPolygonToMap(this.searched_polygon);

        // Zoom on country and fit polygon bounds
        let bounds = new google.maps.LatLngBounds();
        this.searched_polygon.forEach(function (feature) {
            feature.getGeometry()?.forEachLatLng(function (latlng) {
                bounds.extend(latlng);
            });
        });

        // Display searched polygon on map
        setTimeout(() => {
            fitCustomBounds(bounds, 300);
            isGoogleMap().setCenter(bounds.getCenter());
        }, 1000);
    }

    private deleteAllPolygons(): void {
        // Clear all drawn polygons from the map
        const map_instance = isGoogleMap();
        map_instance.data.forEach((e) => {
            map_instance.data.remove(e);
        });

        // Clear searched polygon
        if (this.searched_polygon) {
            this.searched_polygon.forEach((feature) => {
                this.searched_polygon?.remove(feature);
            });
        }
    }
}
