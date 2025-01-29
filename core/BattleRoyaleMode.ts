import type { Results, ResultsInfo, TotalResults } from "~/types/appTypes";
import { BaseGameMode } from "./BaseGameMode";
import { GameState, type Coordinates } from "./Results";

export class BattleRoyaleMode extends BaseGameMode {
    private static instance: BattleRoyaleMode | null = null;
    private static polylinesArray: google.maps.Polyline[] = [];
    private static mapMarkersArray: Ref<google.maps.marker.AdvancedMarkerElement[]> = ref([]);
    static isSubmitButtonDisabled: Ref<boolean> = ref(true);

    static getInstance(): BattleRoyaleMode {
        if (!BattleRoyaleMode.instance) {
            BattleRoyaleMode.instance = new BattleRoyaleMode();
        }
        return BattleRoyaleMode.instance;
    }

    constructor() {
        super();
        console.log("BattleRoyaleMode instance created");
    }

    // Add cleanup method
    public cleanup(): void {
        if (BattleRoyaleMode.instance) {
            this.clearMap();
            BattleRoyaleMode.polylinesArray = [];
            BattleRoyaleMode.mapMarkersArray.value = [];
            BattleRoyaleMode.instance = null;
        }
    }

    public static getMapMarkers(): Ref<google.maps.marker.AdvancedMarkerElement[]> {
        return BattleRoyaleMode.mapMarkersArray;
    }

    override startRound(): void {
        console.log("START ROUND IN BATTLE ROYALE MODE");

        const router = useRouter();
        const routeName = router.currentRoute.value.name as string;

        const { lobbySettings } = useLobbyStore();
        if (!lobbySettings) return console.error("Lobby settings are not defined in startRound method in GameplayBattleRoyale class.");

        // Redirect to gampeplay route if not already there
        if (!routeName.includes("gameplay")) router.push({ path: `/gameplay-${lobbySettings.ID}` });

        // Reset panorama and map views
        if (useGoogleMapHTML().value && useGooglePanoramaHTML().value) {
            updatePanoramaView(useGameplayStore().searchedLocationCoords);
            isGoogleMap().setCenter({ lat: 0, lng: 0 });
            isGoogleMap().setZoom(2);
        }

        // Remove any left stuff from Map
        this.clearMap();
    }

    override async finishRound(totalResults: TotalResults, roundResults: Results): Promise<void> {
        const gameStore = useGameplayStore();

        // Apply total results // @ts-ignore
        useTotalResults().value = totalResults;
        useTotalResults().value = Object.fromEntries(Object.entries(useTotalResults().value).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));

        // Clear map from previous round
        this.clearMap();

        // Add searched location marker
        const marker = await createSearchedLocationMarker(gameStore.searchedLocationCoords);
        BattleRoyaleMode.mapMarkersArray.value.push(marker); // Save marker to static array

        // Draw player pins and polylines to searched location
        const round_res = roundResults;
        for (const key in round_res) {
            if (Object.keys(round_res[key].location).length === 0) continue; // Skip if location object is empty

            this.drawPolyLine(gameStore.searchedLocationCoords, round_res[key].location);

            const color = getPlayerColorByID(key);
            if (!color) throw new Error("Player color is not defined");

            const marker = await addNewMapMarker(round_res[key].location, color, getPlayerNameFromID(key)); // Create new marker
            BattleRoyaleMode.mapMarkersArray.value.push(marker); // Save marker to static array
        }

        setMapZoom(3);
        setTimeout(() => {
            this.setMapBounds(round_res);
        }, 300);
    }

    override async processMapPin(coordinates: Coordinates): Promise<void> {
        const gameStore = useGameplayStore();
        if (gameStore.currentState !== GameState.PLAYING) return;

        gameStore.currentMapPin = coordinates;
        // const used_pins = useMapMarkers().value.length; // Number of guesses already made in current round
        const usedPins = BattleRoyaleMode.mapMarkersArray.value.length;
        const player_id = usePlayerInfo().value.ID;
        if (!player_id) throw new Error("Player ID is not defined");

        const liveResults = useLiveResults().value;
        // START OF PIN PLACEMENT LOGIC
        if (liveResults[player_id].lives === 0) {
            console.warn("All lives are used!!"); // TODO: Make toast that all lives are used.
            return;
        }
        console.log("Used pins: ", usedPins);

        // Place first pin if no pins yet, or if pins and submits are the same
        if (usedPins === 0 || liveResults[player_id].attempt === usedPins) {
            // get player color from name
            const color = getPlayerColorByID(player_id);
            if (!color) throw new Error("Player color is not defined");
            const marker = await addNewMapMarker(coordinates, color); // Create new marker
            // useMapMarkers().value.push(marker); // Add marker to markers state
            BattleRoyaleMode.mapMarkersArray.value.push(marker); // Add marker to static array
            return;
        }

        // If no submitted results yet || there are stil lives left, change last marker position
        if (!liveResults[player_id] || liveResults[player_id].lives > 0) {
            // const last_marker = useMapMarkers().value[used_pins - 1]; // Get last marker
            const lastMarker = BattleRoyaleMode.mapMarkersArray.value[BattleRoyaleMode.mapMarkersArray.value.length - 1]; // Get last marker
            // @ts-ignore
            console.log("Last marker position: ", lastMarker);
            lastMarker.position = coordinates; // Change last marker position
            return;
        }
        // END OF PIN PLACEMENT LOGIC
    }

    override finishGame(): void {}

    override processNewResult(userID: string, playerResult: ResultsInfo): void {
        const liveResults = useLiveResults();
        const leader_before = Object.keys(liveResults.value).reduce((a, b) => (liveResults.value[a].distance < liveResults.value[b].distance ? a : b)); // Returns player ID

        if (playerResult.baseScr < liveResults.value[userID]?.baseScr || (playerResult.baseScr === 0 && playerResult.distance > liveResults.value[userID].distance)) {
            // Update attempts and lives, not the score or distance
            liveResults.value[userID].lives = playerResult.lives;
            liveResults.value[userID].attempt = playerResult.attempt;
        } else {
            liveResults.value[userID] = playerResult; // Update everything because the new user's result is better than current best
            liveResults.value = Object.fromEntries(Object.entries(liveResults.value).sort(([, a], [, b]) => (a.distance ?? 999999999) - (b.distance ?? 999999999))); // Sort results by score
        }

        const new_leader = Object.keys(liveResults.value).reduce((a, b) => (liveResults.value[a].distance < liveResults.value[b].distance ? a : b)); // Returns player ID

        useGameplayStore().applyGuessStyles(userID, leader_before, new_leader);
    }

    override clearMap(): void {
        this.removeMarkersFromMap(true);
        this.removePolyLinesFromMap(true);
    }

    override isSubmitButtonDisabled(): boolean {
        // console.log("IS SUBMIT BUTTON DISABLED");
        // const liveResults = useLiveResults().value;
        // const playerID = usePlayerInfo().value.ID;
        // const mapMarkers = BattleRoyaleMode.mapMarkersArray;
        // // Disable if there are no markers on the map
        // if (mapMarkers.length === 0) return true;
        // if (mapMarkers.length === 0) return true;
        // // Disable if number of markers equals number of attempts
        // if (!playerID) throw new Error("Player ID not found, probably because left lobby");
        // const playerAttempt = liveResults[playerID]?.attempt;
        // if (mapMarkers.length === playerAttempt) return true;
        return false;
    }

    /**
     * When round is finished, this method will set map bounds to fit all best markers on the map.
     *
     * @param roundResults - Results object from round
     * @returns
     */
    private setMapBounds(roundResults: Results): void {
        const gameStore = useGameplayStore();
        let bounds = new google.maps.LatLngBounds();

        for (const key in roundResults) {
            if (Object.keys(roundResults[key].location).length === 0) continue; // Skip if location object is empty
            bounds.extend(roundResults[key].location);
        }
        bounds.extend(gameStore.searchedLocationCoords);

        // Dont fit bounds if there is only one marker on map (only searched location marker)
        // if (useMapMarkers().value.length === 1) {
        if (BattleRoyaleMode.mapMarkersArray.value.length === 1) {
            isGoogleMap().setCenter(gameStore.searchedLocationCoords);
            return;
        } else {
            if (bounds) fitCustomBounds(bounds, 50); // Fit all displayed markers bounds
        }
    }

    private drawPolyLine(from: Coordinates, to: Coordinates): void {
        // Contrust polyline and render it on map
        const polyline = makePolyline(from, to);
        polyline.setMap(isGoogleMap());

        // Save polyline to static array
        BattleRoyaleMode.polylinesArray.push(polyline);
    }

    /**
     * Method remove all polylines from map and optionally from array
     * ? Removal only works if polylines array is defined as static property. //! Dev
     *
     * @param deletePolylines - If true, all polylines will be removed from map and array
     */
    private removePolyLinesFromMap(deletePolylines: boolean): void {
        BattleRoyaleMode.polylinesArray.forEach((polyline) => polyline.setMap(null));
        if (deletePolylines) BattleRoyaleMode.polylinesArray = [];
    }

    private removeMarkersFromMap(deleteMarkers: boolean): void {
        BattleRoyaleMode.mapMarkersArray.value.forEach((marker) => (marker.map = null));
        if (deleteMarkers) BattleRoyaleMode.mapMarkersArray.value = [];
    }
}
