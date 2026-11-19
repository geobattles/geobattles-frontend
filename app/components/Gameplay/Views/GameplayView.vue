<template>
    <div id="gameplay_container" class="gameplay-container" :class="{ 'desktop-gameplay': !compactViewport, 'portrait-gameplay': portraitScores }">
        <GameplayGooglePanorama class="google-panorama" :inert="mapModal" />
        <div class="gameplay-hud" :inert="mapModal">
            <div class="gameplay-topbar" :inert="mapModal">
                <GameplayMenu :compact="compactViewport" @leaveLobbyClicked="emit('leaveLobby')" />
            </div>
            <Teleport :to="mapPanel || 'body'" :disabled="!mapModal">
                <div class="gameplay-timer" :class="{ 'map-timer': mapModal }">
                    <GameplayTimerBar v-if="game.modeLogic.currentState === 'PLAYING'" />
                    <span v-else class="muted text-xs">Preparing…</span>
                </div>
            </Teleport>
            <button
                class="btn btn-secondary btn-icon gameplay-fullscreen"
                type="button"
                :inert="mapModal"
                :aria-label="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                :title="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                @click="ui.toggleFullscreen()"
            >
                <UiIcon name="fullscreen" />
            </button>
        </div>
        <Teleport :to="mapPanel || 'body'" :disabled="!mapModal">
            <aside class="gameplay-scoreboard" :class="{ 'map-scoreboard': mapModal }" aria-label="Live scores">
                <h2 v-if="!portraitScores">Round scores</h2>
                <div class="scoreboard-body" tabindex="0" role="region" aria-label="Player scores, scroll for more players">
                    <GameplayBattleRoyaleLiveStatistics v-if="game.currentMode === 'BattleRoyale'" :compact="compactViewport" player-hooks /><GameplayCountryBattleLiveStatistics
                        v-else
                    />
                </div>
            </aside>
        </Teleport>
        <div
            ref="mapPanel"
            class="gameplay-map-wrapper"
            :class="{ 'map-is-open': mapOpen }"
            :role="mapModal ? 'dialog' : undefined"
            :aria-modal="mapModal || undefined"
            :aria-label="mapModal ? 'Choose your guess on the map' : undefined"
        >
            <div class="map-controls">
                <button
                    ref="mapToggle"
                    class="btn btn-secondary map-toggle"
                    type="button"
                    :aria-label="mapOpen ? (compactViewport ? 'Close map' : 'Hide map') : 'Show map'"
                    :title="mapOpen ? (compactViewport ? 'Close map' : 'Hide map') : 'Show map'"
                    :aria-expanded="mapOpen"
                    aria-controls="gameplay-map-slot"
                    @click="toggleMap"
                >
                    <UiIcon :name="mapOpen && compactViewport ? 'close' : 'map'" /><span v-if="!compactViewport || !mapOpen">{{ mapOpen ? "Hide map" : "Map" }}</span></button
                ><span class="own-lives" data-testid="guesses-left"><UiIcon name="pin" />{{ lives }} guesses left</span>
            </div>
            <div id="gameplay-map-slot" class="gameplay-map-slot" :inert="!mapOpen"><GameplayGoogleMap /></div>
            <p v-if="google.mapStatus === 'ready' && google.panoramaStatus === 'ready'" data-testid="maps-ready" class="sr-only">Map initialized and landscape available</p>
            <button
                v-show="!compactViewport || mapOpen || !game.modeLogic.isSubmitDisabled || isGuessPending"
                class="btn btn-icon guess-button"
                type="button"
                :aria-label="guessLabel"
                :title="guessLabel"
                :disabled="game.modeLogic.isSubmitDisabled || !socket.isConnected || !socket.isOnline"
                :aria-busy="isGuessPending"
                @click="game.submitGuess()"
            >
                <span v-if="isGuessPending" class="spinner" /><UiIcon v-else name="pin" /><span :class="{ 'sr-only': compactViewport && !mapOpen }">{{ guessLabel }}</span>
            </button>
        </div>
        <Teleport :to="mapPanel || 'body'" :disabled="!mapModal">
            <GameplayMapRecovery panorama :active="['STARTING', 'PLAYING'].includes(game.modeLogic.currentState)" />
        </Teleport>
    </div>
</template>
<script setup lang="ts">
const emit = defineEmits<{ leaveLobby: []; connectionTarget: [target: HTMLElement | null] }>();
const game = useGameMode();
const ui = useUIManagerStore();
const google = useGoogleStore();
const socket = useWebSocketStore();
const player = usePlayerInfo();
const { isGuessPending } = useBattleRoyaleState();
const compactViewport = ref(false);
const portraitViewport = ref(false);
const portraitScores = computed(() => compactViewport.value && portraitViewport.value);
const mapOpen = ref(true);
const mapModal = computed(() => compactViewport.value && mapOpen.value);
let viewportQuery: MediaQueryList | null = null;
let portraitQuery: MediaQueryList | null = null;
const updatePortrait = () => {
    portraitViewport.value = portraitQuery?.matches ?? false;
};
const mapPanel = ref<HTMLElement | null>(null);
watch([mapModal, mapPanel], ([modal, target]) => emit("connectionTarget", modal ? target : null), { flush: "post" });
const mapToggle = ref<HTMLButtonElement | null>(null);
let returnFocus: HTMLElement | null = null;

const toggleMap = () => {
    if (!mapOpen.value) returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    mapOpen.value = !mapOpen.value;
};
watch(mapOpen, async (open) => {
    await nextTick();
    if (open) mapToggle.value?.focus({ preventScroll: true });
    else if (!open && game.modeLogic.currentState === "PLAYING") {
        const target =
            returnFocus && returnFocus !== document.body && returnFocus.isConnected && returnFocus.getClientRects().length && !returnFocus.closest("[inert]")
                ? returnFocus
                : mapToggle.value;
        target?.focus({ preventScroll: true });
        returnFocus = null;
    }
});
const onMapKeydown = (event: KeyboardEvent) => {
    if (!mapOpen.value || !["STARTING", "PLAYING"].includes(game.modeLogic.currentState)) return;
    // Native recovery/confirmation dialogs take priority over the map overlay.
    if (document.querySelector("dialog[open]")) return;
    if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        mapOpen.value = false;
    } else if (mapModal.value && event.key === "Tab") {
        const controls = Array.from(
            mapPanel.value?.querySelectorAll<HTMLElement>(
                'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])'
            ) ?? []
        ).filter(
            (element) =>
                (!element.hasAttribute("tabindex") || element.tabIndex >= 0) &&
                !element.matches(':disabled, [aria-disabled="true"]') &&
                element.getClientRects().length &&
                getComputedStyle(element).visibility === "visible" &&
                !element.closest("[inert]")
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (first && last && (!mapPanel.value?.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last))) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        }
    }
};

watch(
    () => game.modeLogic.currentState,
    (state) => {
        if (state === "STARTING") {
            mapOpen.value = !compactViewport.value;

            returnFocus = null;
        }
    }
);
const lives = computed(() => ("getUserLives" in game.modeLogic ? game.modeLogic.getUserLives(player.value.ID || "") : 0));
const guessLabel = computed(() => {
    if (!socket.isConnected || !socket.isOnline) return "Waiting for connection";
    if (isGuessPending.value) return "Confirming your guess";
    if (lives.value <= 0) return "No guesses left · keep exploring";
    return game.modeLogic.isSubmitDisabled ? "Place your pin on the map" : "Guess";
});
watch(
    () => google.isMapInitialized,
    (initialized) => {
        if (initialized) ui.mountingProcess();
    },
    { flush: "post" }
);
const updateViewport = () => {
    compactViewport.value = viewportQuery?.matches ?? false;
    // Desktop keeps the original visible minimap; mobile starts on panorama.
    mapOpen.value = !compactViewport.value;
    returnFocus = null;
};
onMounted(() => {
    viewportQuery = window.matchMedia("(max-width: 850px), (max-width: 1100px) and (pointer: coarse)");
    portraitQuery = window.matchMedia("(orientation: portrait)");
    updatePortrait();
    portraitQuery.addEventListener("change", updatePortrait);
    updateViewport();
    viewportQuery.addEventListener("change", updateViewport);
    document.addEventListener("keydown", onMapKeydown, true);
    if (google.isMapInitialized) ui.mountingProcess();
});
onBeforeUnmount(() => {
    viewportQuery?.removeEventListener("change", updateViewport);
    portraitQuery?.removeEventListener("change", updatePortrait);
    document.removeEventListener("keydown", onMapKeydown, true);
    ui.detach();
});
</script>
<style>
.gameplay-container {
    /* Shared thumb-action baseline, leaving provider branding unobscured. */
    --gameplay-action-bottom: max(1.75rem, calc(env(safe-area-inset-bottom) + 0.5rem));
    position: relative;
    width: 100%;
    height: 100dvh;
    overflow: hidden;
    background: var(--gb-bg);
}
.google-panorama {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.gameplay-hud {
    display: contents;
}
.gameplay-topbar {
    position: absolute;
    z-index: 4;
    top: max(0.5rem, env(safe-area-inset-top));
    left: max(0.5rem, env(safe-area-inset-left));
    max-width: min(180px, calc(50% - 48px));
    padding: 2px;
    background: var(--gb-bg);
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    box-shadow: 0 3px 12px #0004;
}
.gameplay-timer {
    position: absolute;
    z-index: 4;
    top: max(0.5rem, env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%);
    width: clamp(72px, 12vw, 112px);
    min-height: 44px;
    display: grid;
    align-items: center;
    padding: 4px 8px;
    background: var(--gb-bg);
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    box-shadow: 0 3px 12px #0004;
}
.gameplay-fullscreen {
    position: absolute;
    z-index: 4;
    top: max(0.5rem, env(safe-area-inset-top));
    right: max(0.5rem, env(safe-area-inset-right));
    width: 44px;
    height: 44px;
    padding: 0;
    background: var(--gb-bg);
    box-shadow: 0 3px 12px #0004;
}
.gameplay-timer.map-timer {
    /* Move the existing clock into the modal, never mount a second timer. */
    pointer-events: none;
}
.gameplay-container:not(.desktop-gameplay) .map-is-open .own-lives {
    /* Reserve the centered clock at narrow widths without hiding guess counts. */
    max-width: calc(50% - 52px);
    min-height: 44px;
    white-space: normal;
    text-align: right;
    line-height: 1.2;
}
.gameplay-scoreboard {
    position: absolute;
    z-index: 3;
    left: max(0.5rem, env(safe-area-inset-left));
    top: calc(max(0.5rem, env(safe-area-inset-top)) + 56px);
    width: min(260px, calc(100% - max(0.5rem, env(safe-area-inset-left)) - max(0.5rem, env(safe-area-inset-right))));
    max-height: min(260px, calc(100dvh - 180px));
    display: flex;
    flex-direction: column;
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    background: var(--gb-surface);
    box-shadow: 0 3px 12px #0004;
}
.gameplay-scoreboard.map-scoreboard {
    /* Keep the same scoreboard inside the map dialog and its focus scope.
       Reserve the top controls and the entire bottom thumb-action area. */
    max-height: min(240px, calc(100dvh - max(0.5rem, env(safe-area-inset-top)) - 56px - var(--gameplay-action-bottom) - 5px - 52px - 12px));
    overflow: hidden;
}
.gameplay-scoreboard.map-scoreboard .scoreboard-body {
    touch-action: pan-y;
}
/* Portrait keeps the table columns and scrollable rows, without a title bar. */
.portrait-gameplay .gameplay-scoreboard {
    width: min(240px, calc(100% - max(0.5rem, env(safe-area-inset-left)) - max(0.5rem, env(safe-area-inset-right))));
    max-height: min(150px, 24dvh, calc(100dvh - max(0.5rem, env(safe-area-inset-top)) - 56px - var(--gameplay-action-bottom) - 5px - 52px - 12px));
}
.gameplay-scoreboard h2 {
    flex: none;
    padding: 6px 8px;
    border-bottom: 1px solid var(--gb-line);
    color: var(--gb-muted);
    font-size: 0.65rem;
    letter-spacing: 0.02em;
}
.scoreboard-body {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
}
.gameplay-map-wrapper {
    position: absolute;
    z-index: 3;
    left: max(0.5rem, env(safe-area-inset-left));
    bottom: var(--gameplay-action-bottom);
    max-width: calc(100% - 1rem);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 4px;
    border: 1px solid var(--gb-line);
    border-radius: 10px;
    background: var(--gb-bg);
    box-shadow: 0 4px 16px #0004;
}
.gameplay-map-wrapper.map-is-open {
    z-index: 10;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    display: block;
    padding: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}
.map-controls {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}
.map-toggle {
    min-height: 44px;
    padding: 0.5rem 0.65rem;
}
.map-is-open .map-controls {
    display: contents;
}
.map-is-open .map-toggle {
    position: absolute;
    z-index: 2;
    top: max(0.5rem, env(safe-area-inset-top));
    left: max(0.5rem, env(safe-area-inset-left));
    width: 44px;
    height: 44px;
    padding: 0;
    background: var(--gb-bg);
    box-shadow: 0 3px 12px #0004;
}
.own-lives {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--gb-muted);
    font-size: 0.75rem;
    white-space: nowrap;
    padding-right: 0.25rem;
}
.map-is-open .own-lives {
    position: absolute;
    z-index: 2;
    top: max(0.5rem, env(safe-area-inset-top));
    right: max(0.5rem, env(safe-area-inset-right));
    min-height: 32px;
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    background: var(--gb-bg);
    box-shadow: 0 3px 12px #0004;
}
.gameplay-map-slot {
    position: absolute;
    z-index: 0;
    width: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
}
.map-is-open .gameplay-map-slot {
    inset: 0;
    width: 100%;
    height: 100%;
    visibility: visible;
    pointer-events: auto;
}
.game-map-host {
    width: 100%;
    height: 100%;
    min-height: 0;
    border-radius: 7px;
    background: var(--gb-surface);
    color-scheme: light;
}
.map-is-open .game-map-host {
    border-radius: 0;
}
.guess-button {
    width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
    font-size: 0.9rem;
    flex: none;
}
.map-is-open .guess-button {
    position: absolute;
    z-index: 2;
    bottom: calc(var(--gameplay-action-bottom) + 5px);
    left: calc(max(0.5rem, env(safe-area-inset-left)) + 5px);
    width: auto;
    max-width: calc(100% - max(0.5rem, env(safe-area-inset-left)) - max(0.5rem, env(safe-area-inset-right)));
    height: auto;
    padding: 0.6rem 0.85rem;
    gap: 0.5rem;
    background: var(--gb-bg);
    color: var(--gb-accent);
    border: 1px solid var(--gb-accent);
    box-shadow: 0 3px 12px #0005;
}
.map-is-open .guess-button:not(:disabled):hover {
    background: var(--gb-raised);
}
.map-is-open .guess-button:disabled {
    opacity: 1;
    color: var(--gb-muted);
    border-color: var(--gb-line);
}
.map-is-open .guess-button:not(:disabled):active {
    transform: translateY(1px);
}
.panorama-loading {
    position: absolute;
    z-index: 2;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: 360px;
    width: calc(100% - 3rem);
    text-align: center;
    pointer-events: none;
}

/* Mobile actions share a 52px target and baseline in either view. */
.gameplay-container:not(.desktop-gameplay) .gameplay-map-wrapper:not(.map-is-open) .map-toggle,
.gameplay-container:not(.desktop-gameplay) .guess-button {
    min-height: 52px;
}
.gameplay-container:not(.desktop-gameplay) .gameplay-map-wrapper:not(.map-is-open) .guess-button {
    width: 52px;
    height: 52px;
}
.gameplay-container:not(.desktop-gameplay) .map-is-open .guess-button {
    padding: 0.75rem 1rem;
    max-width: calc(100% - max(0.5rem, env(safe-area-inset-left)) - max(0.5rem, env(safe-area-inset-right)) - 10px);
}
.gameplay-container:not(.desktop-gameplay) .guess-button > svg {
    width: 1.25rem;
    height: 1.25rem;
}
/* Preserve the previous desktop composition; compact floating UI is mobile-only. */
.desktop-gameplay .gameplay-hud {
    position: absolute;
    z-index: 4;
    top: max(0.75rem, env(safe-area-inset-top));
    left: 0.75rem;
    width: min(540px, calc(100% - min(480px, 40vw) - 2.25rem));
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    background: var(--gb-bg);
    border: 1px solid var(--gb-line);
    border-radius: 12px;
    box-shadow: 0 6px 20px #0003;
}
.desktop-gameplay .gameplay-topbar,
.desktop-gameplay .gameplay-timer,
.desktop-gameplay .gameplay-fullscreen {
    position: static;
    transform: none;
    max-width: none;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
}
.desktop-gameplay .gameplay-timer {
    width: 100px;
    min-height: 0;
    flex: none;
}
.desktop-gameplay .gameplay-fullscreen {
    background: var(--gb-raised);
    flex: none;
}
.desktop-gameplay .gameplay-topbar .game-menu {
    gap: 1rem;
}
.desktop-gameplay .gameplay-topbar .round-meta {
    display: block;
    padding: 0;
}
.desktop-gameplay .gameplay-topbar .round-label {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
}
.desktop-gameplay .gameplay-topbar .game-connection {
    width: auto;
    font-size: 0.65rem;
    padding: 0.2rem 0.45rem;
    border: 1px solid var(--gb-line);
    background: var(--gb-raised);
}
.desktop-gameplay .gameplay-timer .timer-label {
    gap: 0.5rem;
}
.desktop-gameplay .gameplay-timer .timer-label > svg {
    display: block;
}
.desktop-gameplay .gameplay-timer strong {
    font-size: 1.55rem;
}
.desktop-gameplay .gameplay-timer strong span {
    font-size: 0.8rem;
}
.desktop-gameplay .gameplay-timer progress {
    height: 3px;
    margin-top: 0.4rem;
}
.desktop-gameplay .gameplay-scoreboard {
    left: auto;
    right: 0.75rem;
    top: 0.75rem;
    width: min(480px, 40vw);
    max-height: calc(100dvh - 1.5rem);
    border-radius: 12px;
}
.desktop-gameplay .gameplay-scoreboard h2 {
    padding: 0.8rem 1rem;
    font-size: 0.8rem;
}
.desktop-gameplay .scoreboard-body {
    padding: 0 0.7rem 0.5rem;
}
.desktop-gameplay .gameplay-map-wrapper {
    z-index: 3;
    inset: auto;
    left: 0.75rem;
    bottom: max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem));
    width: clamp(300px, 30vw, 390px);
    height: auto;
    max-width: calc(100% - 1.5rem);
    display: block;
    padding: 0.6rem;
    border: 1px solid var(--gb-line);
    border-radius: 12px;
    box-shadow: 0 8px 30px #0004;
}
.desktop-gameplay .map-controls {
    display: flex;
    justify-content: space-between;
    padding-bottom: 0.5rem;
}
.desktop-gameplay .map-toggle {
    position: static;
    width: auto;
    height: auto;
    padding: 0.5rem 0.65rem;
    background: var(--gb-raised);
    box-shadow: none;
}
.desktop-gameplay .gameplay-map-wrapper .own-lives {
    position: static;
    min-height: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    font-size: 0.7rem;
}
.desktop-gameplay .gameplay-map-slot {
    position: static;
    width: 100%;
    height: 0;
}
.desktop-gameplay .map-is-open .gameplay-map-slot {
    height: clamp(160px, 29dvh, 320px);
    margin-bottom: 0.6rem;
}
.desktop-gameplay .game-map-host {
    border-radius: 7px;
}
.desktop-gameplay .gameplay-map-wrapper .guess-button {
    position: static;
    width: 100%;
    max-width: none;
    min-height: 48px;
    height: auto;
    padding: 0.75rem;
    background: var(--gb-accent);
    color: var(--gb-on-accent);
    border: 0;
    box-shadow: none;
}
.desktop-gameplay .gameplay-map-wrapper .guess-button:disabled {
    opacity: 0.5;
}
@media (hover: hover) and (pointer: fine) and (min-width: 1100px) and (min-height: 601px) {
    .desktop-gameplay .gameplay-map-wrapper.map-is-open:hover,
    .desktop-gameplay .gameplay-map-wrapper.map-is-open:focus-within {
        width: min(540px, 48vw);
    }
    .desktop-gameplay .gameplay-map-wrapper.map-is-open:hover .gameplay-map-slot,
    .desktop-gameplay .gameplay-map-wrapper.map-is-open:focus-within .gameplay-map-slot {
        height: min(42dvh, 420px);
    }
}
</style>
