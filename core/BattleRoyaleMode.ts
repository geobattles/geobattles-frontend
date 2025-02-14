import { GameState, type Coordinates, type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";
import { BaseGameMode } from "./BaseGameMode";

export class BattleRoyaleMode extends BaseGameMode {
    private static instance: BattleRoyaleMode | null = null;
    private mapMarkersArray: Ref<google.maps.marker.AdvancedMarkerElement[]> = ref([]);
    private polylinesArray: Ref<google.maps.Polyline[]> = shallowRef([]);

    // We only want to hold one instance of this class
    static getInstance(): BattleRoyaleMode {
        if (!BattleRoyaleMode.instance) {
            BattleRoyaleMode.instance = new BattleRoyaleMode();
        }
        return BattleRoyaleMode.instance;
    }

    constructor() {
        super();

        // Needs to be binded because it is used as a callback in addMapClickListener
        this.processMapPin = this.processMapPin.bind(this);
    }

    public cleanup(): void {
        if (BattleRoyaleMode.instance) {
            this.clearMap();
            BattleRoyaleMode.instance = null;
        }
    }

    override startRound(): void {
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
        this.mapMarkersArray.value.push(marker); // Save marker to static array

        // Draw player pins and polylines to searched location
        const round_res = roundResults;
        for (const key in round_res) {
            if (Object.keys(round_res[key].location).length === 0) continue; // Skip if location object is empty

            this.drawPolyLine(gameStore.searchedLocationCoords, round_res[key].location);

            const color = getPlayerColorByID(key);
            if (!color) throw new Error("Player color is not defined");

            this.drawMarker(round_res[key].location, color, getPlayerNameFromID(key)); // Create new marker
        }

        setMapZoom(3);
        setTimeout(() => {
            this.setMapBounds(round_res);
        }, 300);
    }

    // Gets binded to map click event
    override async processMapPin(coordinates: Coordinates): Promise<void> {
        const gameStore = useGameplayStore();
        if (gameStore.currentState !== GameState.PLAYING) return;
        gameStore.currentMapPin = coordinates;

        const usedPins = this.mapMarkersArray.value.length; // Number of guesses already made in current round
        const player_id = usePlayerInfo().value.ID;
        if (!player_id) throw new Error("Player ID is not defined");

        const liveResults = useLiveResults().value;
        if (liveResults[player_id].lives === 0) return console.warn("All lives are used!!");
        console.log("Used pins: ", usedPins); //! Dev

        // Place first pin if no pins yet, or if pins and submits are the same
        if (usedPins === 0 || liveResults[player_id].attempt === usedPins) {
            const color = getPlayerColorByID(player_id);
            if (!color) throw new Error("Player color is not defined");

            this.drawMarker(coordinates, color);
            return;
        }

        // If no submitted results yet || there are stil lives left, change last marker position
        if (!liveResults[player_id] || liveResults[player_id].lives > 0) {
            const lastMarker = this.mapMarkersArray.value[this.mapMarkersArray.value.length - 1];
            console.log("Last marker position: ", lastMarker); //! Dev
            lastMarker.position = coordinates;
            return;
        }
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

    override isSubmitButtonDisabled: ComputedRef<boolean> = computed(() => {
        const liveResults = useLiveResults();
        const playerID = usePlayerInfo().value.ID;
        const mapMarkers = this.mapMarkersArray;

        // Disable if there are no markers on the map
        if (mapMarkers.value.length === 0) return true;

        // Disable if number of markers equals number of attempts
        if (!playerID) throw new Error("Player ID not found, probably because left lobby");
        const playerAttempt = liveResults.value[playerID]?.attempt;
        if (mapMarkers.value.length === playerAttempt) return true;

        return false;
    });

    private setMapBounds(roundResults: Results): void {
        const gameStore = useGameplayStore();
        const bounds = new google.maps.LatLngBounds();

        for (const key in roundResults) {
            if (Object.keys(roundResults[key].location).length === 0) continue; // Skip if location object is empty
            bounds.extend(roundResults[key].location);
        }
        bounds.extend(gameStore.searchedLocationCoords);

        // Dont fit bounds if there is only one marker on map (only searched location marker)
        if (this.mapMarkersArray.value.length === 1) {
            isGoogleMap().setCenter(gameStore.searchedLocationCoords);
            return;
        } else {
            if (bounds) fitCustomBounds(bounds, 50); // Fit all displayed markers bounds
        }
    }

    private async drawMarker(coordinates: Coordinates, color: string, playerName?: string): Promise<void> {
        // Create new marker and render it on map
        const marker = await addNewMapMarker(coordinates, color, playerName);
        marker.map = isGoogleMap();

        // Save marker to static array
        this.mapMarkersArray.value.push(marker);
    }

    private drawPolyLine(from: Coordinates, to: Coordinates): void {
        // Contrust polyline and render it on map
        const polyline = makePolyline(from, to);
        polyline.setMap(isGoogleMap());

        // Save polyline to static array
        this.polylinesArray.value.push(polyline);
    }

    private removePolyLinesFromMap(deletePolylines: boolean): void {
        this.polylinesArray.value.forEach((polyline) => polyline.setMap(null));
        if (deletePolylines) this.polylinesArray.value = [];
    }

    private removeMarkersFromMap(deleteMarkers: boolean): void {
        this.mapMarkersArray.value.forEach((marker) => (marker.map = null));
        if (deleteMarkers) this.mapMarkersArray.value = [];
    }
}
