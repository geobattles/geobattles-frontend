<template>
    <figure class="revealed-map">
        <svg viewBox="0 0 720 360" role="img" :aria-label="`Round answer at ${coordinates} and ${pins.length} best guesses`">
            <image href="/globe/natural-earth-land.svg" width="720" height="360" />
            <circle v-for="pin in pins" :key="pin.id" :cx="x(pin.position)" :cy="y(pin.position)" r="4.5" :fill="pin.color" stroke="#05221b" stroke-width="1.5">
                <title>{{ pin.name }}</title>
            </circle>
            <g :transform="`translate(${x(answer)} ${y(answer)})`">
                <circle r="8" fill="#092c24" stroke="#daffab" stroke-width="2" />
                <path d="M-12 0h6m12 0h6M0-12v6m0 12v6" stroke="#daffab" stroke-width="2" />
                <circle r="2" fill="#daffab" />
            </g>
        </svg>
        <figcaption><UiIcon name="target" />{{ coordinates }}<span>Best guesses in player colors</span></figcaption>
    </figure>
</template>

<script setup lang="ts">
import type { Coordinates, Results, playerListObject } from "~/types/appTypes";
import { hasGuess } from "~/utils/resultUtils";

const props = defineProps<{ answer: Coordinates; results: Results; players: playerListObject }>();
const x = (position: Coordinates) => (position.lng + 180) * 2;
const y = (position: Coordinates) => (90 - position.lat) * 2;
const coordinate = (value: number, positive: string, negative: string) => `${Math.abs(value).toFixed(2)}° ${value < 0 ? negative : positive}`;
const coordinates = computed(() => `${coordinate(props.answer.lat, "N", "S")}  ${coordinate(props.answer.lng, "E", "W")}`);
const pins = computed(() =>
    Object.entries(props.results)
        .filter(([, result]) => hasGuess(result))
        .map(([id, result]) => ({
            id,
            name: props.players[id]?.name ?? "Player",
            color: props.players[id]?.color ?? "#b8e2dc",
            position: result.location,
        }))
);
</script>

<style scoped>
.revealed-map {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    min-height: 0;
    height: 100%;
    margin: 0;
    background: #0c3540;
}
.revealed-map svg:not(.ui-icon) {
    width: 100%;
    height: 100%;
    min-height: 0;
}
.revealed-map figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.65rem;
    padding: 0.55rem 0.7rem;
    border-top: 1px solid #9be5bd39;
    background: #0a2924;
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
}
.revealed-map figcaption span {
    margin-inline-start: auto;
    color: #b4d2c5;
}
</style>
