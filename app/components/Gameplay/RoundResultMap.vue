<template>
    <section class="round-reveal-map" :class="{ 'compact-map': compact }" aria-label="Round answer and best guesses">
        <div class="round-map-stage">
            <div id="midround-map-slot" class="round-reveal-host"></div>
            <GameplayMapRecovery v-if="active" active class="round-map-recovery" />
        </div>
        <div v-if="answer" class="map-details">
            <div class="map-location">
                <UiIcon name="target" />
                <div>
                    <span>Round location</span>
                    <strong>{{ coordinates }}</strong>
                </div>
            </div>
            <div v-if="mapReady" class="map-key" aria-label="Map legend">
                <span><UiIcon name="target" />{{ compact ? "Actual" : "Actual location" }}</span>
                <span v-if="distance">
                    <i class="guess-dot" :style="{ color: ownColor }" aria-hidden="true" />{{ compact ? "Your guess" : "Your best guess" }}
                    <strong v-if="!compact">{{ distance }}</strong>
                </span>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { Coordinates } from "~/types/appTypes";

const props = defineProps<{ answer?: Coordinates; distance: string; active: boolean; compact?: boolean }>();
const google = useGoogleStore();
const player = usePlayerInfo();
const { getPlayerColorByID } = usePlayerLookup();
const ownColor = computed(() => getPlayerColorByID(player.value.ID ?? ""));
const mapReady = computed(() => google.mapStatus === "ready");
const formatCoordinate = (value: number, positive: string, negative: string) => `${Math.abs(value).toFixed(2)}° ${value < 0 ? negative : positive}`;
const coordinates = computed(() => (props.answer ? `${formatCoordinate(props.answer.lat, "N", "S")} · ${formatCoordinate(props.answer.lng, "E", "W")}` : ""));
</script>

<style scoped>
.round-reveal-map {
    position: relative;
    isolation: isolate;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--recap-border);
    border-radius: clamp(0.85rem, 2vw, 1.5rem);
    background:
        url("/images/atlas-relief.svg") 50% 100% / 55rem auto no-repeat,
        radial-gradient(ellipse at 30% 24%, #275747, #0b2d26 65%, #08231e);
    box-shadow: 0 0.3rem 1.5rem #001c144d;
}
.round-map-stage,
.round-reveal-host,
.round-reveal-host > :deep(.game-map-host) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
}
.map-details {
    display: contents;
}
.round-reveal-host > :deep(.game-map-host) {
    color-scheme: light;
}
.map-location,
.map-key {
    position: absolute;
    inset-inline-start: clamp(0.38rem, 1.3vw, 0.9rem);
    display: flex;
    align-items: center;
    gap: 0.45rem;
    max-width: calc(100% - 0.8rem);
    padding: 0.28rem 0.55rem;
    border: 1px solid #caefa066;
    border-radius: 0.6rem;
    background: #062a23f2;
    color: #f0fff3;
    box-shadow: 0 2px 9px #001a1680;
    pointer-events: none;
}
.map-location {
    inset-block-start: clamp(0.38rem, 1.3vw, 0.9rem);
    font-size: clamp(0.72rem, 2vw, 0.9rem);
}
.map-location div {
    display: grid;
}
.map-location div span {
    color: var(--recap-muted);
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.map-location .ui-icon,
.map-key .ui-icon {
    color: var(--gb-text);
}
.map-key {
    inset-block-end: 1.95rem;
    gap: 0.62rem;
    flex-wrap: wrap;
    font-size: clamp(0.62rem, 1.75vw, 0.8rem);
}
.map-key > span {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    white-space: nowrap;
}
.map-key strong {
    color: #ffe2a1;
    font-variant-numeric: tabular-nums;
}
.guess-dot {
    width: 0.6rem;
    height: 0.6rem;
    border: 1px solid #f4f5eb8f;
    border-radius: 50%;
    background: currentColor;
}
.round-reveal-map :deep(.round-map-recovery) {
    inset-block-end: 2.55rem;
    max-height: calc(100% - 5.6rem);
}
.compact-map {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    border-radius: clamp(0.64rem, 1.8vw, 0.95rem);
}
.compact-map .round-map-stage {
    position: relative;
    inset: auto;
    min-height: 0;
}
.compact-map .map-details {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.18rem 0.46rem;
    min-width: 0;
    padding: 0.32rem 0.5rem;
    border-top: 1px solid #a2dfa53d;
    background: #0a3028;
}
.compact-map :is(.map-location, .map-key) {
    position: static;
    max-width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    font-size: clamp(0.63rem, 1.76vw, 0.76rem);
    line-height: 1.2;
}
.compact-map .map-location {
    font-variant-numeric: tabular-nums;
}
.compact-map .map-location div span,
.compact-map .map-location > .ui-icon {
    @apply sr-only;
}
.compact-map .map-key {
    gap: 0.42rem;
    color: #dceee4;
}
.compact-map :deep(.round-map-recovery) {
    inset-block-end: 1.55rem;
    max-height: calc(100% - 1.95rem);
}
</style>
