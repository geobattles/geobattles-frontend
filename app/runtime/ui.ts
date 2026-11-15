import { watch, type Ref, type WatchStopHandle } from "vue";
import { GameState } from "~/types/appTypes";

/** One client owner moves the existing map host; it never creates another map. */
export const createUIRuntime = (googleStore: ReturnType<typeof import("./google").createGoogleRuntime>, currentGameState: Ref<GameState>, flags: ReturnType<typeof useUIState>) => {
    type EventCallback = (event: CustomEvent) => void;
    const googleMap = shallowRef<HTMLElement | null>(null);
    const gameplayPageContainer = shallowRef<HTMLElement | null>(null);
    const isFullscreen = ref(false);
    const fullscreenAvailable = ref(false);
    const toast = useToast();
    const listeners = new Map<string, Set<EventCallback>>();
    const styleTimers = new Set<ReturnType<typeof setTimeout>>();
    let stateWatcher: WatchStopHandle | undefined;
    let mapObserver: ResizeObserver | undefined;
    let resizeFrame = 0;
    const refreshMapLayout = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            // Preserve gameplay camera; result framing is reapplied only after
            // layout, including revealing the mobile Answer map tab.
            googleStore.refreshMapLayout();
        });
    };
    const updateFullscreen = () => {
        isFullscreen.value = !!gameplayPageContainer.value && document.fullscreenElement === gameplayPageContainer.value;
    };
    const detach = () => {
        stateWatcher?.();
        stateWatcher = undefined;
        styleTimers.forEach(clearTimeout);
        styleTimers.clear();
        mapObserver?.disconnect();
        mapObserver = undefined;
        cancelAnimationFrame(resizeFrame);
        resizeFrame = 0;
        googleMap.value = null;
    };
    const moveMap = (id: string) => {
        const host = googleMap.value;
        const target = document.getElementById(id);
        if (!host || !target || host.contains(target)) return;
        host.classList.add("game-map-host");
        if (host.parentElement !== target) target.appendChild(host);
        refreshMapLayout();
    };
    const moveMapToPlaying = () => moveMap("gameplay-map-slot");
    const moveMapToMidRound = () => moveMap("midround-map-slot");
    const moveMapToFinished = () => moveMap("endgame-map-slot");
    const positionMap = () => {
        if (currentGameState.value === GameState.MID_ROUND) moveMapToMidRound();
        else if (currentGameState.value === GameState.FINISHED) moveMapToFinished();
        else moveMapToPlaying();
        if (currentGameState.value === GameState.PLAYING && googleStore.isPanoramaInitialized) googleStore.getPanorama.setVisible(true);
    };
    const mountingProcess = () => {
        detach();
        if (!googleStore.isMapInitialized) return;
        googleMap.value = googleStore.getMapHTML;
        mapObserver = new ResizeObserver(refreshMapLayout);
        mapObserver.observe(googleMap.value);
        stateWatcher = watch(currentGameState, positionMap, { immediate: true, flush: "post" });
    };
    const setGameplayPageContainer = (container: HTMLElement | null) => {
        document.removeEventListener("fullscreenchange", updateFullscreen);
        gameplayPageContainer.value = container;
        fullscreenAvailable.value = !!container?.requestFullscreen;
        if (container) document.addEventListener("fullscreenchange", updateFullscreen);
        updateFullscreen();
    };
    const toggleFullscreen = async () => {
        if (!gameplayPageContainer.value?.requestFullscreen) {
            toast.add({ severity: "info", summary: "Fullscreen is not available", detail: "Your browser can still play in its current window." });
            return;
        }
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await gameplayPageContainer.value.requestFullscreen();
        } catch {
            toast.add({ severity: "warn", summary: "Could not change fullscreen", detail: "Your browser may restrict fullscreen. You can keep playing in this window." });
        }
    };
    const applyGuessStyles = (playerId: string, _previousLeader: string | undefined, newLeader: string | undefined) => {
        const row = document.getElementById(`live-player-${playerId}`);
        if (!row) return;
        const className = newLeader === playerId ? "applied-guess-lead" : "applied-guess";
        row.classList.add(className);
        const timer = setTimeout(() => {
            styleTimers.delete(timer);
            row.classList.remove(className);
        }, 1000);
        styleTimers.add(timer);
    };
    const on = (event: string, callback: EventCallback) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(callback);
    };
    const off = (event: string, callback: EventCallback) => {
        listeners.get(event)?.delete(callback);
    };
    const dispatch = (event: string, detail: unknown) => {
        for (const callback of listeners.get(event) ?? []) callback(new CustomEvent(event, { detail }));
    };
    const showPlayerLeftToast = (playerName: string, disconnected = false) => dispatch("showPlayerLeftToast", { playerName, disconnected });
    const dispose = () => {
        detach();
        setGameplayPageContainer(null);
        listeners.clear();
    };
    return reactive({
        detach,
        dispose,
        googleMap,
        gameplayPageContainer,
        isMobile: flags.isMobile,
        isVertical: flags.isVertical,
        isFullscreen,
        fullscreenAvailable,
        mountingProcess,
        moveMapToPlaying,
        moveMapToMidRound,
        moveMapToFinished,
        setGameplayPageContainer,
        toggleFullscreen,
        applyGuessStyles,
        on,
        off,
        dispatch,
        triggerPlayerLeft: showPlayerLeftToast,
        showPlayerLeftToast,
    });
};
