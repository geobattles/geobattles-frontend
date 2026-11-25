<template>
    <div
        id="gameplay_container"
        ref="gameplayRoot"
        class="gameplay-container"
        :class="{ 'is-compact-game': compactViewport, 'is-landscape-game': landscapeLayout, 'has-full-map': mapModal }"
        :style="viewportStyle"
    >
        <GameplayGooglePanorama class="google-panorama" :inert="mapModal" />
        <div class="gameplay-chrome" :inert="mapModal">
            <GameplayMenu
                ref="menu"
                :players="playerCount"
                :compact="compactViewport"
                :scores-open="scoreboardVisible"
                :scoreboard-id="scoreboardId"
                @toggle-scores="toggleScores()"
                @leave-lobby-clicked="emit('leaveLobby')"
            >
                <section class="round-hud" aria-label="Round status">
                    <div class="round-hud-content">
                        <p class="round-label">
                            <span>Round</span> <strong>{{ round }}</strong
                            ><span class="round-total"> / {{ roundCount }}</span>
                        </p>
                        <SocketConnectionStatus v-if="!compactViewport" class="round-connection" />
                    </div>
                    <progress class="match-progress" :value="round" :max="Math.max(1, roundCount)" aria-label="Match progress" />
                </section>
                <div v-show="landscapeLayout" ref="headerScoresHost" class="header-scores-host" />
            </GameplayMenu>
            <Teleport :to="scoresHost || 'body'" :disabled="!scoresHost">
                <div class="gameplay-scores">
                    <div v-if="compactViewport" class="round-score-strip">
                        <dl class="round-score-readings" aria-label="Your round scores" aria-live="polite" aria-atomic="true">
                            <div>
                                <dt>Last <span :class="{ 'sr-only': landscapeLayout }">guess</span><span class="sr-only"> distance</span></dt>
                                <dd>{{ lastGuess ? formatGuessDistance(lastGuess) : "—" }}</dd>
                            </div>
                            <div class="round-best-distance">
                                <dt>Best<span class="sr-only"> distance</span></dt>
                                <dd>{{ bestGuess ? formatGuessDistance(bestGuess) : "—" }}</dd>
                            </div>
                            <div>
                                <dt><span class="sr-only">Round </span>Place</dt>
                                <dd>
                                    <strong>{{ liveRank ? `#${liveRank}` : "—" }}</strong> <span v-if="playerCount" class="place-total">/ {{ playerCount }}</span>
                                </dd>
                            </div>
                        </dl>
                        <button
                            ref="scoresToggle"
                            class="round-score-toggle"
                            type="button"
                            aria-label="Round scores"
                            title="Round scores"
                            :aria-controls="scoreboardId"
                            :aria-expanded="scoreboardVisible"
                            @click="toggleScores"
                        >
                            <UiIcon name="trophy" /><span>Scores</span><UiIcon name="chevron-up" class="scores-chevron" />
                        </button>
                    </div>
                    <aside v-show="scoreboardVisible" :id="scoreboardId" class="gameplay-scoreboard" :class="{ 'scores-expanded': scoresExpanded }" :aria-labelledby="scoreTitleId">
                        <header :class="compactViewport ? 'sr-only' : 'scoreboard-header'">
                            <h2 :id="scoreTitleId">Round scores</h2>
                            <div v-if="!compactViewport" class="scoreboard-tools">
                                <button
                                    class="hud-button"
                                    type="button"
                                    :title="scoresExpanded ? 'Compact scores' : 'Expand scores'"
                                    :aria-label="scoresExpanded ? 'Compact scores' : 'Expand scores'"
                                    :aria-expanded="scoresExpanded"
                                    @click="scoresExpanded = !scoresExpanded"
                                >
                                    <UiIcon :name="scoresExpanded ? 'shrink' : 'fullscreen'" />
                                </button>
                                <button class="hud-button" type="button" aria-label="Hide round scores" title="Hide round scores" @click="closeScores">
                                    <UiIcon name="close" />
                                </button>
                            </div>
                        </header>
                        <div ref="scoreboardBody" class="scoreboard-body" tabindex="0" role="region" aria-label="Player scores, scroll for more players">
                            <GameplayBattleRoyaleLiveStatistics v-if="game.currentMode === 'BattleRoyale'" :compact="compactViewport" player-hooks />
                            <GameplayCountryBattleLiveStatistics v-else />
                        </div>
                    </aside>
                </div>
            </Teleport>
        </div>
        <div v-show="playing" class="street-timer-slot" :class="{ 'clear-of-scores': scoreboardVisible }">
            <Teleport :to="timerHost || 'body'" :disabled="!timerHost">
                <GameplayRoundTimer v-show="playing" ref="roundTimer" :seconds="roundDeadline === null ? null : countdown" :duration="fullRoundTime" />
            </Teleport>
        </div>
        <GameplayGuessMapPanel
            ref="guessMap"
            :class="{ 'map-scores-open': mapModal && scoreboardVisible }"
            :mode="mapMode"
            :fullscreen="mapModal"
            :compact="compactViewport"
            :landscape="landscapeLayout"
            :playing="playing"
            :seconds="countdown"
            :lives="lives"
            :confirmed="confirmed"
            @open="openMap"
            @close="closeMap"
            @expand="toggleMapSize"
        />
        <p v-if="google.mapStatus === 'ready' && google.panoramaStatus === 'ready'" data-testid="maps-ready" class="sr-only">Map initialized and landscape available</p>
        <Teleport :to="connectionTarget || 'body'" :disabled="!mapModal || !connectionTarget">
            <GameplayDuelNotice class="live-duel-notice" :challengers="challengers" :round="round" />
            <GameplayMapRecovery class="gameplay-map-recovery" panorama :active="playing" />
        </Teleport>
    </div>
</template>
<script setup lang="ts">
import { formatGuessDistance, guessDistance, hasGuess, type LiveGuessFeedback } from "~/utils/resultUtils";

const emit = defineEmits<{ leaveLobby: []; connectionTarget: [target: HTMLElement | null] }>();
const game = useGameMode();
const ui = useUIManagerStore();
const google = useGoogleStore();
const player = usePlayerInfo();
const livePowerups = useLivePowerupIndicators();
const { getPlayerNameFromID } = usePlayerLookup();
const results = useResultsStore();
const { lobbySettings, roundDeadline } = useLobbyState();
const playing = computed(() => game.modeLogic.currentState === "PLAYING");
const challengers = computed(() => (playing.value ? (livePowerups.value.get(player.value.ID ?? "")?.attackers.map(getPlayerNameFromID) ?? []) : []));
const round = computed(() => lobbySettings.value?.currentRound ?? 0);
const roundCount = computed(() => lobbySettings.value?.conf.numRounds ?? 0);
const playerCount = computed(() => Object.keys(lobbySettings.value?.playerList ?? {}).length);
const roundKey = computed(() => JSON.stringify([lobbySettings.value?.ID, lobbySettings.value?.gameId, round.value]));
const lives = computed(() => ("getUserLives" in game.modeLogic ? game.modeLogic.getUserLives(player.value.ID || "") : 0));

const compactViewport = ref(false);
const landscapeLayout = computed(() => compactViewport.value && !ui.isVertical);
const viewportStyle = useViewportFit(() => compactViewport.value && !landscapeLayout.value);
let viewportQuery: MediaQueryList | undefined;
const updateViewport = () => (compactViewport.value = viewportQuery?.matches ?? false);
const guessMap = useTemplateRef<{
    surface: HTMLElement | null;
    scoresHost: HTMLElement | null;
    timerHost: HTMLElement | null;
    focusLauncher: () => void;
    focusClose: () => void;
}>("guessMap");
const menu = useTemplateRef("menu");
const gameplayRoot = useTemplateRef("gameplayRoot");
const headerScoresHost = useTemplateRef("headerScoresHost");
const mapPreference = ref<"closed" | "compact" | "expanded" | null>(null);
const mapMode = computed(() => {
    const preference = mapPreference.value ?? (compactViewport.value ? "closed" : "compact");
    return compactViewport.value && preference !== "closed" ? "expanded" : preference;
});
const mapModal = computed(() => playing.value && compactViewport.value && mapMode.value === "expanded");
const timerHost = computed(() => (playing.value && mapMode.value === "expanded" ? guessMap.value?.timerHost : null));
const roundTimer = useTemplateRef<{ draw: (remainingMs: number, expiryProgress: number) => void }>("roundTimer");
const { countdown, fullRoundTime } = useTimer(
    () => playing.value,
    (remainingMs, expiryProgress) => roundTimer.value?.draw(remainingMs, expiryProgress)
);
const scoresHost = computed(() => (mapModal.value ? guessMap.value?.scoresHost : landscapeLayout.value ? headerScoresHost.value : null) ?? null);
const connectionTarget = computed(() => (mapModal.value ? guessMap.value?.surface : gameplayRoot.value) ?? null);
watch(connectionTarget, (target) => emit("connectionTarget", target), { flush: "post" });

const scoreboardId = useId();
const scoreTitleId = useId();
const scoreboardBody = useTemplateRef("scoreboardBody");
const scoresToggle = useTemplateRef("scoresToggle");
const scoreboardVisible = ref(true);
const scoresExpanded = ref(false);
const playerId = computed(() => player.value.ID ?? "");
const lastGuess = computed(() => results.rawResults[playerId.value]?.findLast(hasGuess));
const bestGuess = computed(() => {
    const own = results.liveResults[playerId.value];
    return own && hasGuess(own) ? own : undefined;
});
const liveRank = computed(() => {
    const own = bestGuess.value;
    if (!own) return null;
    const members = lobbySettings.value?.playerList;
    return 1 + Object.entries(results.liveResults).filter(([id, result]) => members?.[id] && guessDistance(result) < own.distance).length;
});
const closeScores = () => {
    scoreboardVisible.value = false;
    void nextTick(() => {
        if (compactViewport.value) scoresToggle.value?.focus({ preventScroll: true });
        else menu.value?.focusScores();
    });
};
const toggleScores = () => {
    if (scoreboardVisible.value) closeScores();
    else scoreboardVisible.value = true;
};

const openMap = async () => {
    mapPreference.value = compactViewport.value ? "expanded" : "compact";
    await nextTick();
    if (playing.value && mapMode.value !== "closed" && !mapModal.value) guessMap.value?.focusClose();
};
const closeMap = async () => {
    mapPreference.value = "closed";
    await nextTick();
    if (playing.value && mapMode.value === "closed" && !document.querySelector("dialog[open]")) guessMap.value?.focusLauncher();
};
const toggleMapSize = () => {
    mapPreference.value = mapMode.value === "expanded" ? "compact" : "expanded";
};
watch(scoresHost, (target) => {
    // Reparenting the roster resets its scroll offset.
    const scrollTop = scoreboardBody.value?.scrollTop ?? 0;
    void nextTick(() => {
        if (scoresHost.value === target && scoreboardBody.value) scoreboardBody.value.scrollTop = scrollTop;
    });
});
watch(mapModal, (modal, _previous, onCleanup) => {
    if (!modal) return;
    const frame = requestAnimationFrame(() => guessMap.value?.focusClose());
    onCleanup(() => cancelAnimationFrame(frame));
});

const onOverlayKeydown = (event: KeyboardEvent) => {
    if (!playing.value || document.querySelector("dialog[open]")) return;
    if (event.key === "Escape") {
        const inMap = !!guessMap.value?.surface?.contains(document.activeElement);
        if (compactViewport.value && scoreboardVisible.value) closeScores();
        else if (mapModal.value || (inMap && mapMode.value !== "closed")) void closeMap();
        else if (scoreboardVisible.value) closeScores();
        else return;
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    if (!mapModal.value || event.key !== "Tab") return;
    const panel = guessMap.value?.surface;
    if (!panel) return;
    const controls = Array.from(panel.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, summary, [tabindex]")).filter(
        (element) =>
            element.tabIndex >= 0 &&
            !element.matches(':disabled, [aria-disabled="true"]') &&
            element.getClientRects().length &&
            getComputedStyle(element).visibility === "visible" &&
            !element.closest("[inert]")
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (first && last && (!panel.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
    }
};

const confirmed = ref(false);
let confirmationTimer: ReturnType<typeof setTimeout> | undefined;
const clearConfirmation = () => {
    clearTimeout(confirmationTimer);
    confirmed.value = false;
};
const onGuess = (event: CustomEvent<LiveGuessFeedback>) => {
    if (!playing.value || event.detail.playerId !== player.value.ID) return;
    clearConfirmation();
    confirmed.value = true;
    if (mapModal.value && lives.value > 0 && (roundDeadline.value ?? 0) - Date.now() > 15_000) void closeMap();
    confirmationTimer = setTimeout(clearConfirmation, 1700);
};
const resetRoundPanels = () => {
    mapPreference.value = null;
    scoreboardVisible.value = true;
    scoresExpanded.value = false;
    clearConfirmation();
};
watch(roundKey, resetRoundPanels);
watch(
    () => game.modeLogic.currentState,
    (phase) => {
        if (phase !== "PLAYING" && phase !== "STARTING") resetRoundPanels();
    }
);
watch(
    () => google.isMapInitialized,
    (initialized) => {
        if (initialized) ui.mountingProcess();
    },
    { flush: "post" }
);
onMounted(() => {
    viewportQuery = window.matchMedia("(max-width: 850px), (max-width: 1100px) and (pointer: coarse), (max-height: 520px)");
    updateViewport();
    viewportQuery.addEventListener("change", updateViewport);
    document.addEventListener("keydown", onOverlayKeydown, true);
    ui.on("liveGuess", onGuess);
    if (google.isMapInitialized) ui.mountingProcess();
});
onBeforeUnmount(() => {
    viewportQuery?.removeEventListener("change", updateViewport);
    document.removeEventListener("keydown", onOverlayKeydown, true);
    clearConfirmation();
    ui.off("liveGuess", onGuess);
    ui.detach();
});
</script>

<style>
.gameplay-container {
    --round-accent: #d5fa86;
    --hud-edge: clamp(0.75rem, 1.65vw, 1.8rem);
    --hud-left: max(var(--hud-edge), env(safe-area-inset-left));
    --hud-right: max(var(--hud-edge), env(safe-area-inset-right));
    --hud-bottom: max(3rem, calc(env(safe-area-inset-bottom) + 2.6rem));
    --hud-header: calc(3.75rem + env(safe-area-inset-top));
    --hud-panel-top: calc(var(--hud-header) + var(--hud-edge));
    --hud-glass: radial-gradient(ellipse at 12% 0%, #567e4c40, transparent 55%), linear-gradient(130deg, #082f28f5, #06211fef);
    --hud-border: #b6efa371;
    --hud-shadow: 0 8px 24px #00161175, inset 0 1px #dff9cf28;
    --timer-diameter: clamp(5.25rem, 6.35vw, 6.75rem);
    --gameplay-height: min(var(--gb-viewport-height), var(--visible-height, var(--gb-viewport-height)));
    position: relative;
    isolation: isolate;
    inline-size: 100%;
    block-size: var(--gameplay-height);
    overflow: clip;
    background: #092b25;
    color: #f5fbf2;
}
.gameplay-container .google-panorama {
    position: absolute;
    inset: var(--hud-header) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
.gameplay-chrome {
    position: absolute;
    z-index: 7;
    inset: 0;
    pointer-events: none;
}
.live-duel-notice {
    position: absolute;
    z-index: 7;
    inset: var(--hud-panel-top) auto auto var(--hud-left);
    max-inline-size: min(19rem, 32vw);
}
.is-compact-game .live-duel-notice {
    inset: auto auto calc(var(--mobile-dock-height) + 0.35rem) var(--hud-left);
    max-inline-size: min(24rem, calc(100% - var(--hud-left) - var(--hud-right)));
}
.is-landscape-game .live-duel-notice {
    inset: var(--hud-panel-top) var(--hud-right) auto auto;
    max-inline-size: min(18rem, 30vw);
}
.is-map-modal .live-duel-notice {
    inset: auto auto calc(var(--gb-safe-bottom) + 6.8rem) var(--hud-left);
}
.is-landscape-map.is-map-modal .live-duel-notice {
    inset-block-end: calc(var(--gb-safe-bottom) + 3.7rem);
}
.street-timer-slot {
    --street-center: calc(50% + (var(--gb-safe-left) - var(--gb-safe-right)) / 2);
    position: absolute;
    z-index: 6;
    inset-block-start: var(--hud-panel-top);
    inset-inline-start: var(--street-center);
    translate: -50% 0;
    pointer-events: none;
}
.gameplay-container .hud-button {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 0.54rem;
    border: 1px solid #90cdb848;
    border-radius: 0.72rem;
    background: #0b322b;
    color: #edf9ef;
    line-height: 1;
}
.gameplay-container .hud-button:enabled:hover {
    border-color: #b6e691a6;
    background: #21493a;
}
.gameplay-container .hud-button:disabled {
    opacity: 0.51;
}
.gameplay-container .hud-button .ui-icon {
    width: 1.15rem;
    height: 1.15rem;
}
.gameplay-container :is(button, [tabindex]):focus-visible {
    outline: 2px solid #dcffab;
    outline-offset: -3px;
}
.gameplay-container .round-hud {
    display: flex;
    align-items: center;
    gap: clamp(0.66rem, 1.4vw, 1.45rem);
    min-inline-size: 0;
    pointer-events: none;
}
.round-hud-content {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1.2vw, 1.1rem);
    flex: none;
}
.round-label {
    color: #f1faec;
    white-space: nowrap;
    font: italic 800 clamp(0.8rem, 1.25vw, 1.05rem) / 1.1 var(--gb-font-display);
    letter-spacing: 0.075em;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
}
.round-label strong {
    margin-inline: 0.12em;
    color: var(--round-accent);
    font-size: 1.74em;
    line-height: 0.9;
}
.round-total {
    letter-spacing: 0.02em;
}
.gameplay-container .round-connection {
    width: fit-content;
    border-color: transparent;
    border-radius: 999px;
    padding: 0.18rem 0.5rem;
    font-size: 0.68rem;
    line-height: 1.2;
}
.gameplay-container .match-progress {
    display: block;
    inline-size: clamp(1.5rem, 8vw, 6.4rem);
    block-size: 0.33rem;
    border: 0;
    border-radius: 999px;
    appearance: none;
    color: var(--round-accent);
    background: #b3ecce37;
}
.gameplay-scoreboard {
    position: absolute;
    inset: var(--hud-panel-top) var(--hud-right) auto auto;
    display: flex;
    flex-direction: column;
    inline-size: min(26rem, 35vw);
    max-block-size: min(15.5rem, calc(var(--gb-viewport-height) - var(--hud-panel-top) - var(--hud-bottom)));
    min-inline-size: 0;
    overflow: hidden;
    border: 1px solid var(--hud-border);
    border-radius: 1.15rem;
    background: var(--hud-glass);
    box-shadow: var(--hud-shadow);
    pointer-events: auto;
}
.gameplay-scoreboard.scores-expanded {
    max-block-size: min(53dvh, calc(var(--gb-viewport-height) - var(--hud-panel-top) - var(--hud-bottom)));
}
.scoreboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.22rem 0.42rem 0.22rem 1rem;
    border-block-end: 1px solid #acd29e42;
    background: url("/images/atlas-relief.svg") 120% 22% / 14rem auto no-repeat;
}
.scoreboard-header h2 {
    color: #eff9ee;
    font: italic 850 0.98rem / 1.25 var(--gb-font-display);
    letter-spacing: 0.12em;
    text-transform: uppercase;
}
.scoreboard-tools {
    display: flex;
    gap: 0.26rem;
}
.gameplay-container .scoreboard-tools .hud-button {
    background: #0b322b91;
}
.scoreboard-body {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
}
.gameplay-container.is-compact-game {
    --hud-edge: clamp(0.36rem, 2.25vw, 0.85rem);
    --hud-header: calc(3rem + env(safe-area-inset-top));
    --mobile-score-height: max(44px, 2.75rem);
    --hud-panel-top: calc(var(--hud-header) + var(--mobile-score-height) + var(--hud-edge));
    --hud-bottom: max(2.5rem, calc(env(safe-area-inset-bottom) + 2.15rem));
    --mobile-dock-height: calc(clamp(6.75rem, 15.4dvh, 8.75rem) + env(safe-area-inset-bottom));
    --mobile-notice-bottom: calc(var(--mobile-dock-height) + 2.15rem);
    --portrait-timer-diameter: clamp(4.6rem, 21vw, 5.8rem);
    --timer-diameter: var(--portrait-timer-diameter);
    --mobile-roster-width: min(15rem, 64vw);
    --mobile-roster-height: min(9rem, 30dvh);
}
.gameplay-container.is-compact-game .google-panorama {
    inset-block: calc(var(--hud-header) + var(--mobile-score-height)) var(--mobile-dock-height);
}
.is-compact-game:not(.is-landscape-game) .street-timer-slot.clear-of-scores {
    --timer-room: calc(100vw - var(--hud-left) - var(--hud-right) - var(--mobile-roster-width) - var(--hud-edge));
    --timer-diameter: min(var(--portrait-timer-diameter), calc(var(--timer-room) / 1.53));
    inset-inline-start: calc(100% - var(--hud-right) - var(--timer-room) / 2);
}
.is-compact-game .round-hud {
    flex: 0 1 auto;
    gap: clamp(0.3rem, 1.7vw, 0.9rem);
}
.is-compact-game .round-label {
    font-size: clamp(0.68rem, 1.65vw, 0.86rem);
}
.is-compact-game .match-progress {
    flex: 0 1 auto;
    inline-size: clamp(1.5rem, 7.35vw, 4.4rem);
}
.match-progress::-webkit-progress-bar {
    border-radius: 999px;
    background: #b3ecce37;
}
.match-progress::-webkit-progress-value {
    border-radius: 999px;
    background: currentColor;
}
.match-progress::-moz-progress-bar {
    border-radius: 999px;
    background: currentColor;
}
.is-compact-game .gameplay-scores {
    position: absolute;
    inset: var(--hud-header) 0 auto;
    pointer-events: none;
}
.is-compact-game .guess-map-scores .gameplay-scores {
    inset-block-start: 0;
}
.round-score-strip {
    display: flex;
    align-items: stretch;
    gap: 0.35rem;
    block-size: var(--mobile-score-height);
    padding-inline: var(--hud-left) var(--hud-right);
    background: linear-gradient(105deg, #12382b, #092721 76%);
    box-shadow: inset 0 -1px #b2d9a64f;
    pointer-events: auto;
}
.round-score-readings {
    display: grid;
    grid-template-columns: repeat(3, minmax(max-content, 1fr));
    align-items: center;
    flex: 1;
    max-inline-size: 26rem;
    margin: 0;
    font-variant-numeric: tabular-nums;
    line-height: 1.14;
    white-space: nowrap;
}
.round-score-readings > div {
    padding-inline: clamp(0.25rem, 1.8vw, 0.85rem);
    border-inline-start: 1px solid #c4e5b42e;
}
.round-score-readings > div:first-child {
    padding-inline-start: 0;
    border-inline-start: 0;
}
.round-score-readings dt {
    margin-block-end: 0.15rem;
    color: #b7d2c1;
    font-size: 0.64rem;
    font-weight: 650;
}
.round-score-readings dd {
    margin: 0;
    color: #eff9ee;
    font-size: 0.8rem;
    font-weight: 760;
}
.round-score-readings .round-best-distance dd {
    color: var(--round-accent);
}
.round-score-readings .place-total {
    color: #b7d2c1;
    font-weight: 600;
}
.round-score-toggle {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 0.48rem;
    border-inline-start: 1px solid #c4e5b42e;
    color: #e6f4d9;
    font-size: 0.72rem;
    font-weight: 750;
}
.round-score-toggle:is(:hover, [aria-expanded="true"]) {
    background: #b3e9911b;
    color: var(--round-accent);
}
.round-score-toggle .ui-icon {
    inline-size: 0.95rem;
    block-size: 0.95rem;
    color: var(--round-accent);
}
.round-score-toggle .scores-chevron {
    inline-size: 0.69rem;
    block-size: 0.69rem;
}
.round-score-toggle[aria-expanded="false"] .scores-chevron {
    rotate: 180deg;
}
.is-compact-game .gameplay-scoreboard {
    inset: calc(100% + 0.35rem) var(--hud-right) auto var(--hud-left);
    inline-size: auto;
    max-inline-size: var(--mobile-roster-width);
    max-block-size: var(--mobile-roster-height);
    border-radius: 0.65rem;
    background: #0a2923;
}
.is-compact-game .guess-map-scores .gameplay-scoreboard {
    inset-inline-end: calc(env(safe-area-inset-right) + 3.7rem);
}
.gameplay-container .gameplay-map-recovery {
    pointer-events: auto;
}
.gameplay-container.is-compact-game:not(.has-full-map) :is(.gameplay-map-recovery, .game-connection-banner, .connection-failure-pill) {
    inset-block-end: var(--mobile-notice-bottom);
}
.is-compact-game:not(.has-full-map) .gameplay-map-recovery {
    max-block-size: calc(var(--gameplay-height) - var(--mobile-notice-bottom) - var(--hud-panel-top));
}
@media (max-width: 345px) {
    .is-compact-game .expedition-brand > span {
        display: none;
    }
}
.gameplay-container.is-landscape-game {
    --hud-edge: clamp(0.4rem, 1.55vw, 0.9rem);
    --hud-panel-top: calc(var(--hud-header) + var(--hud-edge));
    --landscape-dock-bottom: calc(2.35rem + env(safe-area-inset-bottom));
    --landscape-map-height: clamp(3.25rem, 17dvh, 4.25rem);
    --mobile-notice-bottom: calc(var(--landscape-dock-bottom) + var(--landscape-map-height) + 0.45rem);
    --timer-diameter: clamp(3.55rem, 17dvh, 4.6rem);
    --timer-warning-scale: 1.06;
    --timer-critical-scale: 1.14;
    --timer-final-scale: 1.28;
    --mobile-roster-height: min(7.5rem, 30dvh);
}
.gameplay-container.is-landscape-game .google-panorama {
    inset-block: var(--hud-header) env(safe-area-inset-bottom);
}
.is-landscape-game .street-timer-slot.clear-of-scores {
    inset-inline-start: max(var(--street-center), calc(var(--hud-left) + var(--mobile-roster-width) + var(--hud-edge) + var(--timer-diameter) * 0.68));
}
.is-landscape-game .expedition-topbar {
    gap: clamp(0.24rem, 1vw, 0.65rem);
    justify-content: flex-start;
    background: linear-gradient(105deg, #11352c, #051f1b 78%);
}
.is-landscape-game .round-hud {
    flex: none;
    gap: 0.34rem;
}
.is-landscape-game .match-progress {
    display: none;
}
.is-landscape-game .round-label {
    font-size: 0.7rem;
}
.is-landscape-game .round-label strong {
    font-size: 1.45em;
}
.is-landscape-game .header-scores-host {
    flex: 1;
    min-inline-size: 0;
}
.is-landscape-game .gameplay-scores {
    position: static;
}
.is-landscape-game .round-score-strip {
    align-items: center;
    padding: 0;
    block-size: var(--mobile-score-height);
    background: none;
    box-shadow: none;
}
.is-landscape-game .round-score-readings {
    grid-template-columns: repeat(2, minmax(max-content, 1fr)) minmax(max-content, 0.64fr);
    max-inline-size: 23rem;
}
.is-landscape-game .round-score-readings > div {
    padding-inline: clamp(0.26rem, 1.05vw, 0.65rem);
}
.is-landscape-game .round-score-readings dd {
    font-size: 0.76rem;
}
.is-landscape-game .round-score-toggle {
    border: 1px solid #b6efa353;
    border-radius: 0.62rem;
    padding-inline: 0.4rem;
}
.is-landscape-game .gameplay-scoreboard {
    inset-block-start: calc(var(--hud-header) + 0.35rem);
}
.is-landscape-game .guess-map-scores .gameplay-scoreboard {
    inset-inline-end: calc(env(safe-area-inset-right) + 9.4rem);
}
.is-landscape-game.has-full-map .gameplay-map-recovery {
    inset: auto auto var(--hud-bottom) var(--hud-left);
    inline-size: min(21rem, 44%);
}
@media (max-width: 850px) {
    .is-landscape-game .expedition-brand > span {
        display: none;
    }
}
@media (max-width: 700px) {
    .is-landscape-game .round-score-toggle > span {
        display: none;
    }
    .is-landscape-game .expedition-topbar {
        gap: 0.25rem;
    }
    .is-landscape-game .round-hud {
        gap: 0.25rem;
    }
    .is-landscape-game .round-score-strip {
        gap: 0.2rem;
    }
    .is-landscape-game .round-score-readings > div {
        padding-inline: 0.2rem;
    }
    .is-landscape-game .round-score-readings > div:first-child {
        padding-inline-start: 0;
    }
    .is-landscape-game .round-score-readings dd {
        font-size: 0.7rem;
    }
    .is-landscape-game .round-score-toggle {
        padding-inline: 0.3rem;
    }
}
@media (max-width: 620px) {
    .is-landscape-game .expedition-brand {
        display: none;
    }
    .is-landscape-game .round-label > span:first-child {
        @apply sr-only;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .street-timer-slot {
        transition: inset-inline-start 210ms ease-out;
    }
    .gameplay-container .hud-button {
        transition:
            background-color 140ms ease,
            border-color 140ms ease;
    }
    .gameplay-scoreboard:not([style*="display: none"]) {
        animation: game-scores-in 180ms ease-out both;
    }
    .is-compact-game .expedition-topbar {
        animation: game-scores-in 170ms ease-out both;
    }
}
@keyframes game-scores-in {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }
}
</style>
