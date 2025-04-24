import { GameState, type Coordinates } from "~/types/appTypes";

export const useBattleRoyaleStore = defineStore("battleRoyale", () => {
    // External composable functions
    const router = useRouter();
    const googleStore = useGoogleStore();
    const resultsStore = useResultsStore();
    const authStore = useAuthStore();

    // GamePlay State
    const currentState = ref(GameState.WAITING);
    const currentRound = ref(0);
    const currentMapPin = ref<Coordinates>({} as Coordinates);
    const searchedLocationCoords = ref<Coordinates>({} as Coordinates);
    const setSearchedLocationCoords = (coordinates: Coordinates): Coordinates => (searchedLocationCoords.value = coordinates);

    // GameMode Specifics
    const mapMarkers: Ref<google.maps.marker.AdvancedMarkerElement[]> = ref([]);
    const mapPolylines: Ref<google.maps.Polyline[]> = shallowRef([]);
    const isGuessPending = ref(false);

    const startRound = async (isCountdown: boolean = true) => {
        currentState.value = GameState.STARTING;
        isGuessPending.value = false;

        // Set to PLAYING after countdown
        if (isCountdown)
            setTimeout(async () => {
                currentState.value = GameState.PLAYING;
            }, 3000);

        const { lobbySettings } = useLobbyStore();
        if (!lobbySettings) return console.error("Lobby settings are not defined in startRound method in useBattleRoyaleMode.");

        // Redirect to gampeplay route if not already there
        const routeName = router.currentRoute.value.name as string;
        if (!routeName.includes("gameplay")) await router.push({ path: `/gameplay-${lobbySettings.ID}` });
        if (!isCountdown) currentState.value = GameState.PLAYING;

        await googleStore.waitForMapAndPano();
        resetMapAndPanorama();
        clearMap();
        setMapClickEventListener();
    };

    const finishRound = async (round: number) => {
        currentState.value = GameState.MID_ROUND;
        currentRound.value = round;

        // Clear map from Gameplay
        clearMap();

        // Add searched location marker
        const marker = await googleStore.createSearchedLocationMarker(searchedLocationCoords.value);
        mapMarkers.value.push(marker);

        // Draw player pins and polylines to searched location
        const roundRes = resultsStore.liveResults;
        for (const key in roundRes) {
            if (Object.keys(roundRes[key].location).length === 0) continue; // Skip if location object is empty

            const color = getPlayerColorByID(key);
            if (!color) throw new Error("Player color is not defined");

            drawPolyLine(searchedLocationCoords.value, roundRes[key].location);
            await drawMarker(roundRes[key].location, color, getPlayerNameFromID(key)); // Create new marker
        }

        // Bound map view to players locations
        setTimeout(() => setMapBounds(), 1500);
    };

    const finishGame = () => {
        currentState.value = GameState.FINISHED;
        currentRound.value = 0;

        // Clear click listeners after game ends
        google.maps.event.clearListeners(googleStore.getMap, "click");
    };

    const processMapPin = async (coordinates: Coordinates): Promise<void> => {
        if (currentState.value !== GameState.PLAYING) return;
        if (isGuessPending.value) return;

        // Update current map pin
        currentMapPin.value = coordinates;

        const usedPins = mapMarkers.value.length; // Number of guesses already made in current round
        const playerID = authStore.playerInfo.ID;
        if (!playerID) throw new Error("Player ID is not defined");

        if (resultsStore.liveResults[playerID].lives === 0) return console.warn("All lives are used!!");

        // Place first pin if no pins yet, or if pins and submits are the same
        if (usedPins === 0 || resultsStore.liveResults[playerID].attempt === usedPins) {
            const color = getPlayerColorByID(playerID);
            if (!color) throw new Error("Player color is not defined");
            drawMarker(coordinates, color);
            return;
        }

        // If no submitted results yet || there are stil lives left, change last marker position
        if (!resultsStore.liveResults[playerID] || resultsStore.liveResults[playerID].lives > 0) {
            const lastMarker = mapMarkers.value[mapMarkers.value.length - 1];
            lastMarker.position = coordinates;
            return;
        }
    };

    const getUserLives = (userID: string): number => {
        return resultsStore.liveResults[userID]?.lives ?? 0; // Return 0 if userID doesn't exist in results yet
    };

    const submitGuess = () => {
        // Set pending state to true when submitting
        if (isGuessPending.value) return;
        isGuessPending.value = true;

        const socket_message = {
            command: SOCKET_COMMANDS.SUBMIT_LOCATION,
            location: currentMapPin.value,
        };

        const socketStore = useWebSocketStore();
        socketStore.sendMessage(socket_message);
    };

    const clearMap = () => {
        removeMarkersFromMap(true);
        removePolyLinesFromMap(true);
    };

    const isSubmitDisabled = computed(() => {
        // Also disable submit button when a guess is pending
        if (isGuessPending.value) return true;

        const liveResults = resultsStore.liveResults;
        const playerID = authStore.playerInfo.ID;

        // Disable if there are no markers on the map
        if (mapMarkers.value.length === 0) return true;

        // Disable if number of markers equals number of attempts
        if (!playerID) throw new Error("Player ID not found, probably because left lobby");
        const playerAttempt = liveResults[playerID].attempt;
        if (mapMarkers.value.length === playerAttempt) return true;

        return false;
    });

    // ======================================== Internal functions ========================================
    const drawPolyLine = (from: Coordinates, to: Coordinates): void => {
        // Contrust polyline and render it on map
        const polyline = googleStore.makePolyline(from, to);
        polyline.setMap(googleStore.getMap);

        // Save polyline to static array
        mapPolylines.value.push(polyline);
    };

    const drawMarker = async (coordinates: Coordinates, color: string, playerName?: string): Promise<void> => {
        // Create new marker and render it on map
        const marker = await googleStore.addNewMapMarker(coordinates, color, playerName);
        marker.map = googleStore.getMap;

        // Save marker to static array
        mapMarkers.value.push(marker);
    };

    const setMapBounds = (): void => {
        const roundResults = resultsStore.liveResults;
        const bounds = new google.maps.LatLngBounds();
        let locationCount = 0;

        for (const key in roundResults) {
            if (Object.keys(roundResults[key].location).length === 0) continue; // Skip if location object is empty
            bounds.extend(roundResults[key].location);
            locationCount++;
        }
        bounds.extend(searchedLocationCoords.value);
        locationCount++;

        // If there are only two locations (including the searched location), set the center instead of fitting bounds
        if (locationCount === 1) {
            googleStore.getMap.setCenter(searchedLocationCoords.value);
        } else {
            googleStore.fitCustomBounds(bounds, 50); // Fit all displayed markers bounds
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
        // Set Panorama to a location that needs to be guessed
        googleStore.updatePanoramaView(searchedLocationCoords.value);

        // Reset panorama POV and zoom
        googleStore.getPanorama.setPov({
            heading: 270,
            pitch: 0,
        });
        googleStore.getPanorama.setZoom(0);

        // Set GoogleMap to center and define zoom
        googleStore.getMap.setCenter({ lat: 0, lng: 0 });
        googleStore.getMap.setZoom(2);
    };

    const setMapClickEventListener = () => {
        // Remove existing listeners
        if (googleStore.getMap) google.maps.event.clearListeners(googleStore.getMap, "click");

        googleStore.addMapClickListener(processMapPin);
    };

    return {
        currentState: readonly(currentState),
        currentRound: readonly(currentRound),
        currentMapPin: readonly(currentMapPin),
        searchedLocationCoords: readonly(searchedLocationCoords),
        isGuessPending,
        getUserLives,
        setSearchedLocationCoords,
        isSubmitDisabled,
        clearMap,
        startRound,
        finishRound,
        finishGame,
        processMapPin,
        submitGuess,
        drawMarker,
    };
});
