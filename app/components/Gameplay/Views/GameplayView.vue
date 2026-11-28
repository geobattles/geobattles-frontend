<template>
    <div
        id="gameplay_container"
        ref="gameplayRoot"
        class="gameplay-container"
        :class="{ 'is-compact-game': compactViewport, 'is-landscape-game': landscapeLayout, 'has-full-map': mapModal }"
        :style="viewportStyle"
    >
        <GameplayGooglePanorama class="google-panorama" :inert="mapModal" />
        <div v-if="compactViewport" class="mobile-edge-scrims" aria-hidden="true" />
        <div class="gameplay-chrome" :inert="mapModal">
            <GameplayMenu
                ref="menu"
                :players="playerCount"
                :compact="compactViewport"
                :scores-open="scoreboardVisible"
                :scoreboard-id="scoreboardId"
                :can-return-to-start="canReturnToStart"
                @toggle-scores="toggleScores()"
                @leave-lobby-clicked="emit('leaveLobby')"
                @return-to-start="returnToStart()"
            >
                <section v-if="!compactViewport" class="round-hud" aria-label="Round status">
                    <div class="round-hud-content">
                        <p class="round-label">
                            <span>Round</span> <strong>{{ round }}</strong
                            ><span class="round-total"> / {{ roundCount }}</span>
                        </p>
                        <SocketConnectionStatus class="round-connection" />
                    </div>
                    <progress class="match-progress" :value="round" :max="Math.max(1, roundCount)" aria-label="Match progress" />
                </section>
                <div v-else class="compact-top-pills">
                    <div class="compact-round-cluster" aria-label="Round status">
                        <span class="compact-round-badge">
                            <img src="/images/emerald-mark.svg" width="16" height="17" alt="" aria-hidden="true" />
                            <span>
                                <span class="sr-only">Round </span>R<strong>{{ round }}</strong
                                >/{{ roundCount }}
                            </span>
                        </span>
                        <div ref="compactTimerHost" class="compact-timer-host" />
                    </div>
                    <div ref="headerScoresHost" class="header-scores-host" />
                </div>
            </GameplayMenu>
            <Teleport :to="scoresHost || 'body'" :disabled="!scoresHost">
                <div class="gameplay-scores" :class="{ 'is-compact-scores': compactViewport, 'is-in-map': mapModal }">
                    <div v-if="compactViewport" class="round-score-strip">
                        <button
                            ref="scoresToggle"
                            class="hud-button compact-scores-btn"
                            :class="{ 'is-active': scoreboardVisible }"
                            type="button"
                            :aria-label="scoreToggleLabel"
                            :title="scoreboardVisible ? 'Hide scores' : 'Show scores'"
                            :aria-controls="scoreboardId"
                            :aria-expanded="scoreboardVisible"
                            @click="toggleScores"
                        >
                            <UiIcon name="trophy" />
                            <span v-if="playerCount > 1" class="scores-btn-count" aria-hidden="true">{{ playerCount }}</span>
                        </button>
                    </div>
                    <aside
                        v-show="scoreboardVisible"
                        :id="scoreboardId"
                        class="gameplay-scoreboard"
                        :class="{ 'scores-expanded': scoresExpanded, 'is-peek-drawer': isScoreboardPeek, 'is-expandable': isScoreboardPeek && playerCount > 5 }"
                        :aria-labelledby="scoreTitleId"
                    >
                        <header v-if="!compactViewport" class="scoreboard-header">
                            <h2 :id="scoreTitleId">Round scores</h2>
                            <div class="scoreboard-tools">
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
                        <header v-else-if="!isScoreboardPeek" class="compact-drawer-header">
                            <h2 :id="scoreTitleId">Round {{ round }} standings</h2>
                            <div class="compact-drawer-actions">
                                <span class="drawer-count">{{ playerCount }} {{ playerCount === 1 ? "player" : "players" }}</span>
                                <button class="drawer-close" type="button" aria-label="Compact round scores" title="Compact round scores" @click="collapseExpandedScores">
                                    <UiIcon name="close" />
                                </button>
                            </div>
                        </header>
                        <h2 v-else :id="scoreTitleId" class="sr-only">Round scores</h2>
                        <div
                            ref="scoreboardBody"
                            class="scoreboard-body"
                            :tabindex="isScoreboardPeek ? undefined : 0"
                            role="region"
                            aria-label="Player scores, scroll for more players"
                            @click="onPeekClick"
                        >
                            <GameplayBattleRoyaleLiveStatistics v-if="game.currentMode === 'BattleRoyale'" :compact="compactViewport" :peek="isScoreboardPeek" player-hooks />
                            <GameplayCountryBattleLiveStatistics v-else />
                        </div>
                    </aside>
                </div>
            </Teleport>
        </div>
        <div v-show="playing && !compactViewport" class="street-timer-slot" :class="{ 'clear-of-scores': scoreboardVisible }">
            <Teleport :to="timerHost || 'body'" :disabled="!timerHost">
                <GameplayRoundTimer v-show="playing" ref="roundTimer" :compact="compactViewport" :seconds="roundDeadline === null ? null : countdown" :duration="fullRoundTime" />
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
            :can-return-to-start="canReturnToStart"
            @open="openMap"
            @close="closeMap"
            @expand="toggleMapSize"
            @return-to-start="returnToStart()"
        />
        <p v-if="google.mapStatus === 'ready' && google.panoramaStatus === 'ready'" data-testid="maps-ready" class="sr-only">Map initialized and landscape available</p>
        <Teleport :to="connectionTarget || 'body'" :disabled="!mapModal || !connectionTarget">
            <GameplayDuelNotice class="live-duel-notice" :challengers="challengers" :round="round" :compact="compactViewport" />
            <GameplayMapRecovery class="gameplay-map-recovery" panorama :active="playing" />
        </Teleport>
    </div>
</template>
<script setup lang="ts">
import type { LiveGuessFeedback } from "~/utils/resultUtils";

type MobileScoreboardMode = "closed" | "peek" | "expanded";

const emit = defineEmits<{ leaveLobby: []; connectionTarget: [target: HTMLElement | null] }>();
const game = useGameMode();
const ui = useUIManagerStore();
const google = useGoogleStore();
const player = usePlayerInfo();
const livePowerups = useLivePowerupIndicators();
const { getPlayerNameFromID } = usePlayerLookup();
const { lobbySettings, roundDeadline } = useLobbyState();
const playing = computed(() => game.modeLogic.currentState === "PLAYING");
const challengers = computed(() => (playing.value ? (livePowerups.value.get(player.value.ID ?? "")?.attackers.map(getPlayerNameFromID) ?? []) : []));
const round = computed(() => lobbySettings.value?.currentRound ?? 0);
const roundCount = computed(() => lobbySettings.value?.conf.numRounds ?? 0);
const playerCount = computed(() => Object.keys(lobbySettings.value?.playerList ?? {}).length);
const roundKey = computed(() => JSON.stringify([lobbySettings.value?.ID, lobbySettings.value?.gameId, round.value]));
const lives = computed(() => ("getUserLives" in game.modeLogic ? game.modeLogic.getUserLives(player.value.ID || "") : 0));
const canReturnToStart = computed(() => game.currentMode === "BattleRoyale" && "returnToStart" in game.modeLogic);
const returnToStart = () => {
    if ("returnToStart" in game.modeLogic) game.modeLogic.returnToStart();
};

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
const menu = useTemplateRef<{ focusScores: () => void; closeMenu: (restoreFocus?: boolean) => void }>("menu");
const gameplayRoot = useTemplateRef("gameplayRoot");
const headerScoresHost = useTemplateRef("headerScoresHost");
const compactTimerHost = useTemplateRef("compactTimerHost");
const mapPreference = ref<"closed" | "compact" | "expanded" | null>(null);
const mapMode = computed(() => {
    const preference = mapPreference.value ?? (compactViewport.value ? "closed" : "compact");
    return compactViewport.value && preference !== "closed" ? "expanded" : preference;
});
const mapModal = computed(() => playing.value && compactViewport.value && mapMode.value === "expanded");
const timerHost = computed(() => {
    if (!playing.value) return null;
    if (compactViewport.value) return (mapModal.value ? guessMap.value?.timerHost : compactTimerHost.value) ?? null;
    return mapMode.value === "expanded" ? (guessMap.value?.timerHost ?? null) : null;
});
const roundTimer = useTemplateRef<{ draw: (remainingMs: number, expiryProgress: number) => void }>("roundTimer");
const { countdown, fullRoundTime } = useTimer(
    () => playing.value,
    (remainingMs, expiryProgress) => roundTimer.value?.draw(remainingMs, expiryProgress)
);
const scoresHost = computed(() => {
    if (mapModal.value) return guessMap.value?.scoresHost ?? null;
    if (compactViewport.value) return headerScoresHost.value ?? null;
    return null;
});
const connectionTarget = computed(() => (mapModal.value ? guessMap.value?.surface : gameplayRoot.value) ?? null);
watch(connectionTarget, (target) => emit("connectionTarget", target), { flush: "post" });

const scoreboardId = useId();
const scoreTitleId = useId();
const scoreboardBody = useTemplateRef("scoreboardBody");
const scoresToggle = useTemplateRef("scoresToggle");
const desktopScoresOpen = ref(true);
const mobileScoresMode = ref<MobileScoreboardMode>("peek");
const scoreboardVisible = computed(() => (compactViewport.value ? mobileScoresMode.value !== "closed" : desktopScoresOpen.value));
const isScoreboardPeek = computed(() => compactViewport.value && mobileScoresMode.value === "peek");
const scoresExpanded = ref(false);

const scoreToggleLabel = computed(() => `${scoreboardVisible.value ? "Hide" : "Show"} round scores (${playerCount.value} ${playerCount.value === 1 ? "player" : "players"})`);

const closeScores = () => {
    if (compactViewport.value) {
        mobileScoresMode.value = "closed";
    } else {
        desktopScoresOpen.value = false;
    }
    void nextTick(() => {
        if (compactViewport.value) scoresToggle.value?.focus({ preventScroll: true });
        else menu.value?.focusScores();
    });
};
const collapseExpandedScores = () => {
    mobileScoresMode.value = "peek";
};
const toggleScores = () => {
    if (!compactViewport.value) {
        if (desktopScoresOpen.value) closeScores();
        else desktopScoresOpen.value = true;
        return;
    }
    menu.value?.closeMenu();
    mobileScoresMode.value = mobileScoresMode.value === "closed" ? "peek" : "closed";
};
const onPeekClick = () => {
    if (!isScoreboardPeek.value || playerCount.value <= 5) return;
    mobileScoresMode.value = "expanded";
};

const openMap = async () => {
    menu.value?.closeMenu();
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
        if (compactViewport.value && mobileScoresMode.value === "expanded") {
            mobileScoresMode.value = "peek";
        } else if (mapModal.value || (inMap && mapMode.value !== "closed")) void closeMap();
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
    desktopScoresOpen.value = true;
    mobileScoresMode.value = "peek";
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
    [() => google.isPanoramaInitialized, compactViewport],
    ([initialized, compact]) => {
        if (initialized) google.setPanoramaControlsLeft(compact);
    },
    { immediate: true, flush: "post" }
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
.mobile-edge-scrims {
    position: absolute;
    z-index: 4;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, #04191470 0%, #04191420 9%, transparent 18%), linear-gradient(0deg, #0419147a 0%, #04191424 10%, transparent 20%);
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
    inset: auto auto calc(max(0.32rem, env(safe-area-inset-bottom)) + 3.55rem) 50%;
    translate: -50% 0;
    max-inline-size: min(17rem, calc(100% - var(--hud-left) - var(--hud-right)));
}
.is-landscape-game:not(.has-full-map) .live-duel-notice {
    inset: max(0.55rem, env(safe-area-inset-top)) auto auto 50%;
    translate: -50% 0;
    max-inline-size: min(16rem, 36vw);
}
.is-map-modal .live-duel-notice {
    inset: auto auto calc(max(0.5rem, env(safe-area-inset-bottom)) + 4.1rem) 50%;
    translate: -50% 0;
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

/* ==================== COMPACT / MOBILE FLOATING EMERALD HUD ==================== */
.gameplay-container.is-compact-game {
    --hud-edge: clamp(0.45rem, 2.2vw, 0.85rem);
    --hud-header: calc(3.25rem + env(safe-area-inset-top));
    --hud-panel-top: calc(var(--hud-header) + 0.35rem);
    --hud-bottom: max(0.35rem, env(safe-area-inset-bottom));
    --mobile-notice-bottom: calc(max(0.32rem, env(safe-area-inset-bottom)) + 3.6rem);
    --mobile-roster-width: min(19rem, calc(100vw - var(--hud-left) - var(--hud-right)));
    --mobile-roster-height: min(13.5rem, 40dvh);
}
.gameplay-container.is-compact-game .google-panorama {
    inset: 0;
}
.compact-top-pills {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.38rem;
    min-inline-size: 0;
    pointer-events: none;
}
.compact-round-cluster {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    flex: none;
    pointer-events: auto;
}
.compact-round-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    min-block-size: 38px;
    padding: 0.18rem 0.56rem 0.18rem 0.42rem;
    border: 1px solid #b6efa35a;
    border-radius: 999px;
    background: linear-gradient(140deg, #09322ae0, #051f1be8);
    box-shadow:
        0 5px 16px #0016117a,
        inset 0 1px #dff9cf24;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #c2dccd;
    font: 760 0.75rem / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.compact-round-badge img {
    inline-size: 0.95rem;
    block-size: auto;
    flex: none;
}
.compact-round-badge strong {
    color: var(--round-accent);
    font-size: 1.15em;
    font-weight: 900;
}
.compact-timer-host {
    display: flex;
    align-items: center;
    flex: none;
}
.header-scores-host {
    flex: 1;
    min-inline-size: 0;
    pointer-events: none;
}
.gameplay-scores.is-compact-scores {
    position: static;
    pointer-events: none;
}
.is-compact-scores .round-score-strip {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-inline-size: 0;
    pointer-events: none;
}
.compact-scores-btn {
    position: relative;
    gap: 0.24rem;
    min-inline-size: 42px;
    min-block-size: 42px;
    padding-inline: 0.56rem;
    border-radius: 999px !important;
    border-color: #b6efa35a !important;
    background: linear-gradient(140deg, #09322ae0, #051f1be8) !important;
    box-shadow:
        0 5px 16px #0016117a,
        inset 0 1px #dff9cf24;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #e6f6e5;
    pointer-events: auto;
}
.compact-scores-btn.is-active {
    border-color: #d5fa8699 !important;
    color: #ffca62;
}
.scores-btn-count {
    font: 800 0.74rem / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
    color: #e8f7e3;
}
.is-compact-scores .gameplay-scoreboard {
    position: absolute;
    inset: calc(100% + 0.16rem) auto auto var(--hud-left);
    inline-size: var(--mobile-roster-width);
    max-inline-size: min(19rem, calc(100vw - var(--hud-left) - var(--hud-right)));
    max-block-size: var(--mobile-roster-height);
    border: 1px solid #b6efa368;
    border-radius: 1rem;
    background: linear-gradient(155deg, #09322ae8, #051e1af0);
    box-shadow:
        0 10px 28px #00151096,
        inset 0 1px #e2ffd024;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}
.is-compact-scores.is-in-map .gameplay-scoreboard {
    inset: calc(100% + 0.36rem) auto auto 0;
}
.is-compact-scores .gameplay-scoreboard.is-peek-drawer {
    inline-size: fit-content;
    min-inline-size: min(13.5rem, calc(100vw - var(--hud-left) - var(--hud-right)));
    max-inline-size: min(22rem, calc(100vw - var(--hud-left) - var(--hud-right)));
    max-block-size: none;
    border-color: #b6efa34a;
    border-radius: 0.85rem;
    background: linear-gradient(145deg, #082d25bd, #041b17ca);
    box-shadow: 0 6px 18px #0015106e;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
.is-compact-scores .gameplay-scoreboard.is-peek-drawer.is-expandable {
    cursor: pointer;
}
.compact-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    padding: 0.3rem 0.35rem 0.3rem 0.75rem;
    border-block-end: 1px solid #b6efa32c;
}
.compact-drawer-header h2 {
    color: #d7eee0;
    font: 780 0.7rem / 1.2 var(--gb-font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.compact-drawer-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}
.drawer-count {
    color: #70d9af;
    font-size: 0.68rem;
    font-weight: 700;
}
.drawer-close {
    display: inline-grid;
    place-items: center;
    inline-size: 32px;
    block-size: 32px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #cfe4d6;
}
.drawer-close:hover {
    background: #ffffff14;
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
.gameplay-container.is-landscape-game {
    --hud-edge: clamp(0.45rem, 1.5vw, 0.9rem);
    --hud-header: calc(3rem + env(safe-area-inset-top));
    --mobile-roster-height: min(9rem, 48dvh);
}
.is-landscape-game .compact-scores-btn {
    min-inline-size: 38px;
    min-block-size: 38px;
}
.is-landscape-game .compact-round-badge {
    min-block-size: 36px;
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
}
@keyframes game-scores-in {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }
}
</style>
