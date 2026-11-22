<template>
    <section class="finish-screen" :data-testid="finalResultsReady ? 'match-results' : undefined" aria-label="Completed expedition">
        <header class="finish-topbar">
            <div class="finish-topbar-inner">
                <span class="finish-brand"
                    ><img src="/images/emerald-mark.svg" width="28" height="30" alt="GeoBattles" /><span aria-hidden="true">Geo<b>Battles</b></span></span
                >
                <SocketConnectionStatus v-if="finished" class="finish-connection" />
                <div class="finish-controls">
                    <NuxtLink to="/journal" class="finish-control journal-control" aria-label="Expedition Journal" title="Expedition Journal">
                        <UiIcon name="journal" /><span>Journal</span>
                    </NuxtLink>
                    <button
                        v-if="ui.fullscreenAvailable"
                        class="finish-control"
                        type="button"
                        :aria-label="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                        @click="ui.toggleFullscreen()"
                    >
                        <UiIcon :name="ui.isFullscreen ? 'shrink' : 'fullscreen'" />
                    </button>
                    <button class="finish-control finish-leave" type="button" aria-label="Leave lobby" @click="emit('leaveLobby')"><UiIcon name="leave" /></button>
                </div>
            </div>
        </header>

        <div v-show="champion" class="finish-layout">
            <div class="finish-overview" :class="{ 'finish-overview-podium': landscape && champion && !champion.solo }">
                <header v-if="champion" class="finish-hero">
                    <div class="finish-identity">
                        <h1>Expedition <em>Complete</em></h1>
                        <p class="finish-champion-label">{{ champion.solo ? "Solo expedition" : champion.leaders.length === 1 ? "Champion" : "Shared champions" }}</p>
                        <ul class="finish-champions" :tabindex="champion.leaders.length > 2 ? 0 : undefined" aria-label="Winning players">
                            <li v-for="leader in champion.leaders" :key="leader.id">{{ leader.name }}</li>
                        </ul>
                        <p class="finish-champion-points">
                            <strong>{{ champion.points.toLocaleString() }}</strong> {{ champion.leaders.length > 1 ? "points each" : "points" }}
                        </p>
                    </div>
                    <div class="finish-trophy" aria-hidden="true"><GameplayChampionTrophy /></div>
                    <button
                        v-if="compactJourney"
                        ref="journeyButton"
                        class="finish-control journey-button"
                        type="button"
                        aria-haspopup="dialog"
                        :aria-expanded="journeyOpen"
                        @click="journeyOpen = true"
                    >
                        <UiIcon name="map" />Journey Map
                    </button>
                </header>
                <div v-show="landscape && champion && !champion.solo" ref="podiumHost" class="finish-podium" />
                <GameplayExpeditionJourney :active="finished && !!champion" :compact="compactJourney" :open="journeyOpen" @close="closeJourney" />
            </div>

            <section v-if="champion" class="finish-results" aria-labelledby="standingsId">
                <div class="finish-results-header">
                    <h2 :id="standingsId">Final Standings</h2>
                    <p v-if="ownResult" class="personal-place">
                        <span>{{ champion.solo ? "Your score" : "Your result" }}</span>
                        <strong v-if="!champion.solo"
                            >#{{ ownResult.rank }} <small>of {{ rankings.length }}</small></strong
                        >
                        <strong>{{ ownResult.score.toLocaleString() }} <small>pts</small></strong>
                    </p>
                </div>
                <div ref="standings" class="finish-standings" tabindex="0" role="region" aria-label="Final standings and rematch readiness">
                    <Teleport :to="podiumHost || 'body'" :disabled="!landscape || !podiumHost">
                        <GameplayExpeditionPodium v-if="!champion.solo" :rankings="rankings" :revealed="!ceremony" :compact="landscape" />
                    </Teleport>
                    <GameplayTotalStatistics :ranked="rankings" />
                    <PwaInstallBanner placement="results" :ready="resultsInstallReady" :match-key="finishedMatch" />
                </div>
                <footer v-if="finished" class="finish-rematch">
                    <LobbyStartGame replay>
                        <template #tools>
                            <button
                                v-if="lobby.isPlayerAdmin()"
                                class="finish-control"
                                type="button"
                                aria-label="Rematch settings"
                                title="Rematch settings"
                                :disabled="!socket.isConnected || !socket.isOnline || request.isStartPending"
                                @click="lobby.modifySettingsModal = true"
                            >
                                <UiIcon name="settings" />
                            </button>
                            <LobbyInviteLink class="finish-invite" />
                        </template>
                    </LobbyStartGame>
                </footer>
            </section>
        </div>

        <div v-if="!champion" class="finish-pending" role="status">
            <div class="pending-card">
                <UiIcon name="trophy" />
                <h1>Expedition Complete</h1>
                <p><span class="spinner" aria-hidden="true" />Confirming final standings…</p>
            </div>
        </div>
        <LobbySettingsDialog v-model:open="lobby.modifySettingsModal" />
        <GameplayGameWinner v-if="ceremony" :key="ceremony.key" :leaders="ceremony.leaders" :points="ceremony.points" :solo="ceremony.solo" @dismiss="dismissCeremony" />
    </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{ leaveLobby: [] }>();
const standingsId = useId();
const lobby = useLobbyStore();
const socket = useWebSocketStore();
const ui = useUIManagerStore();
const game = useGameMode();
const request = useRequestState();
const player = usePlayerInfo();
const { lobbySettings, finalResultsReady } = useLobbyState();
const { getPlayerNameFromID } = usePlayerLookup();
const { measurements } = useMobileViewport();
const landscape = computed(() => measurements.value?.orientation === "landscape");
const standings = useTemplateRef("standings");
const podiumHost = useTemplateRef("podiumHost");
const journeyButton = useTemplateRef("journeyButton");
const journeyOpen = ref(false);
const compactJourney = ref(false);
const finishedVisit = ref(0);
const finished = computed(() => game.modeLogic.currentState === "FINISHED" && lobbySettings.value?.phase === "FINISHED");
const { ceremony, champion, rankings, dismiss } = useWinnerCeremony(
    () => lobbySettings.value,
    () => game.modeLogic.currentState,
    () => finalResultsReady.value,
    getPlayerNameFromID
);
const ownResult = computed(() => rankings.value.find(({ id }) => id === player.value.ID));
const finishedMatch = computed(() => {
    const snapshot = lobbySettings.value;
    return snapshot ? JSON.stringify([snapshot.ID, snapshot.gameId ?? finishedVisit.value]) : "";
});
const resultsInstallReady = computed(
    () =>
        finished.value &&
        finalResultsReady.value &&
        !!ownResult.value &&
        !ceremony.value &&
        !journeyOpen.value &&
        !lobby.modifySettingsModal &&
        !lobby.isPlayerReady &&
        !request.isReadyPending &&
        !request.isStartPending &&
        socket.isOnline &&
        socket.isConnected
);
const dismissCeremony = async () => {
    dismiss();
    await nextTick();
    const focused = document.activeElement;
    if (finished.value && standings.value?.getClientRects().length && (!focused || focused === document.body || !focused.getClientRects().length)) {
        standings.value.focus({ preventScroll: true });
    }
};
const closeJourney = async () => {
    journeyOpen.value = false;
    await nextTick();
    if (finished.value) journeyButton.value?.focus({ preventScroll: true });
};
watch(finished, (active) => {
    if (active) finishedVisit.value++;
    else journeyOpen.value = false;
});

let viewport: MediaQueryList | undefined;
const syncViewport = () => (compactJourney.value = viewport?.matches ?? false);
onMounted(() => {
    viewport = window.matchMedia("(orientation: portrait), (max-width: 850px), (max-height: 540px)");
    syncViewport();
    viewport.addEventListener("change", syncViewport);
});
onBeforeUnmount(() => viewport?.removeEventListener("change", syncViewport));
</script>

<style scoped>
.finish-screen {
    --finish-gold: #ffe4a0;
    --finish-line: #a3ddb263;
    --finish-space: clamp(0.4rem, 2vw, 1.9rem);
    --finish-card: linear-gradient(160deg, #113f32f7, #061f1de8 72%, #13392af5);
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100dvh;
    overflow: clip;
    background:
        linear-gradient(180deg, #05251fdc, #04211a65 50%, #061f19ef),
        url("/images/emerald-horizon.webp") 57% 55% / cover no-repeat;
    color: #f5faf3;
}
.finish-topbar {
    border-bottom: 1px solid #c5edab4d;
    padding-top: env(safe-area-inset-top);
    background:
        url("/images/atlas-relief.svg") 58% 47% / 38rem auto no-repeat,
        linear-gradient(105deg, #0b3429, #031e1c 80%);
}
.finish-topbar-inner,
.finish-layout {
    width: 100%;
    max-width: 110rem;
    margin-inline: auto;
    padding-inline: max(var(--finish-space), env(safe-area-inset-left)) max(var(--finish-space), env(safe-area-inset-right));
}
.finish-topbar-inner {
    display: flex;
    align-items: center;
    gap: clamp(0.32rem, 1.4vw, 0.8rem);
    min-height: 3.4rem;
}
.finish-brand {
    display: inline-flex;
    align-items: center;
    flex: none;
    gap: 0.42rem;
    font: italic 900 clamp(0.98rem, 2.1vw, 1.47rem) / 1 var(--gb-font-display);
    letter-spacing: -0.05em;
}
.finish-brand img {
    width: clamp(1.18rem, 2.8vw, 1.65rem);
    height: auto;
}
.finish-brand b {
    color: #dcf7aa;
}
.finish-connection {
    margin-inline-start: auto;
    white-space: nowrap;
}
.finish-controls {
    display: flex;
    justify-content: end;
    gap: 0.25rem;
    margin-inline-start: auto;
}
.finish-connection + .finish-controls {
    margin-inline-start: 0;
}
.finish-control,
.finish-invite :deep(.btn) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-width: 44px;
    min-height: 44px;
    padding: 0.24rem 0.57rem;
    border: 1px solid #96d6af55;
    border-radius: 0.68rem;
    background: #133e31b3;
    color: #edf9e9;
    font-size: 0.8rem;
    font-weight: 730;
    line-height: 1.15;
}
.finish-control:hover,
.finish-invite :deep(.btn:hover) {
    border-color: #d0f6a2;
}
.finish-control:disabled {
    opacity: 0.55;
}
.finish-leave {
    color: #ffd0ad;
}
.finish-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
    gap: clamp(0.4rem, 1.4vw, 1.3rem);
    min-height: 0;
    padding-block: var(--finish-space) max(var(--finish-space), env(safe-area-inset-bottom));
}
.finish-overview {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: clamp(0.45rem, 1.5dvh, 0.95rem);
    min-width: 0;
    min-height: 0;
}
.finish-overview-podium {
    grid-template-rows: auto auto minmax(0, 1fr);
}
.finish-overview-podium:has(.journey-button) {
    grid-template-rows: minmax(0, 1fr) auto;
}
.finish-hero {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(4.8rem, 0.41fr);
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
    min-height: 0;
    padding: clamp(0.6rem, 2vw, 1.55rem);
    overflow: hidden;
    border: 1px solid #d9ca897b;
    border-radius: 1.1rem;
    background:
        radial-gradient(ellipse at 82% 43%, #f1cb6747, transparent 60%),
        linear-gradient(95deg, #072a22f5 25%, #082821ab 66%, #0c3a2d63),
        url("/images/emerald-horizon.webp") 66% 45% / cover no-repeat;
    box-shadow:
        inset 0 1px #fff3ae24,
        0 0.3rem 1.2rem #04181178;
}
.finish-hero:has(.journey-button) {
    grid-template-rows: minmax(0, 1fr) auto;
}
.finish-identity {
    min-width: 0;
    text-shadow: 0 1px 12px #031912;
}
.finish-identity h1,
.finish-pending h1 {
    font: italic 850 clamp(1.3rem, 3.4vw, 3.3rem) / 1.045 var(--gb-font-display);
    letter-spacing: -0.043em;
    text-wrap: balance;
}
.finish-identity h1 em {
    color: #dcf7aa;
}
.finish-champion-label {
    margin-top: clamp(0.45rem, 2dvh, 1.05rem);
    color: var(--finish-gold);
    font: 750 clamp(0.59rem, 1.3vw, 0.85rem) / 1.2 var(--gb-font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.finish-champions {
    max-height: clamp(2rem, 8.65dvh, 7rem);
    margin: 0.1rem 0 0;
    padding: 0 0.13em 0.06em;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    font: italic 900 clamp(1.19rem, 3.35vw, 3.25rem) / 1.04 var(--gb-font-display);
    letter-spacing: -0.035em;
    overflow-wrap: anywhere;
    list-style: none;
}
.finish-champions:has(li:nth-child(2)) {
    font-size: clamp(1.04rem, 2.85vw, 2.15rem);
}
.finish-champion-points {
    margin-top: 0.42rem;
    color: var(--finish-gold);
    font-size: clamp(0.77rem, 1.7vw, 1.04rem);
    font-variant-numeric: tabular-nums;
}
.finish-champion-points strong {
    font-size: 1.16em;
}
.finish-trophy {
    display: grid;
    place-items: center;
    width: min(100%, 15rem);
    aspect-ratio: 1;
    justify-self: end;
    background: radial-gradient(circle, #ffdb775c 7%, #fec85222 54%, transparent 71%);
}
.finish-trophy svg {
    width: 94%;
    filter: drop-shadow(0 0.3rem 0.5rem #2319448c);
}
.journey-button {
    grid-column: 1 / -1;
    justify-self: start;
    padding-inline: 0.82rem;
    background: #092d24c9;
}
.finish-results {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--finish-line);
    border-radius: 1.1rem;
    background: var(--finish-card);
    box-shadow:
        inset 0 1px #e1f7cf2d,
        0 0.4rem 1.45rem #04181173;
}
.finish-results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    gap: 0.28rem;
    padding: clamp(0.48rem, 1.4vw, 0.95rem);
    border-bottom: 1px solid #acd8a643;
    background: url("/images/atlas-relief.svg") 112% 46% / 28rem auto no-repeat;
}
.finish-results-header h2 {
    font: italic 850 clamp(1.02rem, 2.27vw, 1.7rem) / 1.1 var(--gb-font-display);
}
.personal-place {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    align-items: baseline;
    gap: 0.25rem 0.43rem;
    color: #c9e8d0;
    font-size: clamp(0.62rem, 1.48vw, 0.79rem);
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
}
.personal-place strong {
    color: #e8ffc3;
    white-space: nowrap;
}
.personal-place small {
    font-weight: 630;
}
.finish-standings {
    min-height: 0;
    padding: clamp(0.35rem, 1.2vw, 0.93rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
}
.finish-standings :deep(.expedition-podium) {
    margin-bottom: 0.42rem;
}
.finish-standings:focus-visible {
    outline-color: #dcf7aa9e;
    outline-offset: -2px;
}
.finish-rematch {
    padding: clamp(0.36rem, 1.1vw, 0.75rem);
    border-top: 1px solid #95ce9a5e;
    background: radial-gradient(ellipse at 76% 110%, #72b65b25, transparent 65%), linear-gradient(128deg, #123a2d, #082a22);
}
.finish-pending {
    display: grid;
    place-items: center;
    padding: max(0.8rem, env(safe-area-inset-top)) var(--finish-space) max(0.8rem, env(safe-area-inset-bottom));
}
.pending-card {
    display: grid;
    justify-items: center;
    gap: 0.6rem;
    padding: clamp(0.95rem, 5.2vw, 3.25rem);
    border: 1px solid var(--finish-line);
    border-radius: 1.15rem;
    background: #062a23d9;
    text-align: center;
}
.pending-card .ui-icon {
    color: var(--finish-gold);
    font-size: 2.45rem;
}
.pending-card p {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #cfe7d4;
    font-size: 0.84rem;
}
@media (orientation: portrait) {
    .finish-screen {
        background-image: linear-gradient(180deg, #05251fdc, #04211a65 50%, #061f19ef), url("/images/emerald-horizon-portrait.webp");
    }
    .finish-layout {
        grid-template-rows: auto minmax(0, 1fr);
        grid-template-columns: minmax(0, 1fr);
    }
    .finish-overview {
        grid-template-rows: auto;
    }
    .finish-hero {
        grid-template-columns: minmax(0, 1fr) minmax(4.2rem, 0.34fr);
        gap: 0.28rem 0.55rem;
    }
    .finish-champion-label {
        margin-top: 0.46rem;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .finish-screen {
        --finish-space: 0.4rem;
    }
    .finish-topbar-inner {
        min-height: 3rem;
    }
    .finish-overview {
        grid-template-rows: minmax(0, 1fr);
    }
    .finish-hero {
        grid-template-columns: minmax(0, 1fr) minmax(3.45rem, 0.66fr);
        padding: 0.55rem;
    }
    .finish-identity h1 {
        font-size: clamp(1.16rem, 3.24vw, 2rem);
    }
    .finish-results-header {
        padding: 0.37rem 0.5rem;
    }
    .finish-rematch {
        padding: 0.34rem;
    }
}
@media (max-width: 475px) {
    .finish-topbar-inner {
        min-height: 3rem;
    }
    .finish-connection {
        font-size: 0.63rem;
    }
    .journal-control span {
        display: none;
    }
    .finish-invite :deep(.invite-label) {
        display: none;
    }
    .finish-invite :deep(.invite-compact-label) {
        display: inline;
    }
}
@media (max-width: 365px) {
    .finish-brand > span {
        display: none;
    }
    .personal-place > span {
        @apply sr-only;
    }
}
@media (orientation: landscape) and (max-height: 420px) {
    .finish-results-header {
        padding-inline: 0.38rem;
    }
    .finish-results-header h2 {
        font-size: clamp(0.88rem, 2vw, 1.08rem);
    }
    .personal-place {
        flex-wrap: nowrap;
        font-size: 0.64rem;
    }
    .finish-invite :deep(.invite-label),
    .finish-invite :deep(.invite-compact-label) {
        display: none;
    }
}
@media (orientation: landscape) and (max-height: 340px) {
    .finish-hero .finish-identity {
        grid-area: 1 / 1 / 3;
        max-height: 100%;
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .finish-identity h1 {
        font-size: clamp(0.97rem, 3vw, 1.2rem);
    }
    .finish-champion-label {
        margin-top: 0.22rem;
    }
    .finish-champions {
        font-size: clamp(1rem, 3vw, 1.26rem);
    }
    .finish-champion-points {
        margin-top: 0.26rem;
    }
    .finish-trophy {
        grid-area: 1 / 2;
        width: auto;
        height: 100%;
        max-width: 100%;
        justify-self: center;
    }
    .journey-button {
        grid-area: 2 / 2;
        justify-self: stretch;
        padding-inline: 0.3rem;
        font-size: 0.68rem;
    }
}
@media (orientation: landscape) and (max-width: 635px) {
    .personal-place > span {
        @apply sr-only;
    }
}
</style>
