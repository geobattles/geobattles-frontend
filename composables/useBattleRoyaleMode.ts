import { GameState, type Coordinates, type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";

export function useBattleRoyaleMode() {
    const mapMarkers: Ref<google.maps.marker.AdvancedMarkerElement[]> = ref([]);
    const mapPolylines: Ref<google.maps.Polyline[]> = shallowRef([]);

    // External composable functions
    const router = useRouter();

    const startRound = () => {
        const { lobbySettings } = useLobbyStore();
        if (!lobbySettings) return console.error("Lobby settings are not defined in startRound method in GameplayBattleRoyale class.");

        // Redirect to gampeplay route if not already there
        const routeName = router.currentRoute.value.name as string;
        if (!routeName.includes("gameplay")) router.push({ path: `/gameplay-${lobbySettings.ID}` });

        // Reset Pano and Map views and clear Map
        resetMapAndPanorama();
        clearMap();
    };

    const finishRound = async (totalResults: TotalResults, roundResults: Results) => {
        const gameStore = useGameplayStore();

        // Apply total results and sort them
        useTotalResults().value = totalResults;
        useTotalResults().value = Object.fromEntries(Object.entries(useTotalResults().value).sort(([, a], [, b]) => (b.total || 0) - (a.total || 0)));

        // Clear map from Gameplay
        clearMap();

        // Add searched location marker
        const marker = await createSearchedLocationMarker(gameStore.searchedLocationCoords);
        mapMarkers.value.push(marker); // Save marker to static array

        // Draw player pins and polylines to searched location
        for (const key in roundResults) {
            if (Object.keys(roundResults[key].location).length === 0) continue; // Skip if location object is empty

            const color = getPlayerColorByID(key);
            if (!color) throw new Error("Player color is not defined");

            drawPolyLine(gameStore.searchedLocationCoords, roundResults[key].location);
            drawMarker(roundResults[key].location, color, getPlayerNameFromID(key)); // Create new marker
        }

        // Bound map view to players locations
        setTimeout(() => setMapBounds(roundResults), 1500);
    };

    const finishGame = () => {
        // Clear click listeners after game ends
        const gMap = isGoogleMap();
        google.maps.event.clearListeners(gMap, "click");
    };

    const processMapPin = async (coordinates: Coordinates): Promise<void> => {
        const gameStore = useGameplayStore();
        if (gameStore.currentState !== GameState.PLAYING) return;

        // Update current map pin
        gameStore.currentMapPin = coordinates;

        const usedPins = mapMarkers.value.length; // Number of guesses already made in current round
        const playerID = usePlayerInfo().value.ID;
        if (!playerID) throw new Error("Player ID is not defined");

        const liveResults = useLiveResults().value;
        if (liveResults[playerID].lives === 0) return console.warn("All lives are used!!");

        // Place first pin if no pins yet, or if pins and submits are the same
        if (usedPins === 0 || liveResults[playerID].attempt === usedPins) {
            const color = getPlayerColorByID(playerID);
            if (!color) throw new Error("Player color is not defined");
            drawMarker(coordinates, color);
            return;
        }

        // If no submitted results yet || there are stil lives left, change last marker position
        if (!liveResults[playerID] || liveResults[playerID].lives > 0) {
            const lastMarker = mapMarkers.value[mapMarkers.value.length - 1];
            lastMarker.position = coordinates;
            return;
        }
    };

    const processNewResult = (userID: string, playerResult: ResultsInfo): void => {
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
    };

    const clearMap = () => {
        removeMarkersFromMap(true);
        removePolyLinesFromMap(true);
    };

    const isSubmitDisabled = computed(() => {
        const liveResults = useLiveResults();
        const playerID = usePlayerInfo().value.ID;

        // Disable if there are no markers on the map
        if (mapMarkers.value.length === 0) return true;

        // Disable if number of markers equals number of attempts
        if (!playerID) throw new Error("Player ID not found, probably because left lobby");
        const playerAttempt = liveResults.value[playerID].attempt;
        if (mapMarkers.value.length === playerAttempt) return true;

        return false;
    });

    // ======================================== Internal functions ========================================
    const drawPolyLine = (from: Coordinates, to: Coordinates): void => {
        // Contrust polyline and render it on map
        const polyline = makePolyline(from, to);
        polyline.setMap(isGoogleMap());

        // Save polyline to static array
        mapPolylines.value.push(polyline);
    };

    const drawMarker = async (coordinates: Coordinates, color: string, playerName?: string): Promise<void> => {
        // Create new marker and render it on map
        const marker = await addNewMapMarker(coordinates, color, playerName);
        marker.map = isGoogleMap();

        // Save marker to static array
        mapMarkers.value.push(marker);
    };

    const setMapBounds = (roundResults: Results): void => {
        const gameStore = useGameplayStore();
        const bounds = new google.maps.LatLngBounds();
        let locationCount = 0;

        for (const key in roundResults) {
            if (Object.keys(roundResults[key].location).length === 0) continue; // Skip if location object is empty
            bounds.extend(roundResults[key].location);
            locationCount++;
        }
        bounds.extend(gameStore.searchedLocationCoords);
        locationCount++;

        console.log(bounds);

        // If there are only two locations (including the searched location), set the center instead of fitting bounds
        if (locationCount === 1) {
            isGoogleMap().setCenter(gameStore.searchedLocationCoords);
        } else {
            fitCustomBounds(bounds, 50); // Fit all displayed markers bounds
        }
    };

    const removePolyLinesFromMap = (deletePolylines: boolean): void => {
        mapPolylines.value.forEach((polyline) => polyline.setMap(null));
        if (deletePolylines) mapPolylines.value = [];
    };

    const removeMarkersFromMap = (deleteMarkers: boolean): void => {
        mapMarkers.value.forEach((marker) => (marker.map = null));
        if (deleteMarkers) mapMarkers.value = [];
    };

    const resetMapAndPanorama = (): void => {
        if (useGoogleMapHTML().value && useGooglePanoramaHTML().value) {
            // Set Panorama to a location that needs to be guessed
            updatePanoramaView(useGameplayStore().searchedLocationCoords);

            // Set GoogleMap to center and define zoom
            isGoogleMap().setCenter({ lat: 0, lng: 0 });
            isGoogleMap().setZoom(2);
        }
    };

    return {
        isSubmitDisabled,
        clearMap,
        startRound,
        finishRound,
        finishGame,
        processMapPin,
        processNewResult,
    };
}
