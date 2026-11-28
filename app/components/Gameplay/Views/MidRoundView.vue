<template>
    <section class="round-recap" :class="{ 'compact-recap': compact, 'landscape-recap': compactLandscape }" :aria-labelledby="titleId">
        <header class="recap-header">
            <div class="recap-header-inner">
                <span class="recap-brand"
                    ><img src="/images/emerald-mark.svg" width="28" height="30" alt="GeoBattles" /><span aria-hidden="true">Geo<b>Battles</b></span></span
                >
                <div class="round-progress">
                    <span :aria-label="'Round ' + round + ' of ' + roundCount"
                        >Round <b>{{ round }}</b> <span>/ {{ roundCount }}</span></span
                    >
                    <progress v-if="roundCount" :value="round" :max="roundCount" aria-label="Match progress" />
                </div>
                <div class="recap-controls" aria-label="Game controls">
                    <SocketConnectionStatus v-if="active && !online" />
                    <button
                        v-if="ui.fullscreenAvailable"
                        class="recap-control"
                        type="button"
                        :aria-label="ui.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                        @click="ui.toggleFullscreen()"
                    >
                        <UiIcon :name="ui.isFullscreen ? 'shrink' : 'fullscreen'" />
                    </button>
                    <GameplayEndMatchControl phase="MID-ROUND" />
                    <button class="recap-control recap-leave" type="button" aria-label="Leave lobby" @click="emit('leaveLobby')"><UiIcon name="leave" /></button>
                </div>
            </div>
        </header>

        <div id="midround-map-and-results" class="recap-layout">
            <GameplayRoundResultMap
                class="recap-map"
                :active="active"
                :answer="answer"
                :distance="distance"
                :compact="compact"
                @connection-target="emit('connectionTarget', $event)"
            />
            <div id="midround-results-container" class="recap-inspector">
                <div class="recap-overview">
                    <h1 :id="titleId">Round {{ round }} <em>Results</em></h1>
                    <dl class="round-metrics" aria-label="Your round results">
                        <div class="earned-points">
                            <dt><UiIcon name="star" />{{ standingsView === "overall" ? "Total points" : "Round points" }}</dt>
                            <dd>{{ points }}</dd>
                        </div>
                        <div>
                            <dt><UiIcon name="pin" />Best distance</dt>
                            <dd>{{ distance || (ownResult ? "No guess" : "Missed round") }}</dd>
                        </div>
                        <div>
                            <dt><UiIcon name="trophy" />{{ compactLandscape ? "Rank" : "Overall rank" }}</dt>
                            <dd>{{ ownStanding?.rank ?? "—" }}</dd>
                        </div>
                    </dl>
                </div>
                <GameplayRoundStandings
                    :key="'standings-' + roundKey"
                    v-model:view="standingsView"
                    class="recap-standings"
                    :overall="overall"
                    :round="scoredRound"
                    :guesses="results.bestResults"
                    :compact="compact"
                />
                <GameplayPowerupChoices
                    v-if="active && snapshot && player.ID && round < roundCount"
                    :key="'powerups-' + roundKey"
                    class="recap-powerups"
                    :compact="compact"
                    :snapshot="snapshot"
                    :player-id="player.ID"
                    :standings="overall"
                    :remaining-ms="powerups.view.remainingMs"
                    :pending="powerups.view.pending"
                    :feedback="powerups.view.feedback"
                    :online="online"
                    :start-pending="request.isStartPending"
                    @use="powerups.use"
                    @retry="powerups.retry"
                />

                <footer class="recap-footer">
                    <div class="recap-advance">
                        <button v-if="host && round < roundCount" class="next-round" type="button" :disabled="!canAdvance" :aria-busy="advancing" @click="start">
                            <span v-if="advancing" class="spinner" aria-hidden="true" />
                            {{ compact && startNote && !queued && !advancing ? "Next round unavailable" : advanceLabel }}
                            <UiIcon v-if="!advancing && !queued && canAdvance" name="arrow" />
                        </button>
                        <p v-else class="round-wait" role="status">
                            <UiIcon :name="round >= roundCount ? 'trophy' : 'clock'" />
                            {{
                                round >= roundCount
                                    ? "Waiting for final standings"
                                    : online
                                      ? queued || advancing
                                          ? advanceLabel
                                          : "Waiting for the host"
                                      : "Waiting for connection"
                            }}
                        </p>
                    </div>
                    <p v-if="host && startNote" class="advance-note" role="status">{{ startNote }}</p>
                </footer>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { Results } from "~/types/appTypes";
import { formatGuessDistance, hasGuess, rankTotalResults, roundResultPoints, type StandingsView } from "~/utils/resultUtils";

const emit = defineEmits<{ leaveLobby: []; connectionTarget: [element: HTMLElement | null] }>();
const titleId = useId();
const game = useGameMode();
const socket = useWebSocketStore();
const actions = useLobbySocketActions();
const powerups = actions.powerups;
const player = usePlayerInfo();
const request = useRequestState();
const ui = useUIManagerStore();
const { measurements } = useMobileViewport();
const { lobbySettings, revealedAnswers } = useLobbyState();
const totals = useTotalResults();
const results = useResultsStore();
const emptyResults: Results = {};
const compact = computed(() => {
    const viewport = measurements.value;
    return !!viewport && (viewport.orientation === "portrait" || viewport.layoutWidth <= 1100 || viewport.layoutHeight <= 540);
});
const compactLandscape = computed(() => compact.value && measurements.value?.orientation === "landscape");

const snapshot = computed(() => lobbySettings.value);
const active = computed(() => game.modeLogic.currentState === "MID-ROUND" && snapshot.value?.phase === "MID-ROUND");
const round = computed(() => snapshot.value?.currentRound ?? 0);
const roundCount = computed(() => snapshot.value?.conf.numRounds ?? 0);
const roundKey = computed(() => JSON.stringify([snapshot.value?.ID, snapshot.value?.gameId, round.value]));
const standingsView = ref<StandingsView>("overall");
watch(roundKey, () => (standingsView.value = "overall"));
const answer = computed(() => (active.value ? revealedAnswers.value[round.value] : undefined));
const scoredRound = computed(() => snapshot.value?.endResults[round.value] ?? emptyResults);
const overall = computed(() => rankTotalResults(totals.value));
const ownResult = computed(() => scoredRound.value[player.value.ID ?? ""]);
const ownStanding = computed(() => overall.value.find((row) => row.id === player.value.ID));
const points = computed(() => {
    if (standingsView.value === "overall") return ownStanding.value?.score ?? "—";
    return ownResult.value ? roundResultPoints(ownResult.value) : "—";
});
const distance = computed(() => {
    const best = results.bestResults[player.value.ID ?? ""];
    return best && hasGuess(best) ? formatGuessDistance(best) : "";
});

const online = computed(() => socket.isConnected && socket.isOnline);
const host = computed(() => !!player.value.ID && snapshot.value?.admin === player.value.ID);
const state = computed(() => snapshot.value?.powerupState);
const queued = computed(() => !!state.value?.startRequested);
const advancing = computed(() => request.isStartPending || !!state.value?.starting);
const advanceLabel = computed(() => (advancing.value ? "Preparing next round…" : queued.value ? "Next round queued" : "Next Round"));
const startNote = computed(() => {
    if (round.value >= roundCount.value) return "";
    if (actions.startUnavailableReason) return actions.startUnavailableReason;
    if (!online.value) return "Reconnect to start the next round.";
    if (powerups.view.pending?.uncertain) return "Resolve the pending choice in Powerups to continue.";
    if (powerups.view.pending) return "Waiting for powerup confirmation.";
    return !state.value || !snapshot.value?.gameId ? "Waiting for round state…" : "";
});
const canAdvance = computed(() => active.value && host.value && round.value < roundCount.value && !startNote.value && !queued.value && !advancing.value);
const start = () => {
    if (canAdvance.value) actions.start();
};
</script>

<style scoped>
.round-recap {
    --recap-accent: #d6fb9f;
    --recap-muted: #b5cfc1;
    --recap-border: #9ddba85c;
    --recap-action-fill: linear-gradient(172deg, #edffc3, #a5eb64 76%, #86d44b);
    --recap-gutter: clamp(0.55rem, 2.35vw, 2.55rem);
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: var(--gb-viewport-height);
    overflow: clip;
    background: #052e24;
    color: #f8fafc;
}
.recap-header {
    background:
        url("/images/atlas-relief.svg") 50% 50% / 40rem auto no-repeat,
        linear-gradient(95deg, #0a3228, #041e1c 80%);
    border-block-end: 1px solid #bfed8c55;
    padding-block-start: var(--gb-safe-top);
}
.recap-header-inner,
.recap-layout {
    width: 100%;
    max-width: 112rem;
    margin-inline: auto;
    padding-inline: max(var(--recap-gutter), var(--gb-safe-left)) max(var(--recap-gutter), var(--gb-safe-right));
}
.recap-header-inner {
    display: flex;
    align-items: center;
    gap: clamp(0.45rem, 2vw, 1.65rem);
    min-height: 3.65rem;
}
.recap-brand {
    display: inline-flex;
    align-items: center;
    flex: none;
    gap: 0.43rem;
    font: italic 900 clamp(1rem, 2.45vw, 1.45rem) / 1 var(--gb-font-display);
    letter-spacing: -0.045em;
}
.recap-brand img {
    width: clamp(1.2rem, 2.9vw, 1.65rem);
    height: auto;
}
.recap-brand b,
.round-progress b,
.recap-overview h1 em {
    color: var(--recap-accent);
}
.round-progress {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 2vw, 1.25rem);
    padding-inline-start: clamp(0.45rem, 2vw, 1.65rem);
    border-inline-start: 1px solid #c4e7b363;
    font: italic 750 clamp(0.72rem, 1.52vw, 1rem) / 1 var(--gb-font-display);
    text-transform: uppercase;
    white-space: nowrap;
}
.round-progress b {
    font-size: 1.28em;
    font-variant-numeric: tabular-nums;
}
.round-progress progress {
    appearance: none;
    inline-size: clamp(3rem, 9vw, 7rem);
    block-size: 0.32rem;
    overflow: hidden;
    border: 0;
    border-radius: 1rem;
    background: #7bc6ae45;
    accent-color: var(--recap-accent);
}
.round-progress progress::-webkit-progress-bar {
    background: #143e35;
}
.round-progress progress::-webkit-progress-value {
    background: var(--recap-accent);
    border-radius: 1rem;
}
.round-progress progress::-moz-progress-bar {
    background: var(--recap-accent);
    border-radius: 1rem;
}
.recap-controls {
    display: flex;
    align-items: center;
    justify-content: end;
    min-width: 0;
    margin-inline-start: auto;
    gap: clamp(0.28rem, 1vw, 0.65rem);
}
.recap-controls :deep(.badge) {
    white-space: nowrap;
}
.recap-control {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1px solid #afdf9c48;
    border-radius: 0.65rem;
    background: #113e35ac;
}
.recap-control:hover {
    border-color: var(--recap-accent);
}
.recap-leave {
    color: #ffcead;
}
.recap-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.24fr) minmax(0, 1fr);
    gap: clamp(0.38rem, 1.4vw, 1.2rem);
    min-height: 0;
    padding-block: var(--recap-gutter) max(var(--recap-gutter), var(--gb-safe-bottom));
    background:
        linear-gradient(180deg, #072921f2, #05251b75),
        url("/images/emerald-horizon.webp") center bottom / cover no-repeat;
}
.recap-inspector {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    gap: clamp(0.38rem, 1.3dvh, 0.9rem);
    min-width: 0;
    min-height: 0;
    padding: clamp(0.5rem, 1.6vw, 1.4rem);
    border: 1px solid var(--recap-border);
    border-radius: clamp(0.85rem, 2vw, 1.5rem);
    background:
        url("/images/atlas-relief.svg") right 120% / 34rem auto no-repeat,
        linear-gradient(160deg, #0d372ef8, #041f1dfd 62%, #093329f2);
    box-shadow:
        inset 0 1px #def5c820,
        0 0.3rem 1.5rem #001c1466;
}
.recap-overview {
    display: grid;
    min-width: 0;
    gap: clamp(0.33rem, 1.1dvh, 0.78rem);
}
.recap-powerups {
    grid-row: 2;
}
.recap-standings {
    grid-row: 3;
}
.recap-overview h1 {
    display: flex;
    align-items: center;
    gap: 0.28em;
    min-height: clamp(2rem, 5.6dvh, 4rem);
    padding-inline: 0.55rem;
    border-radius: 0.76rem;
    background:
        linear-gradient(90deg, #082e26 25%, #0d372e92 80%, #0d372e25),
        url("/images/emerald-horizon.webp") 75% 27% / cover no-repeat;
    font: italic 850 clamp(1.16rem, 2.8vw, 2.6rem) / 1.1 var(--gb-font-display);
    letter-spacing: -0.035em;
}
.round-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
    padding: clamp(0.36rem, 1.1dvh, 0.8rem) 0.18rem;
    border: 1px solid #93d8aa3b;
    border-radius: 0.78rem;
    background: linear-gradient(115deg, #153c2c, #062621);
}
.round-metrics div {
    min-width: 0;
    padding-inline: clamp(0.32rem, 1.4vw, 0.9rem);
}
.round-metrics div + div {
    border-inline-start: 1px solid #99cda03d;
}
.round-metrics dt {
    display: flex;
    align-items: center;
    gap: 0.35em;
    color: var(--recap-muted);
    font-size: clamp(0.61rem, 1.75vw, 0.78rem);
    font-weight: 650;
    line-height: 1.25;
}
.round-metrics dt .ui-icon {
    flex: none;
    color: var(--recap-accent);
}
.round-metrics dd {
    margin-block-start: 0.12em;
    font: italic 850 clamp(0.87rem, 2.4vw, 1.48rem) / 1.22 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}
.earned-points dd {
    color: var(--recap-accent);
}
.recap-footer {
    display: grid;
    gap: 0.28rem;
    min-width: 0;
    text-align: center;
    grid-row: 4;
}
.recap-advance {
    display: flex;
    align-items: stretch;
    gap: 0.35rem;
    min-width: 0;
}
.next-round,
.round-wait {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.58em;
    flex: 1;
    min-width: 0;
    min-height: 52px;
    padding: 0.35rem 0.7rem;
    border: 1px solid #caff9c;
    border-radius: 999px;
    background: var(--recap-action-fill);
    box-shadow:
        inset 0 1px #fbffeeb7,
        0 3px 16px #a8eb6652;
    color: var(--gb-scenic-action-ink);
    font: italic 840 clamp(0.97rem, 2.55vw, 1.3rem) / 1.15 var(--gb-font-display);
}
.next-round:enabled:hover {
    filter: brightness(1.07);
}
.next-round:disabled,
.round-wait {
    border-color: #a0cba95e;
    background: #153b2f;
    box-shadow: none;
    color: #dbefda;
    font-size: 0.89rem;
}
.advance-note {
    font-size: 0.7rem;
    line-height: 1.25;
    color: var(--recap-muted);
}
.compact-recap {
    --recap-gutter: clamp(0.32rem, 1.15vw, 0.65rem);
}
.compact-recap .recap-header-inner {
    min-height: 2.75rem;
    gap: clamp(0.32rem, 1.3vw, 0.72rem);
}
.compact-recap .recap-brand {
    font-size: clamp(0.9rem, 2.7vw, 1.16rem);
}
.compact-recap .recap-control {
    width: 38px;
    height: 38px;
    border-radius: 999px;
}
.compact-recap .recap-controls :deep(.end-match-control) {
    inline-size: 38px;
    block-size: 38px;
    border-radius: 999px;
}
.compact-recap .recap-layout {
    grid-template-columns: minmax(0, 0.46fr) minmax(0, 0.54fr);
    grid-template-rows: clamp(7rem, 29dvh, 16rem) auto minmax(0, 1fr) auto;
    grid-template-areas:
        "map map"
        "metrics metrics"
        "standings standings"
        "powerups advance";
    gap: clamp(0.28rem, 0.8dvh, 0.48rem);
    background:
        linear-gradient(178deg, #052a22eb, #061e19fa),
        url("/images/atlas-relief.svg") center bottom / 42rem auto no-repeat;
}
.compact-recap .recap-inspector,
.compact-recap .recap-overview {
    display: contents;
}
.compact-recap .recap-map {
    grid-area: map;
}
.compact-recap .recap-overview h1 {
    @apply sr-only;
}
.compact-recap .round-metrics {
    grid-area: metrics;
    padding: 0.24rem 0.1rem;
    border-radius: 0.72rem;
    background: linear-gradient(112deg, #164637, #082923 85%);
}
.compact-recap .round-metrics > div {
    padding-inline: clamp(0.3rem, 1.25vw, 0.68rem);
}
.compact-recap .round-metrics dt {
    font-size: clamp(0.56rem, 1.65vw, 0.7rem);
    white-space: nowrap;
}
.compact-recap .round-metrics dd {
    font-size: clamp(0.84rem, 2.8vw, 1.15rem);
    line-height: 1.15;
}
.compact-recap .recap-standings {
    grid-area: standings;
}
.compact-recap .recap-powerups {
    grid-area: powerups;
    align-self: stretch;
}
.compact-recap .recap-footer {
    grid-area: advance;
    grid-template-rows: minmax(44px, auto);
    align-self: stretch;
}
.compact-recap .recap-layout:not(:has(.recap-powerups)) .recap-footer {
    grid-column: 1 / -1;
}
.compact-recap .next-round,
.compact-recap .round-wait {
    min-height: 44px;
    padding: 0.25rem 0.55rem;
    font-size: clamp(0.82rem, 2.6vw, 1.04rem);
}
.compact-recap .next-round:disabled,
.compact-recap .round-wait {
    font-size: clamp(0.7rem, 2vw, 0.88rem);
}
.landscape-recap .recap-layout {
    grid-template-columns: minmax(0, 0.44fr) minmax(0, 0.56fr);
    grid-template-rows: minmax(0, 1fr) auto auto;
    grid-template-areas:
        "map standings"
        "metrics standings"
        "powerups advance";
    gap: 0.32rem;
}
.landscape-recap .recap-header-inner {
    min-height: 2.6rem;
}
.landscape-recap .recap-brand > span {
    @apply sr-only;
}
.landscape-recap .round-metrics {
    grid-template-columns: minmax(0, 0.34fr) minmax(0, 0.44fr) minmax(0, 0.22fr);
    padding-block: 0.2rem;
}
.landscape-recap .round-metrics > div {
    padding-inline: clamp(0.28rem, 0.75vw, 0.55rem);
}
.landscape-recap .round-metrics dt {
    font-size: clamp(0.55rem, 1.3vw, 0.66rem);
    white-space: nowrap;
}
.landscape-recap .round-metrics dd {
    font-size: clamp(0.76rem, 1.8vw, 1rem);
    overflow-wrap: normal;
}
@media (max-width: 480px) {
    .compact-recap .round-progress {
        gap: 0.38rem;
        padding-inline-start: 0.4rem;
    }
    .compact-recap .round-progress progress {
        inline-size: clamp(1.5rem, 8vw, 2.8rem);
    }
    .recap-controls :deep(.badge) {
        padding-inline: 0.3rem;
        font-size: 0.65rem;
    }
    .recap-header-inner:has(.badge) .recap-brand > span {
        display: none;
    }
}
@media (max-width: 345px) {
    .recap-brand > span {
        @apply sr-only;
    }
}
@media (max-height: 340px) {
    .landscape-recap {
        --recap-gutter: 0.3rem;
    }
    .landscape-recap .recap-header-inner {
        min-height: 2.8rem;
    }
    .landscape-recap .round-metrics {
        padding-block: 0.19rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .recap-inspector,
    .recap-map,
    .compact-recap :is(.recap-standings, .recap-footer) {
        animation: recap-in 200ms ease-out;
    }
    @keyframes recap-in {
        from {
            opacity: 0.6;
            translate: 0 0.25rem;
        }
    }
}
</style>
