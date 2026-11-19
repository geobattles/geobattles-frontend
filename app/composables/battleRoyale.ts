import { GameState, type Coordinates } from "~/types/appTypes";
import { getCountryViewport } from "~/utils/countryViewport";

export const useBattleRoyaleStore = () => {
    const app = useNuxtApp();

    const resultsStore = useResultsStore();
    const { lobbySettings } = useLobbyState();
    const player = usePlayerInfo();
    const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
    const { currentState, currentRound, currentMapPin, searchedLocationCoords, isGuessPending } = useBattleRoyaleState();
    const setSearchedLocationCoords = (coordinates: Coordinates): Coordinates => (searchedLocationCoords.value = coordinates);
    // Browser resources are owned once by the client plugin, never by a facade.
    const resources = () => app.$gameRuntime.battleRoyale;
    const mapMarkers = computed(() => resources().markers.value);
    const googleStore = () => app.$gameRuntime.google;

    const startRound = async (isCountdown: boolean = true) => {
        currentState.value = GameState.STARTING;
        isGuessPending.value = false;
        currentRound.value = lobbySettings.value?.currentRound ?? currentRound.value;
        currentMapPin.value = {} as Coordinates;

        clearMap();
        const owner = resources();
        const epoch = owner.generation;
        if (isCountdown)
            resources().schedule(() => {
                if (currentState.value === GameState.STARTING) currentState.value = GameState.PLAYING;
            }, 3000);
        if (!lobbySettings.value) throw new Error("Lobby settings are not initialized.");

        owner.isRestoring.value = true;
        if (!isCountdown) currentState.value = GameState.PLAYING;
        owner.authorizeRound(lobbySettings.value.ID, currentRound.value);
        await googleStore().waitForMapAndPano();
        if (owner !== resources() || epoch !== owner.generation) return;
        resetMapAndPanorama();
        owner.isRestoring.value = false;
        setMapClickEventListener();
    };

    // Data is applied synchronously by socket handlers; SDK rendering must never
    // block ordered messages or the join promise / route middleware.
    const renderRoundResults = async () => {
        const owner = resources();
        const epoch = owner.generation;
        // Frame the same authoritative geometry that this render will draw,
        // including scored participants who have since left the lobby.
        const answer = { ...searchedLocationCoords.value };
        const roundRes = Object.entries(resultsStore.bestResults)
            .filter(([, result]) => hasGuess(result))
            .map(([id, result]) => ({ id, location: { ...result.location } }));
        await googleStore().waitForMap();
        if (owner !== resources() || epoch !== owner.generation) return;
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(answer);
        for (const { location } of roundRes) bounds.extend(location);
        googleStore().fitCustomBounds(bounds, 50);
        const marker = await googleStore().createSearchedLocationMarker(answer);
        if (owner !== resources() || epoch !== owner.generation) {
            marker.map = null;
            return;
        }
        resources().markers.value = [...mapMarkers.value, marker];

        // Draw player pins and polylines to searched location
        for (const { id, location } of roundRes) {
            if (owner !== resources() || epoch !== owner.generation) return;
            const color = getPlayerColorByID(id);
            drawPolyLine(answer, location);
            await drawMarker(location, color, getPlayerNameFromID(id));
        }
    };

    const finishRound = (round: number) => {
        currentState.value = GameState.MID_ROUND;
        currentRound.value = round;
        clearMap();
        if (lobbySettings.value) resources().authorizeMapView(lobbySettings.value.ID, round);
        return renderRoundResults();
    };
    const finishGame = () => {
        currentState.value = GameState.FINISHED;
        googleStore().cancelGameplayFrame();
        resources().activeRound.value = null;
        if (lobbySettings.value) resources().authorizeMapView(lobbySettings.value.ID, currentRound.value);
        resources().invalidatePinPlacement();
        resources().draftMarker.value = null;
        currentMapPin.value = {} as Coordinates;
        isGuessPending.value = false;
        if (googleStore().isMapInitialized) googleStore().removeMapEventListener("click");
    };
    const restoreRound = async (phase: GameState, round: number) => {
        clearMap();
        currentState.value = phase;
        currentRound.value = round;
        currentMapPin.value = {} as Coordinates;
        isGuessPending.value = false;
        if (phase === GameState.WAITING) return;
        const owner = resources();
        const epoch = owner.generation;
        if (!lobbySettings.value) throw new Error("Lobby settings are not initialized.");
        if (phase !== GameState.PLAYING) {
            owner.authorizeMapView(lobbySettings.value.ID, round);
            return renderRoundResults();
        }
        owner.isRestoring.value = true;
        owner.authorizeRound(lobbySettings.value.ID, round);
        await googleStore().waitForMapAndPano();
        if (owner !== resources() || epoch !== owner.generation) return;
        resetMapAndPanorama();
        const id = player.value.ID;
        const color = id ? getPlayerColorByID(id) : undefined;
        if (!id || !color) return;
        for (const guess of resultsStore.rawResults[id] ?? []) {
            if (epoch !== owner.generation) return;
            if (hasGuess(guess)) await drawMarker(guess.location, color);
        }
        if (owner !== resources() || epoch !== owner.generation) return;
        owner.isRestoring.value = false;
        setMapClickEventListener();
    };

    // This resumes rendering only. It never changes membership, scores, phase,
    // deadline, readiness or sends START. Healthy objects/draft pins stay intact.
    const retryMapRendering = async () => {
        const owner = resources();
        const sdk = googleStore();
        const epoch = owner.generation;
        const permission = owner.mapView.value;
        const socket = app.$gameRuntime.socket;
        if (
            !permission ||
            permission.generation !== epoch ||
            permission.lobbyId !== lobbySettings.value?.ID ||
            owner.retryingMaps.value ||
            !socket.isConnected ||
            !socket.isOnline ||
            sdk.mapStatus === "blocked" ||
            sdk.panoramaStatus === "blocked"
        )
            return;
        const isCurrent = () => owner === resources() && epoch === owner.generation && permission === owner.mapView.value;
        const releaseRetry = owner.beginMapsRetry();
        try {
            sdk.retryFailedResources();
            await nextTick(); // Resource components retry under the same view grant.
            await owner.pendingRender; // Do not race an initial render settling now.
            if (!isCurrent()) return;
            if ([GameState.STARTING, GameState.PLAYING].includes(currentState.value)) {
                await sdk.waitForMapAndPano();
                if (!isCurrent()) return;
                if (owner.isRestoring.value || owner.renderError.value) {
                    // An interrupted initial/restore render could have drawn a
                    // subset of history. No draft exists while isRestoring.
                    owner.markers.value.forEach((marker) => (marker.map = null));
                    owner.markers.value = [];
                    resetMapAndPanorama();
                    const id = player.value.ID;
                    if (!id) throw new Error("Player unavailable.");
                    for (const guess of resultsStore.rawResults[id] ?? []) {
                        if (!isCurrent()) return;
                        if (hasGuess(guess)) await drawMarker(guess.location, getPlayerColorByID(id));
                    }
                    if (!isCurrent()) return;
                    owner.isRestoring.value = false;
                    setMapClickEventListener();
                }
            } else if ([GameState.MID_ROUND, GameState.FINISHED].includes(currentState.value) && owner.renderError.value) {
                owner.markers.value.forEach((marker) => (marker.map = null));
                owner.markers.value = [];
                owner.polylines.forEach((line) => line.setMap(null));
                owner.polylines.length = 0;
                await renderRoundResults();
            }
            if (isCurrent()) owner.renderError.value = false;
        } catch {
            if (isCurrent()) owner.renderError.value = true;
        } finally {
            releaseRetry();
        }
    };

    const processMapPin = async (coordinates: Coordinates): Promise<void> => {
        const owner = resources();
        if (currentState.value !== GameState.PLAYING || isGuessPending.value || owner.isRestoring.value || !validPin(coordinates)) return;
        const playerID = player.value.ID;
        if (!playerID || getUserLives(playerID) <= 0) return;
        const isPlacementCurrent = owner.capturePinPlacement();
        const pin = { ...coordinates };
        // Only the explicit unsubmitted draft may move, never history markers.
        if (owner.draftMarker.value) {
            owner.draftMarker.value.position = pin;
            currentMapPin.value = pin;
            return;
        }
        const epoch = owner.generation;
        const marker = await googleStore().addNewMapMarker(pin, getPlayerColorByID(playerID));
        if (
            owner !== resources() ||
            epoch !== owner.generation ||
            !isPlacementCurrent() ||
            currentState.value !== GameState.PLAYING ||
            isGuessPending.value ||
            owner.isRestoring.value ||
            getUserLives(playerID) <= 0
        ) {
            marker.map = null;
            return;
        }
        marker.map = googleStore().getMap;
        owner.markers.value = [...owner.markers.value, marker];
        owner.draftMarker.value = marker;
        currentMapPin.value = pin;
    };
    const validPin = (pin: Coordinates) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng) && Math.abs(pin.lat) <= 90 && Math.abs(pin.lng) <= 180;
    const acceptGuess = (round: number) => {
        // There is only one in-flight guess. Its sent draft was already
        // released at send; an unsolicited/old result must not consume a pin.
        if (!isGuessPending.value || round !== currentRound.value) return;
        isGuessPending.value = false;
    };

    const getUserLives = (userID: string): number => {
        return resultsStore.liveResults[userID]?.lives ?? 0; // Return 0 if userID doesn't exist in results yet
    };

    const submitGuess = () => {
        if (isSubmitDisabled.value) return;
        resources().invalidatePinPlacement();
        isGuessPending.value = true;

        if (app.$gameRuntime.socketActions.submitLocation({ ...currentMapPin.value })) {
            // Freeze the sent marker. Only this command's ACK/error or an
            // explicit phase/connection reset may release its pending gate.
            resources().draftMarker.value = null;
            currentMapPin.value = {} as Coordinates;
        }
    };

    const clearMap = () => {
        resources().clearMap();
        isGuessPending.value = false;
        currentMapPin.value = {} as Coordinates;
    };

    const isSubmitDisabled = computed(() => {
        const owner = resources();
        if (currentState.value !== GameState.PLAYING || isGuessPending.value || owner.isRestoring.value) return true;
        const playerID = player.value.ID;
        return !playerID || getUserLives(playerID) <= 0 || !owner.draftMarker.value || !validPin(currentMapPin.value);
    });

    // ======================================== Internal functions ========================================
    const drawPolyLine = (from: Coordinates, to: Coordinates): void => {
        // Contrust polyline and render it on map
        const polyline = googleStore().makePolyline(from, to);
        polyline.setMap(googleStore().getMap);

        // Save polyline to static array
        resources().polylines.push(polyline);
    };

    const drawMarker = async (coordinates: Coordinates, color: string, playerName?: string): Promise<void> => {
        // Create new marker and render it on map
        const owner = resources();
        const epoch = owner.generation;
        const marker = await googleStore().addNewMapMarker(coordinates, color, playerName);
        if (owner !== resources() || epoch !== owner.generation) {
            marker.map = null;
            return;
        }
        marker.map = googleStore().getMap;
        resources().markers.value = [...mapMarkers.value, marker];
    };

    const resetMapAndPanorama = (): void => {
        // Set Panorama to a location that needs to be guessed
        googleStore().updatePanoramaView(searchedLocationCoords.value);

        // Reset panorama POV and zoom
        googleStore().getPanorama.setPov({
            heading: 270,
            pitch: 0,
        });
        googleStore().getPanorama.setZoom(0);

        // Country framing is based only on public settings, never the answer.
        // Round identity survives render-generation changes on reconnect/retry.
        const settings = lobbySettings.value;
        if (!settings) return;
        const owner = resources();
        const epoch = owner.generation;
        const permission = owner.mapView.value;
        const key = JSON.stringify([settings.ID, settings.gameId ?? null, currentRound.value]);
        googleStore().frameGameplay(
            key,
            getCountryViewport(settings.conf.ccList),
            () =>
                owner === resources() &&
                epoch === owner.generation &&
                permission === owner.mapView.value &&
                [GameState.STARTING, GameState.PLAYING].includes(currentState.value) &&
                key === JSON.stringify([lobbySettings.value?.ID, lobbySettings.value?.gameId ?? null, currentRound.value])
        );
    };

    const setMapClickEventListener = () => {
        // Remove existing listeners
        if (googleStore().getMap) google.maps.event.clearListeners(googleStore().getMap, "click");

        googleStore().addMapClickListener(processMapPin);
    };

    return reactive({
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
        restoreRound,
        retryMapRendering,
        processMapPin,
        submitGuess,
        acceptGuess,
        drawMarker,
    });
};
