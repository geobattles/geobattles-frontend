import { GameState, type Coordinates } from "~/types/appTypes";
import { getCountryViewport } from "~/utils/countryViewport";
import { expeditionStops, formatGuessDistance, roundResultBounds } from "~/utils/resultUtils";
import type { RoundResultPin } from "~/runtime/google";

export const useBattleRoyaleStore = () => {
    const app = useNuxtApp();

    const resultsStore = useResultsStore();
    const { lobbySettings, roundDeadline, revealedAnswers, finalResultsReady } = useLobbyState();
    const player = usePlayerInfo();
    const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
    const { currentState, currentRound, currentMapPin, searchedLocationCoords, isGuessPending } = useBattleRoyaleState();
    const setSearchedLocationCoords = (coordinates: Coordinates): Coordinates => (searchedLocationCoords.value = coordinates);
    // Browser resources are owned once by the client plugin, never by a facade.
    const resources = () => app.$gameRuntime.battleRoyale;
    const googleStore = () => app.$gameRuntime.google;
    const draftKey = (round: number) => JSON.stringify([lobbySettings.value?.ID, lobbySettings.value?.gameId, round, player.value.ID]);
    const roundExpired = () => roundDeadline.value !== null && Date.now() >= roundDeadline.value;

    const startRound = async (isCountdown: boolean = true) => {
        currentState.value = GameState.STARTING;
        isGuessPending.value = false;
        currentRound.value = lobbySettings.value?.currentRound ?? currentRound.value;
        currentMapPin.value = {} as Coordinates;

        clearMap();
        const owner = resources();
        owner.finishedMapView.value = null;
        const epoch = owner.generation;
        if (!lobbySettings.value) throw new Error("Lobby settings are not initialized.");

        if (isCountdown) {
            owner.startCountdown(roundDeadline, lobbySettings.value.conf.roundTime, () => {
                if (currentState.value === GameState.STARTING) currentState.value = GameState.PLAYING;
            });
        }

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
    const matchKey = () => JSON.stringify([lobbySettings.value?.ID, lobbySettings.value?.gameId]);
    const resultArtwork = () => {
        const round = currentRound.value;
        const owner = resources();
        const reviewing = currentState.value === GameState.FINISHED && finalResultsReady.value;
        const stops = reviewing ? expeditionStops(revealedAnswers.value, round) : [];
        if (reviewing && !stops.length) return null;
        const selection = owner.finishedMapView.value;
        const view = reviewing && selection?.match === matchKey() ? selection.view : "journey";
        if (view === "journey" && stops.length > 1) {
            const pins: RoundResultPin[] = stops.map(({ round, position }) => ({ kind: "stop", round, position, title: `Round ${round} location` }));
            const lines = stops.slice(1).map(({ position }, index) => ({ from: stops[index]!.position, to: position, color: "#b0803c", own: false }));
            return { pins, lines };
        }

        const stop = stops.find(({ round }) => round === view) ?? stops.at(-1);
        const answer = { ...(stop?.position ?? searchedLocationCoords.value) };
        const rows = stop && stop.round !== round ? (lobbySettings.value?.endResults[stop.round] ?? {}) : resultsStore.bestResults;
        const ownId = player.value.ID;
        const guesses = Object.entries(rows)
            .filter(([, result]) => hasGuess(result))
            .map(([id, result]) => ({
                position: { ...result.location },
                kind: id === ownId ? ("own" as const) : ("other" as const),
                color: getPlayerColorByID(id),
                title: `${id === ownId ? "Your best guess" : getPlayerNameFromID(id)} · ${formatGuessDistance(result)}`,
            }));
        const pins: RoundResultPin[] = [{ position: answer, kind: "answer", title: "Actual location" }, ...guesses];
        const lines = guesses.map(({ position, kind, color }) => ({ from: answer, to: position, color, own: kind === "own" }));
        return { pins, lines };
    };

    const renderRoundResults = async () => {
        const owner = resources();
        const current = owner.captureResultRender();
        const sdk = googleStore();
        try {
            await sdk.waitForMap();
            if (!current()) return;
            const artwork = resultArtwork();
            const first = artwork?.pins[0];
            if (!artwork || !first) return;
            const markers = await sdk.createRoundResultMarkers(artwork.pins);
            if (!current()) return;

            // A finished match may change rounds while a marker library
            // request is pending. Only the latest view replaces the map layers.
            owner.markers.value.forEach((marker) => (marker.map = null));
            owner.polylines.forEach((line) => line.setMap(null));
            owner.markers.value = markers;
            sdk.fitCustomBounds(
                roundResultBounds(
                    first.position,
                    artwork.pins.slice(1).map(({ position }) => position)
                ),
                {
                    top: 68,
                    right: 40,
                    bottom: 68,
                    left: 40,
                }
            );
            const map = sdk.getMap;
            for (const marker of markers) marker.map = map;
            owner.polylines.length = 0;
            for (const { from, to, color, own } of artwork.lines) {
                const line = sdk.makeResultLine(from, to, color, own);
                line.setMap(map);
                owner.polylines.push(line);
            }
            owner.renderError.value = false;
        } catch (error) {
            if (current()) throw error;
        }
    };

    const reviewFinishedMap = (view: "journey" | number) => {
        const owner = resources();
        const permission = owner.mapView.value;
        if (
            currentState.value !== GameState.FINISHED ||
            !finalResultsReady.value ||
            !permission ||
            permission.lobbyId !== lobbySettings.value?.ID ||
            permission.generation !== owner.generation
        )
            return;
        owner.finishedMapView.value = { match: matchKey(), view };
        const epoch = owner.generation;
        owner.trackRender(
            renderRoundResults().catch(() => {
                if (epoch === owner.generation) owner.renderError.value = true;
            })
        );
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
        resources().draftRound.value = null;
        currentMapPin.value = {} as Coordinates;
        isGuessPending.value = false;
        if (googleStore().isMapInitialized) googleStore().removeMapEventListener("click");
    };
    const restoreRound = async (phase: GameState, round: number, sameRound = false) => {
        const owner = resources();
        const id = player.value.ID;
        const draft = owner.draftRound.value;
        // The recovery snapshot may contain the previously in-flight attempt.
        const retainedPin =
            phase === GameState.PLAYING &&
            id &&
            draft?.key === draftKey(round) &&
            validPin(currentMapPin.value) &&
            getUserLives(id) > 0 &&
            !(resultsStore.rawResults[id] ?? []).some((guess) => draft.sentAfterAttempt !== undefined && guess.attempt > draft.sentAfterAttempt)
                ? currentMapPin.value
                : null;
        const preservePanorama = sameRound && !owner.isRestoring.value && googleStore().panoramaStatus === "ready";
        clearMap();
        currentState.value = phase;
        currentRound.value = round;
        if (phase === GameState.WAITING) return;
        const epoch = owner.generation;
        if (!lobbySettings.value) throw new Error("Lobby settings are not initialized.");
        if (phase !== GameState.PLAYING) {
            owner.authorizeMapView(lobbySettings.value.ID, round);
            return renderRoundResults();
        }
        if (retainedPin) {
            currentMapPin.value = retainedPin;
            owner.draftRound.value = { key: draftKey(round) };
        }
        owner.isRestoring.value = true;
        owner.authorizeRound(lobbySettings.value.ID, round);
        await googleStore().waitForMapAndPano();
        if (owner !== resources() || epoch !== owner.generation) return;
        resetMapAndPanorama(preservePanorama);
        if (id) await restoreGuessMarkers(id);
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
                    // subset of history.
                    owner.markers.value.forEach((marker) => (marker.map = null));
                    owner.markers.value = [];
                    owner.draftMarker.value = null;
                    resetMapAndPanorama();
                    const id = player.value.ID;
                    if (!id) throw new Error("Player unavailable.");
                    await restoreGuessMarkers(id);
                    if (!isCurrent()) return;
                    owner.isRestoring.value = false;
                    setMapClickEventListener();
                }
            } else if ([GameState.MID_ROUND, GameState.FINISHED].includes(currentState.value) && owner.renderError.value) {
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
        if (currentState.value !== GameState.PLAYING || isGuessPending.value || owner.isRestoring.value || roundExpired() || !validPin(coordinates)) return;
        const playerID = player.value.ID;
        if (!playerID || getUserLives(playerID) <= 0) return;
        const isPlacementCurrent = owner.capturePinPlacement();
        const pin = { ...coordinates };
        const key = draftKey(currentRound.value);
        // Only the explicit unsubmitted draft may move, never history markers.
        if (owner.draftMarker.value) {
            owner.draftMarker.value.position = pin;
            currentMapPin.value = pin;
            owner.draftRound.value = { key };
            return;
        }
        const epoch = owner.generation;
        const marker = await googleStore().addGuessMarker(pin, getPlayerColorByID(playerID), true);
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
        owner.draftRound.value = { key };
    };
    const validPin = (pin: Coordinates) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng) && Math.abs(pin.lat) <= 90 && Math.abs(pin.lng) <= 180;
    const acceptGuess = (round: number) => {
        if (!isGuessPending.value || round !== currentRound.value) return;
        const owner = resources();
        if (owner.draftMarker.value) googleStore().confirmGuessMarker(owner.draftMarker.value);
        owner.draftMarker.value = null;
        owner.draftRound.value = null;
        currentMapPin.value = {} as Coordinates;
        isGuessPending.value = false;
    };

    const getUserLives = (userID: string): number => {
        return resultsStore.liveResults[userID]?.lives ?? 0; // Return 0 if userID doesn't exist in results yet
    };

    const submitGuess = () => {
        const owner = resources();
        const id = player.value.ID;
        const draft = owner.draftRound.value;
        if (isSubmitDisabled.value || roundExpired() || !id || !draft) return;
        owner.invalidatePinPlacement();
        owner.draftRound.value = { ...draft, sentAfterAttempt: resultsStore.rawResults[id]?.at(-1)?.attempt ?? 0 };
        isGuessPending.value = true;
        if (!app.$gameRuntime.socketActions.submitLocation({ ...currentMapPin.value })) isGuessPending.value = false;
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
    const restoreGuessMarkers = async (id: string) => {
        const owner = resources();
        const epoch = owner.generation;
        const color = getPlayerColorByID(id);
        const draw = async (pin: Coordinates, draft: boolean) => {
            const marker = await googleStore().addGuessMarker(pin, color, draft);
            if (epoch !== owner.generation) return;
            marker.map = googleStore().getMap;
            owner.markers.value = [...owner.markers.value, marker];
            if (draft) owner.draftMarker.value = marker;
        };
        for (const guess of resultsStore.rawResults[id] ?? []) {
            if (epoch !== owner.generation) return;
            if (hasGuess(guess)) await draw(guess.location, false);
        }
        if (epoch === owner.generation && owner.draftRound.value?.key === draftKey(currentRound.value) && getUserLives(id) > 0 && validPin(currentMapPin.value))
            await draw(currentMapPin.value, true);
    };

    const resetMapAndPanorama = (preservePanorama = false): void => {
        if (!preservePanorama) {
            googleStore().updatePanoramaView(searchedLocationCoords.value);
            googleStore().getPanorama.setPov({ heading: 270, pitch: 0 });
            googleStore().getPanorama.setZoom(0);
        }

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
        reviewFinishedMap,
        processMapPin,
        submitGuess,
        acceptGuess,
    });
};
