<template>
    <figure class="score-examples">
        <figcaption class="field-label">Distance → base points</figcaption>
        <dl>
            <div v-for="example in examples" :key="example.km">
                <dt>{{ example.km.toLocaleString("en-US", { maximumFractionDigits: 2 }) }} km away</dt>
                <dd>{{ example.points.toLocaleString("en-US") }} <small>pts</small></dd>
            </div>
        </dl>
        <p class="field-help">Within {{ scoreScaleKm === undefined ? scoreFactor : 100 }} m: 5,000 points. Beyond that, points fall with distance and are rounded down.</p>
        <p class="field-help">Base score only, before placement and powerup bonuses.</p>
    </figure>
</template>
<script setup lang="ts">
import { previewBaseScore } from "~/utils/regionScoring";
const props = defineProps<{ scoreFactor: number; scoreScaleKm?: number }>();
const examples = computed(() => {
    const distances = props.scoreScaleKm === undefined ? [1, 10, 100, 1000] : [0.25, 1, 2, 4].map((step) => Number((0.1 + props.scoreScaleKm! * step).toPrecision(2)));
    return distances.map((km) => ({ km, points: previewBaseScore(km, props.scoreFactor, props.scoreScaleKm) }));
});
</script>
<style scoped>
.score-examples {
    margin: 0;
    display: grid;
    gap: 0.4rem;
    padding: 0.65rem;
    background: var(--gb-bg);
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
}
dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem 0.75rem;
    margin: 0;
}
dl > div {
    min-width: 0;
}
dt {
    color: var(--gb-muted);
    font-size: 0.75rem;
}
dd {
    margin: 0;
    color: var(--gb-accent);
    font-size: 0.95rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}
small {
    font-size: 0.75rem;
    font-weight: 400;
}
</style>
