<template>
    <section
        class="results-screen endgame-screen"
        :class="{ 'mobile-map-active': mobileView === 'map' }"
        :data-testid="finalResultsReady ? 'match-results' : undefined"
        aria-label="Completed expedition"
    >
        <header class="results-header">
            <div class="results-title">
                <span class="result-mark" aria-hidden="true"><UiIcon name="trophy" /></span>
                <div>
                    <p class="eyebrow !mb-1">Final results</p>
                    <h1>Expedition complete.</h1>
                </div>
            </div>
            <div class="btn-row">
                <SocketConnectionStatus v-if="game.modeLogic.currentState === 'FINISHED'" /><NuxtLink
                    to="/journal"
                    class="btn btn-secondary"
                    aria-label="Expedition journal"
                    title="Expedition journal"
                    ><UiIcon name="journal" />Expedition journal</NuxtLink
                ><button class="btn btn-secondary btn-icon" type="button" :aria-label="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'" @click="ui.toggleFullscreen()">
                    <UiIcon name="fullscreen" /></button
                ><LobbyLeave @click="emit('leaveLobby')" />
            </div>
        </header>
        <nav class="results-mobile-switch" aria-label="Final display">
            <button type="button" class="btn btn-secondary" :aria-pressed="mobileView === 'results'" @click="mobileView = 'results'"><UiIcon name="trophy" />Standings</button>
            <button type="button" class="btn btn-secondary" :aria-pressed="mobileView === 'map'" @click="mobileView = 'map'"><UiIcon name="map" />Answer map</button>
        </nav>
        <div id="endgame-map-and-results" class="results-layout">
            <div id="endgame-map-slot" class="results-map-slot" aria-label="Final round answer and closest guesses"></div>
            <div id="endgame-results-container" class="results-inspector">
                <template v-if="finalResultsReady">
                    <div class="results-details endgame-results-body" tabindex="0" role="region" aria-label="Final standings and lobby players">
                        <GameplayGameWinner />
                        <div class="endgame-standings">
                            <h2>Final standings</h2>
                            <GameplayTotalStatistics />
                        </div>
                        <hr class="divider" />
                        <GameplayRoundDebrief />
                        <hr class="divider" />
                        <LobbyPlayerList v-if="game.modeLogic.currentState === 'FINISHED'" />
                        <hr class="divider" />
                        <div class="btn-row">
                            <button v-if="lobby.isPlayerAdmin()" class="btn btn-secondary" type="button" :disabled="!socket.isConnected" @click="lobby.modifySettingsModal = true">
                                <UiIcon name="settings" />Settings</button
                            ><LobbyInviteLink />
                        </div>
                        <p class="field-help mt-4">A new game keeps the same lobby and crew. Everyone checks in as ready again.</p>
                    </div>
                    <div class="endgame-replay"><LobbyStartGame replay /></div>
                </template>
                <p v-else class="notice" role="status">Waiting for the server’s final standings. Your finished result will appear here once confirmed.</p>
            </div>
        </div>
        <UiDialog v-model:open="lobby.modifySettingsModal" title="Lobby settings" eyebrow="A different route?" wide
            ><LobbyModifySettings @close="lobby.modifySettingsModal = false"
        /></UiDialog>
    </section>
</template>
<script setup lang="ts">
const emit = defineEmits<{ leaveLobby: [] }>();
const lobby = useLobbyStore();
const socket = useWebSocketStore();
const ui = useUIManagerStore();
const game = useGameMode();
const { finalResultsReady } = useLobbyState();
const mobileView = ref<"results" | "map">("results");
watch(
    () => game.modeLogic.currentState,
    (state) => {
        if (state === "FINISHED") mobileView.value = "results";
    }
);
</script>
<style>
.endgame-results-body {
    display: block;
}
.endgame-results-body:focus-visible {
    outline-offset: -2px;
}
.endgame-standings > h2 {
    font: 600 0.7rem / 1.4 var(--gb-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
    color: var(--gb-muted);
}
.endgame-replay {
    padding-top: 1.25rem;
    margin-top: 1.25rem;
    border-top: 1px solid var(--gb-line);
}
@media (max-width: 850px), (pointer: coarse), (max-height: 600px) and (orientation: landscape) {
    .endgame-replay {
        flex: none;
        order: -1;
        padding: 0 0 0.75rem;
        margin: 0 0 0.75rem;
        border-top: 0;
        border-bottom: 1px solid var(--gb-line);
    }
    .endgame-replay .eyebrow,
    .endgame-replay .ready-check > .muted {
        display: none;
    }
    .endgame-replay h2 {
        font-size: 1rem;
    }
    .endgame-replay .ready-heading {
        gap: 0.5rem;
    }
    .endgame-replay .ready-actions {
        margin-top: 0.5rem;
        gap: 0.5rem;
    }
    .endgame-replay .ready-check > .field-help {
        margin-top: 0.4rem;
        font-size: 0.75rem;
    }
    .endgame-screen .divider {
        margin-block: 0.75rem;
    }
    .endgame-standings > h2 {
        font-size: 0.68rem;
        margin-bottom: 0.5rem;
    }
    .endgame-screen .crew-row {
        padding-block: 0.4rem;
    }
}
</style>
