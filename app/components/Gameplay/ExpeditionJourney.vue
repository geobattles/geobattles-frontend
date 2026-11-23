<template>
    <dialog ref="sheet" class="expedition-journey" :class="{ 'journey-overlay': compact }" :aria-labelledby="titleId" @cancel.prevent="emit('close')">
        <header class="journey-header">
            <div>
                <h2 :id="titleId"><UiIcon name="map" />{{ stops.length > 1 ? "Expedition Journey" : "Answer Map" }}</h2>
                <p v-if="description">{{ description }}</p>
            </div>
            <button v-if="compact" ref="closeButton" class="journey-control" type="button" aria-label="Close journey map" @click="emit('close')"><UiIcon name="close" /></button>
        </header>
        <div class="journey-canvas">
            <div v-show="canShowMap" id="endgame-map-slot" class="journey-map-host" aria-label="Expedition locations"></div>
            <div v-if="!canShowMap" class="journey-fallback">
                <UiIcon name="compass" />
                <p>{{ stops.length ? "Expedition locations" : "Expedition complete" }}</p>
                <span v-if="!stops.length">Round locations unavailable</span>
            </div>
            <div v-if="canShowMap" class="journey-map-controls" aria-label="Map camera">
                <button type="button" class="journey-control" aria-label="Zoom journey map in" @click="zoom(1)"><UiIcon name="plus" /></button>
                <button type="button" class="journey-control" aria-label="Zoom journey map out" @click="zoom(-1)"><UiIcon name="minus" /></button>
                <button type="button" class="journey-control" aria-label="Fit journey map" @click="google.refreshMapLayout()"><UiIcon name="target" /></button>
            </div>
            <GameplayMapRecovery v-if="active && stops.length" class="journey-recovery" />
        </div>
        <div v-if="stops.length > 1" class="journey-picker" role="group" aria-label="Choose round to review">
            <button type="button" :aria-pressed="view === 'journey'" @click="selected = null">All rounds</button>
            <button v-for="stop in stops" :key="stop.round" type="button" :aria-pressed="view === stop.round" @click="selected = stop.round">Round {{ stop.round }}</button>
        </div>
        <div ref="connectionTarget" class="journey-connection" />
    </dialog>
</template>

<script setup lang="ts">
import { expeditionStops, formatGuessDistance, hasGuess, roundResultPoints } from "~/utils/resultUtils";

const props = defineProps<{ active: boolean; compact: boolean; open: boolean }>();
const emit = defineEmits<{ close: []; connectionTarget: [element: HTMLElement | null] }>();
const titleId = useId();
const sheet = useTemplateRef("sheet");
const closeButton = useTemplateRef("closeButton");
const connectionTarget = useTemplateRef("connectionTarget");
const { lobbySettings, revealedAnswers } = useLobbyState();
const player = usePlayerInfo();
const battle = useBattleRoyaleStore();
const game = useGameMode();
const google = useGoogleStore();
const selected = ref<number | null>(null);
const matchKey = computed(() => JSON.stringify([lobbySettings.value?.ID, lobbySettings.value?.gameId]));
const stops = computed(() => expeditionStops(revealedAnswers.value, lobbySettings.value?.currentRound ?? 0));
const view = computed(() =>
    stops.value.some(({ round }) => round === selected.value) ? selected.value! : stops.value.length > 1 ? "journey" : (stops.value[0]?.round ?? "journey")
);
const canShowMap = computed(() => stops.value.length > 0 && google.mapStatus === "ready");
const description = computed(() => {
    if (!stops.value.length) return "";
    if (view.value === "journey") return `${stops.value.length} completed rounds`;
    const score = lobbySettings.value?.endResults[view.value]?.[player.value.ID ?? ""];
    if (!score) return `Round ${view.value}`;
    return `Round ${view.value} · ${hasGuess(score) ? formatGuessDistance(score) : "No guess"} · ${roundResultPoints(score).toLocaleString()} pts`;
});
const reviewKey = computed(() => JSON.stringify([matchKey.value, view.value, stops.value]));
watch(matchKey, () => (selected.value = null));
watch(
    () => props.active,
    (active) => {
        if (!active) selected.value = null;
    }
);
watch(
    [() => props.active, reviewKey],
    () => {
        if (props.active && stops.value.length && game.currentMode === "BattleRoyale") battle.reviewFinishedMap(view.value);
    },
    { immediate: true, flush: "post" }
);
const zoom = (delta: number) => {
    if (google.isMapInitialized) google.setMapZoom((google.getMap.getZoom() ?? 2) + delta);
};

let wasModal = false;
const sync = () => {
    const dialog = sheet.value;
    if (!dialog) return;
    const modal = props.active && props.compact && props.open;
    const shown = props.active && (!props.compact || modal);
    if (dialog.open && (!shown || wasModal !== modal)) dialog.close();
    wasModal = modal;
    emit("connectionTarget", modal ? connectionTarget.value : null);
    if (!shown || dialog.open) return;
    if (modal) {
        dialog.showModal();
        closeButton.value?.focus({ preventScroll: true });
    } else {
        const focused = document.activeElement;
        dialog.show();
        if (focused instanceof HTMLElement && focused !== document.body) focused.focus({ preventScroll: true });
    }
};
watch(() => [props.active, props.compact, props.open], sync, { flush: "post" });
onMounted(sync);
onBeforeUnmount(() => {
    emit("connectionTarget", null);
    sheet.value?.close();
});
</script>

<style scoped>
.expedition-journey[open] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
}
.expedition-journey {
    position: static;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid #99d9af68;
    border-radius: 1.05rem;
    background: linear-gradient(135deg, #123f33, #082720);
    color: #f4fbf3;
}
.journey-connection {
    position: absolute;
    width: 0;
    height: 0;
}
.expedition-journey::backdrop {
    background: #031c17e0;
}
.expedition-journey.journey-overlay {
    position: fixed;
    inset: var(--gb-screen-top, 0px) 0 auto;
    height: var(--gb-viewport-height);
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    border: 0;
    border-radius: 0;
}
.journey-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 3.35rem;
    gap: 0.44rem;
    padding: 0.36rem clamp(0.55rem, 1.65vw, 1.1rem);
    border-bottom: 1px solid #c1e7b73a;
    background: url("/images/atlas-relief.svg") right 50% / 24rem auto no-repeat;
}
.journey-header h2 {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: clamp(1rem, 2.9vw, 1.54rem);
}
.journey-header h2 .ui-icon {
    color: #d7f6b0;
}
.journey-header p {
    margin-top: 0.13rem;
    color: #d0e7d8;
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
}
.journey-canvas {
    position: relative;
    min-height: 0;
    background:
        linear-gradient(180deg, #05241b35, #071f1bd9),
        url("/images/emerald-horizon.webp") 63% 50% / cover no-repeat;
}
.journey-map-host,
.journey-map-host > :deep(.game-map-host) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    color-scheme: light;
}
.journey-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 0.42rem;
    padding: 0.7rem;
    text-align: center;
    text-shadow: 0 1px 8px #011812;
}
.journey-fallback .ui-icon {
    color: #e2ffc5;
    font-size: clamp(1.8rem, 5vw, 3.65rem);
}
.journey-fallback p {
    font: italic 850 clamp(1.05rem, 4vw, 2.15rem) / 1.15 var(--gb-font-display);
}
.journey-fallback span {
    color: #d1e4d8;
    font-size: 0.83rem;
}
.journey-map-controls {
    position: absolute;
    inset: 0.42rem 0.45rem auto auto;
    display: grid;
    gap: 0.28rem;
}
.journey-control {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1px solid #addeb17a;
    border-radius: 0.66rem;
    background: #0a3129f0;
    color: #f2faee;
}
.journey-control:hover {
    border-color: #d2fcb1;
}
.journey-picker {
    display: flex;
    gap: 0.4rem;
    min-width: 0;
    padding: clamp(0.35rem, 1vw, 0.75rem);
    overflow-x: auto;
    scrollbar-width: thin;
}
.journey-picker button {
    flex: none;
    min-height: 44px;
    padding-inline: 0.65rem;
    border: 1px solid #a5d9aa4f;
    border-radius: 999px;
    background: #0a2d25;
    color: #e0f1e5;
    font-size: 0.76rem;
    font-weight: 720;
}
.journey-picker button[aria-pressed="true"] {
    border-color: #d0f39d;
    background: #224a33;
    color: #e4ffc7;
}
.journey-canvas :deep(.journey-recovery) {
    inset-block-end: 2.15rem;
    max-height: calc(100% - 2.85rem);
}
@media (orientation: landscape) and (max-height: 410px) {
    .journey-map-controls {
        display: flex;
    }
}
</style>
