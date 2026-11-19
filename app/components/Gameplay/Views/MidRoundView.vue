<template>
    <section class="results-screen midround-screen" :class="{ 'mobile-map-active': mobileView === 'map' }" aria-label="Round results">
        <header class="results-header">
            <div class="results-title">
                <span class="result-mark" aria-hidden="true">{{ game.modeLogic.currentRound }}</span>
                <div>
                    <p class="eyebrow !mb-1">Round complete</p>
                    <h1>Round {{ game.modeLogic.currentRound }} debrief</h1>
                </div>
            </div>
            <div class="btn-row">
                <SocketConnectionStatus v-if="game.modeLogic.currentState === 'MID-ROUND'" /><button
                    type="button"
                    class="btn btn-secondary btn-icon"
                    :aria-label="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                    @click="ui.toggleFullscreen()"
                >
                    <UiIcon name="fullscreen" /></button
                ><LobbyLeave @click="emit('leaveLobby')" />
            </div>
        </header>
        <nav class="results-mobile-switch" aria-label="Round display">
            <button type="button" class="btn btn-secondary" :aria-pressed="mobileView === 'results'" @click="mobileView = 'results'"><UiIcon name="users" />Results</button>
            <button type="button" class="btn btn-secondary" :aria-pressed="mobileView === 'map'" @click="mobileView = 'map'"><UiIcon name="map" />Answer map</button>
        </nav>
        <div id="midround-map-and-results" class="results-layout">
            <div id="midround-map-slot" class="results-map-slot" aria-label="Round answer and closest guesses"></div>
            <div id="midround-results-container" class="results-inspector">
                <div class="results-details" :tabindex="compactViewport ? 0 : undefined" role="region" aria-label="Round debrief and player results">
                    <div class="tab-buttons" role="group" aria-label="Choose results view">
                        <button class="btn btn-secondary" type="button" :aria-pressed="tab === 'total'" @click="tab = 'total'">Total points</button
                        ><button class="btn btn-secondary" type="button" :aria-pressed="tab === 'round'" @click="tab = 'round'">This round</button>
                    </div>
                    <GameplayBattleRoyaleLiveStatistics v-if="tab === 'round'" :compact="compactViewport" /><GameplayTotalStatistics v-else />
                    <GameplayRoundDebrief :compact="compactViewport" />
                </div>
                <footer class="round-actions">
                    <button
                        v-if="lobby.isPlayerAdmin()"
                        class="btn btn-large btn-command"
                        type="button"
                        :disabled="!socket.isConnected || !socket.isOnline || request.isStartPending || !!actions.startUnavailableReason"
                        :aria-busy="request.isStartPending"
                        @click="start"
                    >
                        <span v-if="request.isStartPending" class="spinner" />Next round <UiIcon name="arrow" />
                    </button>
                    <p v-else class="muted text-sm">Waiting for the host.</p>
                    <p v-if="actions.startUnavailableReason" class="field-help">{{ actions.startUnavailableReason }}</p>
                    <p class="field-help">Round {{ game.modeLogic.currentRound }} of {{ lobby.lobbySettings?.conf.numRounds }}</p>
                </footer>
            </div>
        </div>
    </section>
</template>
<script setup lang="ts">
const emit = defineEmits<{ leaveLobby: [] }>();
const game = useGameMode();
const lobby = useLobbyStore();
const socket = useWebSocketStore();
const actions = useLobbySocketActions();
const request = useRequestState();
const ui = useUIManagerStore();
const tab = ref<"round" | "total">("total");
const mobileView = ref<"results" | "map">("results");
// Keep the table density in step with the mobile CSS, including orientation changes.
const compactViewport = ref(false);
let viewportQuery: MediaQueryList | undefined;
const syncViewport = () => {
    compactViewport.value = viewportQuery?.matches ?? false;
};
onMounted(() => {
    viewportQuery = window.matchMedia("(max-width: 850px), (max-width: 1100px) and (pointer: coarse)");
    syncViewport();
    viewportQuery.addEventListener("change", syncViewport);
});
onBeforeUnmount(() => viewportQuery?.removeEventListener("change", syncViewport));
watch([() => game.modeLogic.currentState, () => game.modeLogic.currentRound], ([state]) => {
    if (state !== "MID-ROUND") return;
    tab.value = "total";
    mobileView.value = "results";
});
const start = () => {
    if (socket.isConnected && socket.isOnline && !request.isStartPending && !actions.startUnavailableReason) actions.start();
};
</script>
<style>
.results-screen {
    min-height: 100dvh;
    background: var(--gb-bg);
}
.results-mobile-switch {
    display: none;
}
.results-header {
    min-height: 112px;
    background-color: #1e201e;
    background-image: var(--gb-contours);
    background-size: 620px 340px;
    background-position: right top;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1.3rem clamp(1rem, 3vw, 2rem);
    border-bottom: 1px solid var(--gb-line);
}
.results-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
}
.results-title > div {
    min-width: 0;
}
.result-mark {
    display: grid;
    place-items: center;
    flex: none;
    width: 52px;
    height: 52px;
    border: 1px solid var(--gb-accent-end);
    border-radius: 3px;
    color: var(--gb-accent);
    background: var(--gb-bg);
    font: 700 1.75rem / 1 var(--gb-font-mono);
    font-variant-numeric: tabular-nums;
}
.result-mark > svg {
    width: 25px;
    height: 25px;
}
.results-header h1 {
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 800;
}
.results-layout {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    min-height: calc(100dvh - 112px);
}
.results-map-slot {
    position: sticky;
    top: 0;
    height: calc(100dvh - 112px);
    min-height: 350px;
    background: var(--gb-surface);
}
.results-map-slot > .game-map-host {
    border-radius: 0;
}
.results-inspector {
    min-width: 0;
    padding: clamp(1rem, 3vw, 2rem);
    background: var(--gb-surface);
}
.results-inspector .tab-buttons {
    gap: 0;
    border-bottom: 1px solid var(--gb-line);
}
.results-inspector .tab-buttons > button {
    border: 0;
    border-radius: 0;
    color: var(--gb-muted);
    background: transparent;
    box-shadow: none;
}
.results-inspector .tab-buttons > [aria-pressed="true"] {
    color: var(--gb-accent);
    box-shadow: inset 0 -2px var(--gb-accent);
}
.results-details {
    display: contents;
}
.round-actions {
    display: grid;
    gap: 1rem;
    padding-top: 1.5rem;
    margin-top: 1.5rem;
    border-top: 1px solid var(--gb-line);
}
@media (max-width: 850px), (max-width: 1100px) and (pointer: coarse) {
    .results-screen {
        height: 100dvh;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .results-layout {
        flex: 1;
        min-height: 0;
        grid-template-columns: 1fr;
        grid-template-rows: minmax(0, 1fr);
    }
    .results-map-slot {
        position: relative;
        display: none;
        height: 100%;
        min-height: 0;
        padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }
    .mobile-map-active .results-map-slot {
        display: block;
    }
    .mobile-map-active .results-inspector {
        display: none;
    }
    .results-inspector {
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 0.75rem max(0.75rem, env(safe-area-inset-right)) max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
    }
    .results-details {
        display: block;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
    }
    .results-details:focus-visible {
        outline: 2px solid var(--gb-accent);
        outline-offset: -2px;
    }
    .results-header {
        flex: none;
        flex-wrap: nowrap;
        gap: 0.5rem;
        min-height: 60px;
        padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 6px max(8px, env(safe-area-inset-left));
    }
    .results-header > div:first-child {
        min-width: 0;
    }
    .results-header .eyebrow {
        display: none;
    }
    .results-title {
        gap: 0.5rem;
    }
    .result-mark {
        width: 30px;
        height: 34px;
        font-size: 1.1rem;
    }
    .result-mark > svg {
        width: 18px;
        height: 18px;
    }
    .results-header h1 {
        font-size: 1.05rem;
    }
    .results-header > .btn-row {
        flex: none;
        flex-wrap: nowrap;
        gap: 4px;
    }
    .results-header .btn {
        width: 44px;
        height: 44px;
        padding: 0;
        font-size: 0;
        gap: 0;
    }
    .results-header .btn > svg {
        font-size: 1.1rem;
    }
    .results-header [data-testid="connection-status"] {
        display: none;
    }
    .results-mobile-switch {
        flex: none;
        display: flex;
        gap: 6px;
        padding: 4px max(8px, env(safe-area-inset-right)) 4px max(8px, env(safe-area-inset-left));
        border-bottom: 1px solid var(--gb-line);
    }
    .results-mobile-switch > button {
        flex: 1;
        min-height: 44px;
        padding: 0.4rem;
        font-size: 0.8rem;
    }
    .results-mobile-switch [aria-pressed="true"] {
        color: var(--gb-accent);
        background: var(--gb-raised);
        border-color: var(--gb-accent);
    }
    .round-actions {
        flex: none;
        order: -1;
        gap: 0.4rem;
        margin: 0 0 0.75rem;
        padding: 0 0 0.75rem;
        border-top: 0;
        border-bottom: 1px solid var(--gb-line);
    }
    .round-actions > .btn {
        min-height: 52px;
        padding: 0.5rem;
        font-size: 0.9rem;
    }
    .round-actions > .field-help:last-child {
        display: none;
    }
    .results-inspector .tab-buttons {
        gap: 6px;
        margin-bottom: 0.65rem;
    }
    .results-inspector .tab-buttons > button {
        padding: 0.4rem;
        min-height: 44px;
        font-size: 0.8rem;
    }
}
.midround-screen .results-details > .round-debrief {
    margin-top: 0.65rem;
}
@media (max-width: 850px) and (orientation: portrait), (max-width: 1100px) and (pointer: coarse) and (orientation: portrait) {
    .midround-screen .results-mobile-switch {
        display: none;
    }
    .midround-screen .results-layout {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: repeat(2, minmax(0, 1fr));
    }
    .midround-screen .results-map-slot {
        display: block;
        grid-row: 2;
        border-top: 1px solid var(--gb-line);
    }
    .midround-screen .results-inspector {
        display: flex;
        grid-row: 1;
        padding-block: 0.4rem;
    }
    .midround-screen .round-actions {
        margin-bottom: 0.25rem;
        padding-bottom: 0.35rem;
    }
    .midround-screen .results-inspector .tab-buttons {
        margin-bottom: 0.25rem;
    }
}
/* Wide mobile landscape uses both panes; the native map host stays in its slot.
   Only the details scroll, keeping Next round available above every player row. */
@media (min-width: 640px) and (max-width: 850px) and (orientation: landscape), (min-width: 640px) and (max-width: 1100px) and (pointer: coarse) and (orientation: landscape) {
    .results-mobile-switch {
        display: none;
    }
    .results-layout {
        grid-template-columns: minmax(0, 1fr) minmax(300px, 1fr);
    }
    .results-map-slot,
    .mobile-map-active .results-map-slot {
        display: block;
        padding-right: 0;
    }
    .results-inspector,
    .mobile-map-active .results-inspector {
        display: flex;
        padding-left: 0.65rem;
        border-left: 1px solid var(--gb-line);
    }
    .results-header {
        min-height: 52px;
        padding-top: max(4px, env(safe-area-inset-top));
        padding-bottom: 4px;
    }
    .round-actions {
        gap: 0.25rem;
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
    }
}
</style>
