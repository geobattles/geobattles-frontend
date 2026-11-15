<template>
    <section v-if="result" class="round-debrief" :class="{ 'is-compact': compact }" aria-label="Your round debrief">
        <p v-if="!compact" class="eyebrow">Your field notes</p>
        <details class="debrief-disclosure" :open="!compact">
            <summary class="debrief-primary">
                <div>
                    <p class="field-help">{{ hasGuess(result) ? "Closest guess" : "This round" }}</p>
                    <p class="debrief-distance">{{ hasGuess(result) ? formatGuessDistance(result) : "No guess placed" }}</p>
                </div>
                <div>
                    <p class="field-help">Round points</p>
                    <p class="debrief-score">{{ result.total ?? result.baseScr ?? 0 }}</p>
                </div>
                <span class="debrief-toggle">Details</span>
            </summary>
            <dl class="score-breakdown">
                <div>
                    <dt>Base score</dt>
                    <dd>{{ result.baseScr || 0 }}</dd>
                </div>
                <div v-if="result.placeScr">
                    <dt>Placement bonus</dt>
                    <dd>+{{ result.placeScr }}</dd>
                </div>
                <div v-if="result.dblScr">
                    <dt>Double score</dt>
                    <dd>+{{ result.dblScr }}</dd>
                </div>
                <div v-if="result.duelScr">
                    <dt>Duel</dt>
                    <dd>{{ result.duelScr > 0 ? "+" : "" }}{{ result.duelScr }}</dd>
                </div>
            </dl>
            <p class="field-help mt-3">{{ attempts.length }} {{ attempts.length === 1 ? "guess" : "guesses" }} placed. The map shows the answer and each explorer’s closest pin.</p>
        </details>
    </section>
</template>
<script setup lang="ts">
defineProps<{ compact?: boolean }>();
const results = useResultsStore();
const player = usePlayerInfo();
const result = computed(() => (player.value.ID ? results.bestResults[player.value.ID] : undefined));
const attempts = computed(() => (player.value.ID ? (results.rawResults[player.value.ID] ?? []).filter(hasGuess) : []));
</script>
<style scoped>
.round-debrief {
    padding: 1.2rem;
    background: var(--gb-bg);
    border: 1px solid var(--gb-line);
    border-radius: 10px;
    margin-bottom: 1.5rem;
}
.debrief-primary {
    cursor: pointer;
    list-style: none;
    min-height: 44px;
    align-items: center;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}
.debrief-primary::-webkit-details-marker {
    display: none;
}
.debrief-toggle {
    color: var(--gb-muted);
    font-size: 0.65rem;
}
.debrief-toggle::after {
    content: " +";
}
.debrief-disclosure[open] .debrief-toggle::after {
    content: " −";
}
.round-debrief.is-compact {
    padding: 0.4rem 0.55rem;
    margin-bottom: 0.5rem;
}
.is-compact .debrief-primary {
    gap: 0.5rem;
    flex-wrap: nowrap;
}
.is-compact .debrief-primary .field-help {
    font-size: 0.65rem;
}
.is-compact :is(.debrief-distance, .debrief-score) {
    font-size: 1rem;
    margin-top: 0.1rem;
}
.debrief-distance,
.debrief-score {
    font-size: 1.5rem;
    letter-spacing: -0.04em;
    margin-top: 0.4rem;
    font-weight: 700;
}
.debrief-score {
    color: var(--gb-accent);
}
.score-breakdown {
    margin: 1rem 0 0;
    display: grid;
    gap: 0.3rem;
    font-size: 0.75rem;
    color: var(--gb-muted);
}
.score-breakdown > div {
    display: flex;
    justify-content: space-between;
}
.score-breakdown dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
}
@media (max-width: 850px), (pointer: coarse), (max-height: 600px) and (orientation: landscape) {
    .round-debrief {
        padding: 0.75rem;
        margin-bottom: 0.75rem;
    }
    .round-debrief > .eyebrow {
        font-size: 0.6rem;
        margin-bottom: 0.3rem;
    }
    .debrief-primary {
        gap: 0.5rem;
    }
    .debrief-distance,
    .debrief-score {
        font-size: 1.15rem;
        margin-top: 0.15rem;
    }
    .score-breakdown {
        margin-top: 0.5rem;
        gap: 0.15rem;
    }
    .round-debrief > .field-help {
        margin-top: 0.5rem;
        font-size: 0.7rem;
    }
}
</style>
