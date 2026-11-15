import type { createGoogleRuntime } from "./google";

export const createBattleRoyaleRuntime = (googleStore: ReturnType<typeof createGoogleRuntime>) => {
    const markers = shallowRef<google.maps.marker.AdvancedMarkerElement[]>([]);
    const draftMarker = shallowRef<google.maps.marker.AdvancedMarkerElement | null>(null);
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
    const invalidatePinPlacement = () => {
        pinGeneration++;
    };
    const capturePinPlacement = () => {
        const epoch = ++pinGeneration;
        return () => epoch === pinGeneration;
    };
    const polylines: google.maps.Polyline[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let generation = 0;
    const authorizeMapView = (lobbyId: string, round: number) => {
        mapView.value = { lobbyId, round, generation };
    };
    const authorizeRound = (lobbyId: string, round: number) => {
        authorizeMapView(lobbyId, round);
        activeRound.value = { lobbyId, round, generation };
    };
    const schedule = (callback: () => void, delay: number) => {
        const id = setTimeout(() => {
            timers.delete(id);
            callback();
        }, delay);
        timers.add(id);
    };
    const clearMap = () => {
        googleStore.clearMapBounds();
        activeRound.value = null;
        mapView.value = null;
        generation++;
        invalidatePinPlacement();
        draftMarker.value = null;
        isRestoring.value = false;
        renderError.value = false;
        mapsRetryOperation = null;
        retryingMaps.value = false;
        pendingRender = null;
        timers.forEach(clearTimeout);
        timers.clear();
        markers.value.forEach((marker) => (marker.map = null));
        markers.value = [];
        polylines.forEach((line) => line.setMap(null));
        polylines.length = 0;
        if (googleStore.isMapInitialized) googleStore.removeMapEventListener("click");
    };
    return {
        markers,
        draftMarker,
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
        authorizeMapView,
        authorizeRound,
        invalidatePinPlacement,
        capturePinPlacement,
        polylines,
        schedule,
        clearMap,
        get generation() {
            return generation;
        },
    };
};
