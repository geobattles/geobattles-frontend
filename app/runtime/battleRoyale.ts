import type { Ref } from "vue";
import type { createGoogleRuntime } from "./google";
import { ROUND_COUNTDOWN_MS } from "./roundClock";

export const createBattleRoyaleRuntime = (googleStore: ReturnType<typeof createGoogleRuntime>) => {
    const markers = shallowRef<google.maps.marker.AdvancedMarkerElement[]>([]);
    const draftMarker = shallowRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const draftRound = shallowRef<{ key: string; sentAfterAttempt?: number } | null>(null);
    const isRestoring = shallowRef(false);
    const renderError = shallowRef(false);
    const retryingMaps = shallowRef(false);
    let mapsRetryOperation: symbol | null = null;
    const beginMapsRetry = () => {
        const operation = Symbol("maps retry");
        mapsRetryOperation = operation;
        retryingMaps.value = true;
        // Busy ownership is independent of replaceable map-view grants.
        return () => {
            if (mapsRetryOperation !== operation) return;
            mapsRetryOperation = null;
            retryingMaps.value = false;
        };
    };
    let pendingRender: Promise<void> | null = null;
    const trackRender = (pending: Promise<void>) => {
        pendingRender = pending;
        void pending.finally(() => {
            if (pendingRender === pending) pendingRender = null;
        });
    };
    // Positive permission comes only from applied START/own snapshot state,
    // never from a resource generation increment during cleanup.
    const activeRound = shallowRef<{ lobbyId: string; round: number; generation: number } | null>(null);
    // Result views need a map too, but never permission to create Street View.
    const mapView = shallowRef<{ lobbyId: string; round: number; generation: number } | null>(null);
    let pinGeneration = 0;
    let resultGeneration = 0;
    const finishedMapView = shallowRef<{ match: string; view: "journey" | number } | null>(null);
    const invalidatePinPlacement = () => {
        pinGeneration++;
    };
    const capturePinPlacement = () => {
        const epoch = ++pinGeneration;
        return () => epoch === pinGeneration;
    };
    const captureResultRender = () => {
        const epoch = generation;
        const request = ++resultGeneration;
        return () => epoch === generation && request === resultGeneration;
    };
    const polylines: google.maps.Polyline[] = [];
    const countdownRemaining = shallowRef<(() => number) | null>(null);
    let cancelCountdown: (() => void) | undefined;
    const clearCountdown = () => {
        cancelCountdown?.();
        cancelCountdown = undefined;
        countdownRemaining.value = null;
    };
    const startCountdown = (roundDeadline: Readonly<Ref<number | null>>, roundTime: number, finish: () => void) => {
        clearCountdown();
        const wallRemaining = () => (roundDeadline.value ?? 0) - roundTime * 1000 - Date.now();
        const duration = Math.min(ROUND_COUNTDOWN_MS, wallRemaining());
        if (duration <= 0) {
            finish();
            return;
        }

        const endsAt = performance.now() + duration;
        // The monotonic bound prevents a wall-clock adjustment from extending
        // the intro. The round clock also accounts for sleep and shorter snapshots.
        const remaining = () => Math.max(0, Math.min(endsAt - performance.now(), wallRemaining()));
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const advance = () => {
            clearTimeout(timeout);
            const left = remaining();
            if (left > 0) {
                timeout = setTimeout(advance, Math.ceil(left));
                return;
            }
            clearCountdown();
            finish();
        };
        const resume = () => {
            if (!document.hidden) advance();
        };
        const stopWatching = watch(roundDeadline, advance);
        document.addEventListener("visibilitychange", resume);
        window.addEventListener("pageshow", resume);
        cancelCountdown = () => {
            clearTimeout(timeout);
            stopWatching();
            document.removeEventListener("visibilitychange", resume);
            window.removeEventListener("pageshow", resume);
        };
        countdownRemaining.value = remaining;
        advance();
    };
    let generation = 0;
    const authorizeMapView = (lobbyId: string, round: number) => {
        mapView.value = { lobbyId, round, generation };
    };
    const authorizeRound = (lobbyId: string, round: number) => {
        authorizeMapView(lobbyId, round);
        activeRound.value = { lobbyId, round, generation };
    };
    const clearMap = (preserveDraft = false) => {
        clearCountdown();
        googleStore.clearMapBounds();
        activeRound.value = null;
        mapView.value = null;
        generation++;
        invalidatePinPlacement();
        draftMarker.value = null;
        if (!preserveDraft) draftRound.value = null;
        isRestoring.value = false;
        renderError.value = false;
        mapsRetryOperation = null;
        retryingMaps.value = false;
        pendingRender = null;
        markers.value.forEach((marker) => (marker.map = null));
        markers.value = [];
        polylines.forEach((line) => line.setMap(null));
        polylines.length = 0;
        if (googleStore.isMapInitialized) googleStore.removeMapEventListener("click");
    };
    return {
        markers,
        draftMarker,
        draftRound,
        isRestoring,
        renderError,
        retryingMaps,
        beginMapsRetry,
        trackRender,
        get pendingRender() {
            return pendingRender;
        },
        activeRound,
        mapView,
        finishedMapView,
        captureResultRender,
        authorizeMapView,
        authorizeRound,
        invalidatePinPlacement,
        capturePinPlacement,
        polylines,
        countdownRemaining: readonly(countdownRemaining),
        startCountdown,
        clearMap,
        get generation() {
            return generation;
        },
    };
};
