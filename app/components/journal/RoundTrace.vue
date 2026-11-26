<template>
    <figure class="round-trace">
        <svg viewBox="0 0 720 360" role="img" :aria-label="description">
            <rect width="720" height="360" fill="var(--gb-bg)" />
            <image href="/globe/natural-earth-land.svg" width="720" height="360" opacity=".7" />
            <path v-if="routePath" :d="routePath" fill="none" stroke="var(--gb-coral)" stroke-width="1.8" stroke-dasharray="5 4" />
            <g v-for="attempt in round.attempts" :key="attempt.attempt" :transform="`translate(${project(attempt.guess).x} ${project(attempt.guess).y})`">
                <circle
                    :r="attempt.attempt === activeAttempt ? 5 : 3"
                    :fill="attempt.attempt === activeAttempt ? 'var(--gb-coral)' : 'var(--gb-muted)'"
                    stroke="var(--gb-bg)"
                    stroke-width="1.5"
                />
                <circle v-if="attempt.attempt === activeAttempt" r="9" fill="none" stroke="var(--gb-coral)" stroke-opacity=".65" />
            </g>
            <g :transform="`translate(${project(round.answer).x} ${project(round.answer).y})`">
                <circle r="8" fill="var(--gb-bg)" stroke="var(--gb-accent)" stroke-width="1.5" />
                <circle r="3" fill="var(--gb-accent)" />
                <path d="M-13 0h4m18 0h4M0-13v4m0 18v4" stroke="var(--gb-accent)" stroke-width="1.5" />
            </g>
        </svg>
        <figcaption>
            <span class="trace-legend"><span class="answer-key" />Answer<span v-if="selected" class="guess-key" /><span v-if="selected">Selected guess</span></span>
            <span>World view · great-circle route</span>
        </figcaption>
    </figure>
</template>

<script setup lang="ts">
import type { Coordinates } from "~/types/appTypes";
import type { JournalRound } from "~/types/journal";
import { journalCoordinates, journalDistance } from "./format";

const props = defineProps<{ round: JournalRound; activeAttempt: number | null }>();
const selected = computed(() => props.round.attempts.find((attempt) => attempt.attempt === props.activeAttempt));
const project = (point: Coordinates) => ({ x: (point.lng + 180) * 2, y: (90 - point.lat) * 2 });
const description = computed(() => {
    const answer = `Round ${props.round.round}, answer ${journalCoordinates(props.round.answer)}.`;
    return selected.value
        ? `${answer} Attempt ${selected.value.attempt}: ${journalCoordinates(selected.value.guess)}, ${journalDistance(selected.value.distanceMeters)} from the answer. Geographic overview, not a detailed street map.`
        : `${answer} ${props.round.missed ? "You missed this round." : "No guess was submitted."} Geographic overview, not a detailed street map.`;
});
const routePath = computed(() => {
    if (!selected.value) return "";
    const start = selected.value.guess;
    const end = props.round.answer;
    const radians = Math.PI / 180;
    const latitude = start.lat * radians;
    const longitude = start.lng * radians;
    const endLatitude = end.lat * radians;
    const delta = (end.lng - start.lng) * radians;
    const angle = Math.acos(Math.max(-1, Math.min(1, Math.sin(latitude) * Math.sin(endLatitude) + Math.cos(latitude) * Math.cos(endLatitude) * Math.cos(delta))));
    const bearing = Math.atan2(Math.sin(delta) * Math.cos(endLatitude), Math.cos(latitude) * Math.sin(endLatitude) - Math.sin(latitude) * Math.cos(endLatitude) * Math.cos(delta));
    let path = "";
    let previousX: number | null = null;
    for (let step = 0; step <= 64; step++) {
        const travel = (angle * step) / 64;
        const lat = Math.asin(Math.max(-1, Math.min(1, Math.sin(latitude) * Math.cos(travel) + Math.cos(latitude) * Math.sin(travel) * Math.cos(bearing))));
        const lng = longitude + Math.atan2(Math.sin(bearing) * Math.sin(travel) * Math.cos(latitude), Math.cos(travel) - Math.sin(latitude) * Math.sin(lat));
        const point = step === 64 ? project(end) : project({ lat: lat / radians, lng: ((lng / radians + 540) % 360) - 180 });
        const command = previousX === null || Math.abs(point.x - previousX) > 360 ? "M" : "L";
        path += `${command}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
        previousX = point.x;
    }
    return path;
});
</script>

<style scoped>
.round-trace {
    margin: 0;
    overflow: hidden;
    border: 1px solid var(--gb-line);
    border-radius: 10px;
    background: var(--gb-bg);
}
.round-trace > svg {
    display: block;
    width: 100%;
    height: auto;
}
.round-trace image {
    filter: grayscale(1);
}
.round-trace figcaption {
    border-top: 1px solid var(--gb-line);
    padding: 0.75rem 1rem;
    color: var(--gb-muted);
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.7rem;
}
.trace-legend {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--gb-text);
}
.answer-key,
.guess-key {
    height: 7px;
    width: 7px;
    border-radius: 50%;
    background: var(--gb-accent);
    display: inline-block;
}
.guess-key {
    margin-left: 0.7rem;
    background: var(--gb-coral);
}
</style>
