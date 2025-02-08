import { GameState, type Coordinates, type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";
import { BaseGameMode } from "./BaseGameMode";

export class CountryBattleMode extends BaseGameMode {
    private static instance: CountryBattleMode | null = null;
    private selectedCountry: string | undefined = undefined;
    private selectedCountries: string[] = [];
    private searchedPolygon: google.maps.Data | undefined = undefined;

    static getInstance(): CountryBattleMode {
        if (!CountryBattleMode.instance) {
            CountryBattleMode.instance = new CountryBattleMode();
        }
        return CountryBattleMode.instance;
    }

    constructor() {
        super();
        console.log("CountryBattleMode instance created");
    }

    // Add cleanup method
    public cleanup(): void {
        if (CountryBattleMode.instance) {
            this.clearMap();
            this.selectedCountries = [];
            this.selectedCountry = undefined;
            this.searchedPolygon = undefined;
            CountryBattleMode.instance = null;
        }
    }

    override startRound(): void {
        const router = useRouter();
        const routeName = router.currentRoute.value.name as string;

        const { lobbySettings } = useLobbyStore();
        if (!lobbySettings) return console.error("Lobby settings are not defined in CountryBattle startRound method.");

        // Redirect to gameplay routes if not already there
        if (!routeName.includes("gameplay")) router.push({ path: `/gameplay-${lobbySettings.ID}` });

        // Reset panorama and map views
        if (useGoogleMapHTML().value && useGooglePanoramaHTML().value) {
            updatePanoramaView(useGameplayStore().searchedLocationCoords);
            isGoogleMap().setCenter({ lat: 0, lng: 0 });
            isGoogleMap().setZoom(2);

            // Clear Map before starting round
            this.deleteAllPolygons();

            //? Is this necessary here???
            addMapClickListener(this.processMapPin); // Add click listener to map as it is somehow removed the initial one in onMounted hook
        }

        // const results = useResults(); // Get results from state
        // for (const player_id in results.value) this.total_attempts.set(player_id, results.value[player_id].lives);
    }

    override finishRound(totalResults: TotalResults, roundResults: Results, polygon: any): void {
        // Apply total results
        useTotalResults().value = totalResults;
        useTotalResults().value = Object.fromEntries(Object.entries(useTotalResults().value).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));
        this.displaySearchedPolygon(polygon);
        this.selectedCountry = undefined;
        this.selectedCountries = [];
    }

    override processMapPin(coordinates: Coordinates): void {
        const gameStore = useGameplayStore();
        if (gameStore.currentState !== GameState.PLAYING) return;

        gameStore.currentMapPin = coordinates;

        const socket_message = {
            command: SOCKET_COMMANDS.LOC_TO_CC,
            location: { ...coordinates },
        };

        // Send clicked location to server (to render the country polygon)
        const socketStore = useWebSocketStore();
        socketStore.sendMessage(socket_message);
    }

    override finishGame(): void {
        this.deleteAllPolygons();
    }

    override processNewResult(user: string, player_result: ResultsInfo): void {
        const liveResults = useLiveResults(); // Get results from state

        // Remove click event listner if player guessed country or ran out of lives
        if (player_result.lives === 0 || player_result.cc === "XX") removeMapEventListener("click");

        // Update results
        if (player_result.baseScr < liveResults.value[user]?.baseScr || player_result.baseScr === 0) {
            // Update attempts and lives, not the score or distance
            liveResults.value[user].lives = player_result.lives;
            liveResults.value[user].attempt = player_result.attempt;
        } else {
            liveResults.value[user] = player_result; // Update everything
            // Sort results by score
            liveResults.value = Object.fromEntries(Object.entries(liveResults.value).sort(([, a], [, b]) => a.distance - b.distance));
        }

        // Create or update player countries array
        if (!liveResults.value[user].player_countries) liveResults.value[user].player_countries = [player_result.cc];
        else liveResults.value[user].player_countries.push(player_result.cc);
    }

    override clearMap(): void {
        this.deleteAllPolygons();
    }

    override isSubmitButtonDisabled: ComputedRef<boolean> = computed(() => {
        return false;
    });

    public processClickedCountry(polygon: any, countryCode: string): void {
        console.log("Processing clicked country:", countryCode);

        const player_id = usePlayerInfo().value.ID;
        const liveResults = useLiveResults().value;
        if (!player_id) throw new Error("Player ID is not defined");

        console.log("Live results:", liveResults);
        console.log("Player ID:", player_id);

        const nr_polygons = this.numberOfDrawnPolygons();

        // If there are no lives available, return
        if (liveResults[player_id].lives === 0) {
            console.log("All lives are used!!"); // TODO: Make toast that all lives are used.
            return;
        }

        // Return if clicked on the same country
        if (countryCode === this.selectedCountry) return;

        // Place first pin if no pins yet, or if pins and submits are the same
        if (nr_polygons === 0 || liveResults[player_id].attempt === nr_polygons) {
            // Draw polygon to map and push to selected countries
            this.drawCountryPolygon(polygon, countryCode);
            this.selectedCountry = countryCode;
            return;
        }

        // If no submitted results yet || there are stii lives left, change last marker position
        if (!liveResults[player_id] || liveResults[player_id].lives > 0) {
            const map_instance = isGoogleMap();
            map_instance.data.forEach((e) => {
                // @ts-ignore
                if (this.selectedCountry === e.Fg.id) map_instance.data.remove(e); // TODO: This is updated regulary by Google so should be changed somehow
            });
            this.drawCountryPolygon(polygon, countryCode);
            this.selectedCountry = countryCode; // Set new selectedCountry
            return;
        }
    }

    private numberOfDrawnPolygons(): number {
        const gMap = isGoogleMap();
        let count = 0;
        gMap.data.forEach(() => count++);
        return count;
    }

    private drawCountryPolygon(polygonCoords: any, countryCode: string): void {
        let geo_json = {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: polygonCoords,
                clickable: false,
            },
            properties: {
                id: "",
            },
        };

        geo_json.properties.id = countryCode;
        addGeoJSON(geo_json);
    }

    private displaySearchedPolygon(polygonCoords: any): void {
        // Declare new polygon
        this.searchedPolygon = new google.maps.Data();

        // Create geojson
        const geo_json = {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: polygonCoords,
            },
        };

        // Set polygon styles
        this.searchedPolygon.setStyle({
            fillColor: "green",
            strokeColor: "black",
            strokeOpacity: 1,
            strokeWeight: 2,
        });
        this.searchedPolygon.addGeoJson(geo_json);
        drawPolygonToMap(this.searchedPolygon);

        // Zoom on country and fit polygon bounds
        let bounds = new google.maps.LatLngBounds();
        this.searchedPolygon.forEach(function (feature) {
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
        if (this.searchedPolygon) {
            this.searchedPolygon.forEach((feature) => {
                this.searchedPolygon?.remove(feature);
            });
        }
    }
}
