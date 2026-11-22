<template>
    <div
        ref="surface"
        class="guess-map-panel"
        :class="{ 'is-compact-map': compact, 'is-landscape-map': landscape, 'is-map-modal': fullscreen, 'map-expanded': mode === 'expanded', 'map-closed': mode === 'closed' }"
        :role="fullscreen ? 'dialog' : undefined"
        :aria-modal="fullscreen || undefined"
        :aria-label="fullscreen ? 'Choose your guess on the map' : undefined"
    >
        <div class="guess-map-frame" :inert="mode === 'closed'" :aria-hidden="mode === 'closed' || undefined">
            <header class="guess-map-header">
                <button v-if="fullscreen" ref="closeMap" type="button" class="hud-button close-map" aria-label="Close map" title="Close map" @click="emit('close')">
                    <UiIcon name="close" />
                </button>
                <h2 class="guess-map-title"><UiIcon name="map" />{{ fullscreen ? "Map" : "Guess" }}</h2>
                <span class="guess-count" :data-testid="mode === 'closed' ? undefined : 'guesses-left'">
                    <UiIcon name="pin" />
                    <span :class="{ 'sr-only': landscape }">{{ lives }} {{ lives === 1 ? "guess left" : "guesses left" }}</span>
                    <span v-if="landscape" aria-hidden="true">{{ lives }} left</span>
                </span>
                <div v-if="!compact" class="guess-panel-actions">
                    <button
                        type="button"
                        class="hud-button"
                        :aria-label="mode === 'expanded' ? 'Shrink map' : 'Expand map'"
                        :title="mode === 'expanded' ? 'Shrink map' : 'Expand map'"
                        :aria-expanded="mode === 'expanded'"
                        aria-controls="gameplay-map-slot"
                        @click="emit('expand')"
                    >
                        <UiIcon :name="mode === 'expanded' ? 'shrink' : 'fullscreen'" />
                    </button>
                    <button ref="hideMap" type="button" class="hud-button" aria-label="Hide map" title="Hide map" @click="emit('close')"><UiIcon name="minus" /></button>
                </div>
            </header>
            <div v-show="fullscreen" ref="scoresHost" class="guess-map-scores" />
            <div class="guess-map-workspace">
                <div id="gameplay-map-slot" class="guess-map-slot"><GameplayGoogleMap /></div>
                <div v-show="mode === 'expanded'" ref="timerHost" class="guess-map-timer-host" />
                <div class="guess-map-controls" aria-label="Map camera">
                    <div class="map-zoom">
                        <button type="button" class="hud-button" aria-label="Zoom map in" title="Zoom in" :disabled="!mapReady" @click="zoom(1)"><UiIcon name="plus" /></button>
                        <button type="button" class="hud-button" aria-label="Zoom map out" title="Zoom out" :disabled="!mapReady" @click="zoom(-1)"><UiIcon name="minus" /></button>
                    </div>
                    <button
                        type="button"
                        class="hud-button map-reset"
                        aria-label="Reset map view"
                        title="Reset map view"
                        :disabled="!mapReady || owner.isRestoring.value"
                        @click="resetMap"
                    >
                        <UiIcon name="target" />
                    </button>
                </div>
            </div>
            <footer class="guess-map-actions">
                <p :id="hintId" class="guess-hint" :class="{ 'pin-ready': hasDraft || mapConfirmed, 'inline-guess-error': fullscreen && error }" aria-live="polite">
                    {{ fullscreen && error ? error : hint }}
                </p>
                <button type="button" class="confirm-guess" :disabled="submitDisabled" :aria-busy="isGuessPending" :aria-describedby="hintId" @click="game.submitGuess()">
                    <span v-if="isGuessPending" class="spinner" aria-hidden="true" /><UiIcon v-else name="pin" />
                    {{ isGuessPending ? "Confirming…" : "Confirm Guess" }}
                    <UiIcon v-if="!isGuessPending" class="confirm-arrow" name="arrow" />
                </button>
            </footer>
        </div>
        <GameplayMobileGuessDock
            v-if="compact && mode === 'closed'"
            ref="mobileDock"
            :landscape="landscape"
            :lives="lives"
            :attempts="lobbySettings?.conf.numAttempt ?? lives"
            :pin="hasDraft ? currentMapPin : bestGuess?.location"
            :has-draft="hasDraft"
            :pending="isGuessPending"
            :place-disabled="!playing || !seconds || !lives || isGuessPending"
            :submit-disabled="submitDisabled"
            @open="emit('open')"
            @confirm="game.submitGuess()"
        />
        <button
            v-else-if="mode === 'closed'"
            ref="mapLauncher"
            class="map-launcher"
            type="button"
            aria-label="Open map"
            :aria-describedby="launcherCountId"
            :aria-expanded="false"
            aria-controls="gameplay-map-slot"
            @click="emit('open')"
        >
            <span class="launcher-icon"><UiIcon name="map" /></span>
            <span class="launcher-copy"
                ><strong>Map</strong><span :id="launcherCountId" data-testid="guesses-left">{{ lives }} {{ lives === 1 ? "guess left" : "guesses left" }}</span></span
            >
            <UiIcon v-if="hasDraft" class="launcher-pin" name="pin" />
            <UiIcon name="chevron-up" class="launcher-expand" />
        </button>
        <div v-if="!fullscreen" class="guess-feedback" :class="{ 'is-visible': confirmed || error }">
            <p v-if="error" class="guess-error" role="alert"><UiIcon name="info" />{{ error }}</p>
            <p v-else-if="confirmed" class="guess-accepted" role="status"><UiIcon name="check" />Guess confirmed</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getCountryViewport } from "~/utils/countryViewport";
import { hasGuess } from "~/utils/resultUtils";

const props = defineProps<{
    mode: "closed" | "compact" | "expanded";
    fullscreen: boolean;
    compact: boolean;
    landscape: boolean;
    playing: boolean;
    seconds: number;
    lives: number;
    confirmed: boolean;
}>();
const emit = defineEmits<{ open: []; close: []; expand: [] }>();
const game = useGameMode();
const google = useGoogleStore();
const socket = useWebSocketStore();
const request = useRequestState();
const player = usePlayerInfo();
const liveResults = useLiveResults();
const { lobbySettings } = useLobbyState();
const { currentMapPin, isGuessPending } = useBattleRoyaleState();
const owner = useNuxtApp().$gameRuntime.battleRoyale;
const hintId = useId();
const launcherCountId = useId();
const surface = useTemplateRef("surface");
const scoresHost = useTemplateRef("scoresHost");
const timerHost = useTemplateRef("timerHost");
const mapLauncher = useTemplateRef("mapLauncher");
const mobileDock = useTemplateRef<{ focusMap: () => void }>("mobileDock");
const closeMap = useTemplateRef("closeMap");
const hideMap = useTemplateRef("hideMap");
defineExpose({
    surface,
    scoresHost,
    timerHost,
    focusLauncher: () => {
        if (mobileDock.value) mobileDock.value.focusMap();
        else mapLauncher.value?.focus({ preventScroll: true });
    },
    focusClose: () => (closeMap.value ?? hideMap.value)?.focus({ preventScroll: true }),
});
const mapReady = computed(() => google.isMapInitialized && google.mapStatus === "ready");
const connected = computed(() => socket.isConnected && socket.isOnline);
const hasDraft = computed(() => !!owner.draftMarker.value);
const bestGuess = computed(() => {
    const result = liveResults.value[player.value.ID ?? ""];
    return result && hasGuess(result) ? result : undefined;
});
const error = computed(() => (props.playing && request.requestError?.command === "submit_location" ? request.requestError.message : ""));
const submitDisabled = computed(() => !props.playing || !mapReady.value || !props.seconds || !connected.value || game.modeLogic.isSubmitDisabled || isGuessPending.value);
const mapConfirmed = computed(() => props.fullscreen && props.confirmed && !hasDraft.value);
const hint = computed(() => {
    if (!connected.value) return "Waiting for connection";
    if (!mapReady.value || owner.isRestoring.value) return "Preparing the map…";
    if (!props.seconds) return "Round ending";
    if (isGuessPending.value) return "Waiting for confirmation";
    if (mapConfirmed.value) return "Guess confirmed";
    if (!props.lives) return "No guesses left";
    return hasDraft.value ? "Pin selected" : "Choose a spot on the map";
});
const zoom = (direction: number) => {
    if (mapReady.value) google.setMapZoom((google.getMap.getZoom() ?? 2) + direction);
};
const resetMap = () => {
    if (mapReady.value && !owner.isRestoring.value) google.resetGameplayViewport(getCountryViewport(lobbySettings.value?.conf.ccList));
};
</script>

<style scoped>
.guess-map-panel {
    --map-width: clamp(21rem, 35vw, 36rem);
    --map-height: clamp(9rem, 32dvh, 19rem);
    position: absolute;
    z-index: 5;
    inset: auto auto var(--hud-bottom) var(--hud-left);
    inline-size: min(var(--map-width), calc(100% - var(--hud-left) - var(--hud-right)));
    min-inline-size: 0;
    pointer-events: none;
}
.guess-map-panel.map-expanded {
    --map-width: min(57vw, 57rem);
    --map-height: clamp(10rem, calc(100dvh - var(--hud-header) - var(--hud-bottom) - 15rem), 32rem);
}
.guess-map-frame {
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    padding: clamp(0.5rem, 1.05vw, 1rem);
    gap: 0.55rem;
    border: 1px solid var(--hud-border);
    border-radius: 1.25rem;
    background:
        url("/images/atlas-relief.svg") -5% 115% / 25rem auto no-repeat,
        var(--hud-glass);
    box-shadow: var(--hud-shadow);
    pointer-events: auto;
}
.map-closed .guess-map-frame {
    position: absolute;
    inset: auto 0 0;
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
}
.guess-map-header {
    display: flex;
    align-items: center;
    gap: clamp(0.34rem, 0.85vw, 0.75rem);
    min-inline-size: 0;
}
.guess-map-title {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.42rem;
    padding: 0.47rem 0.7rem;
    border: 1px solid #beeb8670;
    border-radius: 999px;
    color: #f1ffdf;
    background: #c1fa7412;
    font-size: 0.85rem;
    letter-spacing: 0;
}
.guess-map-header .guess-count {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-inline-start: auto;
    color: #e2f6d2;
    font-size: clamp(0.74rem, 1.15vw, 0.87rem);
    font-weight: 650;
    white-space: nowrap;
}
.guess-count .ui-icon {
    color: var(--round-accent);
}
.guess-panel-actions {
    display: flex;
    gap: 0.24rem;
}
.guess-map-workspace {
    position: relative;
    min-block-size: var(--map-height);
    overflow: hidden;
    border: 1px solid #96d7a556;
    border-radius: 0.9rem;
    background: #123d35;
}
.guess-map-slot {
    position: absolute;
    inset: 0;
}
.map-expanded .guess-map-workspace {
    container-type: inline-size;
}
.map-expanded .guess-map-slot {
    isolation: isolate;
}
.guess-map-timer-host {
    --map-timer-inset: 0.75rem;
    --map-timer-clearance: 0.75rem;
    position: absolute;
    z-index: 1;
    inset: var(--map-timer-inset) 0 var(--map-timer-clearance);
    display: flex;
    justify-content: center;
    align-items: start;
    pointer-events: none;
}
.guess-map-timer-host :deep(.round-timer) {
    block-size: min(var(--timer-diameter), 65%);
    inline-size: auto;
    max-inline-size: 65%;
    aspect-ratio: 1;
}
.is-map-modal:not(.is-landscape-map) .guess-map-workspace {
    --map-controls-bottom: 1.75rem;
}
.is-map-modal:not(.is-landscape-map) .guess-map-timer-host {
    --map-timer-clearance: calc(var(--map-controls-bottom) + 3 * 44px + 1.25rem);
    inset-inline: auto 0.5rem;
    inline-size: calc(var(--timer-diameter) * 1.53);
}
.is-map-modal:not(.is-landscape-map).map-scores-open .guess-map-timer-host {
    max-inline-size: calc(100% - var(--hud-left) + env(safe-area-inset-left) - var(--mobile-roster-width) - 1rem);
}
.is-map-modal:not(.is-landscape-map) .guess-map-timer-host :deep(.timer-waiting) {
    inline-size: max-content;
    max-inline-size: calc(100% + 1rem);
    text-align: center;
    white-space: normal;
}
.is-landscape-map .guess-map-timer-host {
    --map-timer-clearance: 6rem;
}
@container (max-width: 40rem) {
    .is-landscape-map.map-scores-open .guess-map-timer-host {
        inset-inline-start: calc(var(--hud-left) - env(safe-area-inset-left) + var(--mobile-roster-width) + 0.5rem);
        inset-inline-end: 9.4rem;
    }
}
@container (max-width: 31rem) {
    .is-landscape-map.map-scores-open .guess-map-timer-host {
        --map-timer-inset: 3.75rem;
        inset-inline-end: 0.75rem;
    }
}
.guess-map-slot :deep(.game-map-host) {
    inline-size: 100%;
    block-size: 100%;
    background: #123d35;
    color-scheme: light;
}
.guess-map-controls {
    position: absolute;
    z-index: 1;
    inset-block-start: 0.5rem;
    inset-inline-end: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 0.38rem;
    pointer-events: auto;
}
.is-map-modal:not(.is-landscape-map) .guess-map-controls {
    inset-block: auto var(--map-controls-bottom);
}
.guess-map-controls .hud-button {
    background-color: #062923f2;
    box-shadow: 0 3px 9px #001f1966;
}
.map-zoom {
    display: flex;
    flex-direction: column;
}
.map-zoom > :first-child {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
}
.map-zoom > :last-child {
    border-start-start-radius: 0;
    border-start-end-radius: 0;
    margin-block-start: -1px;
}
.guess-map-actions {
    display: grid;
    gap: 0.36rem;
}
.guess-hint {
    padding-inline: 0.2rem;
    color: #cae5d5;
    font-size: 0.77rem;
    line-height: 1.3;
}
.guess-hint.pin-ready {
    color: #e6ffb1;
}
.guess-hint.inline-guess-error {
    color: #ffdbcd;
}
.confirm-guess {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.58rem;
    min-inline-size: 0;
    min-block-size: 3rem;
    padding: 0.5rem 0.72rem;
    border: 1px solid var(--gb-scenic-action-border);
    border-radius: 0.83rem;
    background: var(--gb-scenic-action-fill);
    box-shadow: var(--gb-scenic-action-shadow);
    color: var(--gb-scenic-action-ink);
    font: 850 clamp(0.9rem, 1.35vw, 1.15rem) / 1.15 var(--gb-font-display);
    white-space: nowrap;
}
.confirm-guess:disabled {
    border-color: #91ba8a53;
    background: #2d4c3a;
    box-shadow: none;
    color: #d7ecd1;
}
.confirm-guess[aria-busy="true"] {
    border-color: #c9f48796;
    color: #f0ffd1;
}
.confirm-guess:enabled:hover {
    box-shadow: var(--gb-scenic-action-hover-shadow);
}
.confirm-guess:enabled:active,
.map-launcher:active {
    transform: translateY(1px);
}
.confirm-guess .spinner,
.confirm-arrow {
    inline-size: 1rem;
    block-size: 1rem;
}
.map-launcher {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.66rem;
    min-block-size: 3.4rem;
    max-inline-size: 100%;
    padding: 0.48rem 0.78rem 0.48rem 0.48rem;
    border: 1px solid #c6fc976e;
    border-radius: 0.95rem;
    background: var(--hud-glass);
    box-shadow: var(--hud-shadow);
    pointer-events: auto;
}
.launcher-icon {
    display: grid;
    place-items: center;
    inline-size: 2.36rem;
    block-size: 2.36rem;
    border-radius: 0.62rem;
    flex: none;
    background: #b2ff7c18;
    color: var(--round-accent);
}
.launcher-icon .ui-icon {
    inline-size: 1.45rem;
    block-size: 1.45rem;
}
.launcher-copy {
    display: grid;
    gap: 0.16rem;
    color: #f5fbef;
    text-align: start;
    line-height: 1.1;
}
.launcher-copy strong {
    font-size: 0.95rem;
}
.launcher-copy > span {
    font-size: 0.72rem;
    color: #d3efc8;
    white-space: nowrap;
}
.launcher-expand {
    margin-inline-start: auto;
}
.launcher-pin,
.launcher-expand {
    color: var(--round-accent);
}
.map-launcher:hover {
    border-color: var(--round-accent);
    background: linear-gradient(135deg, #235442f5, #052821f5);
}
.guess-feedback {
    position: absolute;
    z-index: 3;
    inset: auto 0 calc(100% + 0.5rem);
    display: none;
    pointer-events: none;
}
.guess-feedback.is-visible {
    display: grid;
    justify-items: start;
}
.guess-feedback p {
    display: flex;
    align-items: center;
    gap: 0.46rem;
    max-inline-size: 100%;
    padding: 0.42rem 0.62rem;
    border: 1px solid #abde8f80;
    border-radius: 0.65rem;
    background: #092f25f5;
    box-shadow: 0 3px 10px #001a1466;
    color: #dfffb1;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.25;
}
.guess-feedback .guess-error {
    border-color: #eb977d8c;
    background: #392823f5;
    color: #ffdbcd;
}
.is-map-modal :deep(.connection-failure-pill) {
    pointer-events: auto;
}
.guess-map-panel.is-compact-map {
    --map-header-height: calc(3.25rem + env(safe-area-inset-top));
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
}
.is-compact-map .guess-map-frame {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    border: 0;
    border-radius: 0;
    background: #062722;
    padding: 0;
    gap: 0;
    transition-property: none;
    grid-template:
        "header" var(--map-header-height)
        "scores" auto
        "map" minmax(0, 1fr)
        "actions" auto / minmax(0, 1fr);
}
.is-compact-map .guess-map-header {
    grid-area: header;
    padding: env(safe-area-inset-top) var(--hud-right) 0 var(--hud-left);
    background: linear-gradient(100deg, #0b3529, #05241f);
    border-block-end: 1px solid #99d8a94d;
}
.is-compact-map .close-map {
    visibility: visible;
    transition-property: none;
}
.is-compact-map .guess-map-title {
    border: 0;
    padding: 0;
    background: none;
    font-size: 1rem;
}
.is-compact-map .guess-map-title .ui-icon,
.is-compact-map .guess-count .ui-icon {
    display: none;
}
.guess-map-scores {
    position: relative;
    z-index: 2;
    grid-area: scores;
    block-size: var(--mobile-score-height);
}
.is-compact-map .guess-map-workspace {
    grid-area: map;
    margin-inline: env(safe-area-inset-left) env(safe-area-inset-right);
    min-block-size: 0;
    border: 0;
    border-radius: 0;
}
.is-compact-map .guess-map-actions {
    grid-area: actions;
    padding: 0.48rem var(--hud-right) max(0.5rem, env(safe-area-inset-bottom)) var(--hud-left);
    border-block-start: 1px solid #a5daa245;
    background: linear-gradient(130deg, #0d382d, #072923);
}
.is-compact-map .confirm-guess {
    min-block-size: 3.25rem;
}
.is-compact-map.map-closed .guess-feedback {
    inset: auto var(--hud-right) var(--mobile-notice-bottom) var(--hud-left);
}
.is-compact-map.is-map-modal {
    z-index: 25;
}
.is-landscape-map.is-map-modal .guess-map-frame {
    grid-template:
        "header scores" var(--hud-header)
        "map map" minmax(0, 1fr)
        "actions actions" auto / auto minmax(0, 1fr);
}
.is-landscape-map .guess-map-header {
    position: relative;
    gap: clamp(0.26rem, 1vw, 0.6rem);
    padding-inline-end: 0.45rem;
}
.is-landscape-map .guess-map-header .guess-count {
    margin-inline-start: 0;
}
.is-landscape-map .guess-map-scores {
    position: static;
    display: flex;
    flex-direction: column;
    justify-content: center;
    block-size: auto;
    padding: env(safe-area-inset-top) var(--hud-right) 0 0;
    border-block-end: 1px solid #99d8a94d;
    background: #05241f;
}
@media (max-width: 620px) {
    .is-landscape-map .guess-map-title {
        display: none;
    }
}
@media (orientation: landscape) {
    .is-compact-map .guess-map-workspace {
        margin-block-end: env(safe-area-inset-bottom);
    }
    .is-compact-map .guess-map-actions {
        position: absolute;
        grid-area: auto;
        inset: auto var(--hud-right) max(1.96rem, calc(env(safe-area-inset-bottom) + 1.55rem)) auto;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: end;
        gap: 0.58rem;
        max-inline-size: calc(100% - var(--hud-left) - var(--hud-right));
        padding: 0.28rem;
        border: 1px solid var(--hud-border);
        border-radius: 0.92rem;
        box-shadow: var(--hud-shadow);
    }
    .is-compact-map .guess-hint {
        padding-inline: 0.48rem;
    }
    .is-compact-map .map-zoom {
        flex-direction: row;
    }
    .is-compact-map .map-zoom > :first-child {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
        border-end-start-radius: 0.7rem;
    }
    .is-compact-map .map-zoom > :last-child {
        margin: 0 0 0 -1px;
        border-start-end-radius: 0.7rem;
        border-end-start-radius: 0;
    }
    .is-compact-map .guess-map-controls {
        inset-inline-end: 0.5rem;
        flex-direction: row;
    }
}
.guess-map-slot :deep(.gameplay-guess-pin) {
    --pin-fill: var(--player-pin-color, #96ad9b);
    position: relative;
    display: block;
    width: 1.15rem;
    height: 1.55rem;
    filter: drop-shadow(0 1px 2px #00140e) drop-shadow(0 0 1px #fff);
}
.guess-map-slot :deep(.gameplay-guess-pin[data-state="draft"]) {
    --pin-fill: #d2ff66;
    width: 1.62rem;
    height: 2.15rem;
}
.guess-map-slot :deep(.gameplay-guess-pin::before) {
    position: absolute;
    inset: 0;
    background: var(--pin-fill);
    mask: url("/gameplay/map-icons/location.svg") center bottom / contain no-repeat;
    content: "";
}
.guess-map-slot :deep(.gameplay-guess-pin[data-state="confirmed"]::after) {
    position: absolute;
    inset: auto -45% -0.5rem;
    height: 1rem;
    border: 2px solid #d5ff8a;
    border-radius: 50%;
    opacity: 0;
    content: "";
}
@media (prefers-reduced-motion: no-preference) {
    .guess-map-panel:not(.map-closed) .guess-map-frame {
        animation: guess-map-reveal 220ms cubic-bezier(0.21, 0.7, 0.28, 1) both;
        transform-origin: left bottom;
    }
    .guess-map-panel.map-expanded .guess-map-frame {
        animation-name: guess-map-expand;
    }
    .guess-map-panel.is-map-modal .guess-map-frame {
        animation-name: guess-map-mobile-open;
    }
    .is-compact-map.map-closed .guess-map-frame {
        translate: 0 0.45rem;
        transition:
            opacity 190ms ease-out,
            translate 190ms ease-out,
            visibility 0s linear 190ms;
    }
    .guess-feedback.is-visible p {
        animation: guess-feedback-in 180ms ease-out both;
    }
    .guess-map-slot :deep(.gameplay-guess-pin[data-state="draft"]::before) {
        animation: guess-feedback-in 160ms ease-out both;
    }
    .guess-map-slot :deep(.gameplay-guess-pin[data-state="confirmed"]::after) {
        animation: guess-pin-ripple 500ms ease-out both;
    }
    .confirm-guess {
        transition:
            box-shadow 150ms ease,
            transform 120ms ease;
    }
}
@keyframes guess-map-reveal {
    from {
        opacity: 0.45;
        transform: translateY(5px) scale(0.98);
    }
}
@keyframes guess-map-expand {
    from {
        opacity: 0.5;
        transform: translateY(7px) scale(0.975);
    }
}
@keyframes guess-map-mobile-open {
    from {
        opacity: 0.7;
        translate: 0 0.6rem;
    }
}
@keyframes guess-feedback-in {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
}
@keyframes guess-pin-ripple {
    from {
        opacity: 0.8;
        transform: scale(0.55);
    }
    to {
        opacity: 0;
        transform: scale(1.5);
    }
}
</style>
