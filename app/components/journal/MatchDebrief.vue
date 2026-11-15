<template>
    <article id="match-debrief" class="match-debrief" aria-labelledby="debrief-title">
        <header class="debrief-heading">
            <div>
                <p class="eyebrow">BATTLE ROYALE · {{ match.rounds.length }} ROUNDS</p>
                <h2 id="debrief-title">
                    {{ journalDate(match.completedAt) }}<span>{{ journalTime(match.completedAt) }}</span>
                </h2>
            </div>
            <span class="saved-tag">Completed</span>
        </header>
        <dl class="match-totals">
            <div>
                <dt>Match score</dt>
                <dd data-testid="journal-debrief-match-score">{{ journalNumber(match.totalScore) }} <small>pts</small></dd>
            </div>
            <div>
                <dt>Final place</dt>
                <dd>
                    {{ match.rank }} <small>/ {{ match.participants }}</small>
                </dd>
            </div>
            <div>
                <dt>Guesses made</dt>
                <dd>{{ totalAttempts }}</dd>
            </div>
        </dl>
        <section class="score-overview" aria-labelledby="score-overview-title">
            <div class="section-label">
                <h3 id="score-overview-title">Round scores</h3>
                <span>Server totals, including bonuses</span>
            </div>
            <svg class="score-chart" viewBox="0 0 640 90" role="img" :aria-label="scoreDescription">
                <path d="M0 48H640" stroke="var(--gb-line)" stroke-width="1" />
                <g v-for="(round, index) in match.rounds" :key="round.round">
                    <rect
                        :x="index * chartStep + chartStep * 0.2"
                        :y="round.score >= 0 ? 48 - barHeight(round.score) : 48"
                        :width="chartStep * 0.6"
                        :height="Math.max(1, barHeight(round.score))"
                        :fill="round.score < 0 ? 'var(--gb-coral)' : round.round === selectedRound ? 'var(--gb-accent)' : 'var(--gb-accent-end)'"
                        rx="2"
                    >
                        <title>Round {{ round.round }}: {{ journalNumber(round.score) }} points</title>
                    </rect>
                    <text v-if="match.rounds.length <= 16" :x="index * chartStep + chartStep / 2" y="85" text-anchor="middle" fill="var(--gb-muted)" font-size="10">
                        {{ round.round }}
                    </text>
                </g>
            </svg>
        </section>
        <div class="round-picker" role="group" aria-label="Choose a round to review">
            <button
                v-for="round in match.rounds"
                :key="round.round"
                type="button"
                :aria-pressed="round.round === selectedRound"
                aria-controls="round-debrief"
                @click="selectRound(round.round)"
            >
                <span>Round {{ String(round.round).padStart(2, "0") }}</span
                ><small>{{ journalDistance(round.distanceMeters) }}</small>
            </button>
        </div>
        <section v-if="activeRound" id="round-debrief" class="round-detail" aria-labelledby="round-title">
            <div class="round-heading">
                <div>
                    <p class="eyebrow">THE DEBRIEF</p>
                    <h3 id="round-title">Round {{ String(activeRound.round).padStart(2, "0") }}</h3>
                </div>
                <div class="round-distance">
                    <strong>{{ journalDistance(activeRound.distanceMeters) }}</strong
                    ><span>{{
                        activeRound.bestAttempt === null ? "Round ended without a guess" : `Closest: attempt ${activeRound.bestAttempt} of ${activeRound.attempts.length}`
                    }}</span>
                </div>
            </div>
            <RoundTrace :round="activeRound" :active-attempt="activeAttempt" />
            <div class="answer-location">
                <span>Answer coordinates</span><strong>{{ journalCoordinates(activeRound.answer) }}</strong>
            </div>
            <div v-if="activeRound.attempts.length" class="attempt-table-wrap" tabindex="0" role="region" aria-label="Guess debrief; scroll horizontally on small screens">
                <table class="attempt-table">
                    <caption>
                        Select an attempt to trace its route on the map.
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col">Attempt</th>
                            <th scope="col">Your coordinates</th>
                            <th scope="col">Distance</th>
                            <th scope="col">Base score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="attempt in activeRound.attempts" :key="attempt.attempt" :class="{ 'selected-attempt': attempt.attempt === activeAttempt }">
                            <th scope="row">
                                <button type="button" :aria-pressed="activeAttempt === attempt.attempt" @click="activeAttempt = attempt.attempt">
                                    {{ String(attempt.attempt).padStart(2, "0") }}<span v-if="attempt.attempt === activeRound.bestAttempt">Closest</span>
                                </button>
                            </th>
                            <td>{{ journalCoordinates(attempt.guess) }}</td>
                            <td>{{ journalDistance(attempt.distanceMeters) }}</td>
                            <td>{{ journalNumber(attempt.baseScore) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-else class="no-guess-note">
                No guess was submitted in this round. A zero-attempt result is not counted as a perfect guess or included in closest-distance records.
            </p>
            <dl class="round-score">
                <div>
                    <dt>Base score</dt>
                    <dd>{{ journalNumber(activeRound.baseScore) }}</dd>
                </div>
                <div>
                    <dt>Bonuses / penalties</dt>
                    <dd>{{ activeRound.bonusScore > 0 ? "+" : "" }}{{ journalNumber(activeRound.bonusScore) }}</dd>
                </div>
                <div>
                    <dt>Round total</dt>
                    <dd data-testid="journal-round-total">{{ journalNumber(activeRound.score) }} <small>pts</small></dd>
                </div>
            </dl>
        </section>
        <footer class="debrief-footer">
            <span>Lobby {{ match.lobbyId }}</span
            ><span>Saved on this device at completion · ties share a place</span>
        </footer>
    </article>
</template>

<script setup lang="ts">
import type { JournalMatch } from "~/types/journal";
import RoundTrace from "./RoundTrace.vue";
import { journalCoordinates, journalDate, journalDistance, journalNumber, journalTime } from "./format";

const props = defineProps<{ match: JournalMatch; initialRound?: number; navigationRevision?: number }>();
const selectedRound = ref(1);
const activeAttempt = ref<number | null>(null);
const activeRound = computed(() => props.match.rounds.find((round) => round.round === selectedRound.value));
const totalAttempts = computed(() => props.match.rounds.reduce((total, round) => total + round.attempts.length, 0));
const chartStep = computed(() => 640 / props.match.rounds.length);
const scoreScale = computed(() => Math.max(1, ...props.match.rounds.map((round) => Math.abs(round.score))));
const barHeight = (score: number) => (Math.abs(score) / scoreScale.value) * 32;
const scoreDescription = computed(
    () => `Round scores: ${props.match.rounds.map((round) => `${round.round}: ${round.score} points`).join("; ")}. The baseline is zero; penalties extend below it.`
);
const selectRound = (round: number) => {
    selectedRound.value = round;
    activeAttempt.value = activeRound.value?.bestAttempt ?? null;
};
// Repeated shortcuts must override a round selected locally, even with the same target props.
watch(
    () => [props.match.gameId, props.initialRound, props.navigationRevision] as const,
    () => selectRound(props.match.rounds.find((round) => round.round === props.initialRound)?.round ?? 1),
    { immediate: true }
);
</script>

<style scoped>
.match-debrief {
    min-width: 0;
    background: var(--gb-surface);
    border: 1px solid var(--gb-line);
    border-radius: 16px;
    overflow: hidden;
}
.debrief-heading,
.match-totals,
.score-overview,
.round-detail,
.debrief-footer {
    padding: 1.5rem;
}
.debrief-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
.eyebrow {
    margin: 0 0 0.5rem;
    color: var(--gb-muted);
    font-size: 0.65rem;
    letter-spacing: 0.14em;
    font-weight: 600;
}
h2,
h3 {
    margin: 0;
    font-weight: 600;
    letter-spacing: -0.035em;
}
h2 {
    font-size: 1.65rem;
}
h2 span {
    margin-left: 0.8rem;
    font-size: 0.85rem;
    letter-spacing: 0;
    font-weight: 400;
    color: var(--gb-muted);
}
.saved-tag {
    color: var(--gb-accent);
    background: var(--gb-raised);
    border: 1px solid var(--gb-line);
    padding: 0.3rem 0.6rem;
    border-radius: 99px;
    font-size: 0.7rem;
}
.match-totals {
    margin: 0;
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr;
    gap: 1rem;
    padding-top: 0;
    border-bottom: 1px solid var(--gb-line);
}
dt {
    color: var(--gb-muted);
    font-size: 0.75rem;
}
dd {
    margin: 0.5rem 0 0;
    font-size: 1.7rem;
    font-weight: 600;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
}
dd small {
    font-size: 0.8rem;
    color: var(--gb-muted);
    letter-spacing: 0;
    font-weight: 400;
}
.score-overview {
    padding-bottom: 0.5rem;
}
.section-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.section-label h3 {
    font-size: 0.85rem;
    letter-spacing: 0;
}
.section-label span {
    color: var(--gb-muted);
    font-size: 0.65rem;
}
.score-chart {
    width: 100%;
    height: 90px;
    margin-top: 0.5rem;
}
.round-picker {
    display: flex;
    gap: 0.5rem;
    max-height: 210px;
    overflow: auto;
    flex-wrap: wrap;
    padding: 0.5rem 1.5rem 1.5rem;
    border-bottom: 1px solid var(--gb-line);
}
.round-picker button {
    border: 1px solid var(--gb-line);
    color: var(--gb-text);
    background: var(--gb-bg);
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-align: left;
    min-height: 52px;
    flex: 0 0 auto;
}
.round-picker button small {
    color: var(--gb-muted);
    font-size: 0.65rem;
}
.round-picker button[aria-pressed="true"] {
    border-color: var(--gb-accent);
    background: var(--gb-raised);
}
.round-picker button[aria-pressed="true"] small {
    color: var(--gb-accent);
}
button:focus-visible,
.attempt-table-wrap:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 3px;
}
.round-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.25rem;
}
.round-heading h3 {
    font-size: 1.6rem;
}
.round-distance {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: right;
}
.round-distance strong {
    font-size: 1.35rem;
    font-weight: 500;
    color: var(--gb-accent);
    font-variant-numeric: tabular-nums;
}
.round-distance span {
    color: var(--gb-muted);
    font-size: 0.7rem;
}
.answer-location {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.7rem;
    padding: 0.9rem 0 1.25rem;
    color: var(--gb-muted);
}
.answer-location strong {
    font-weight: 500;
    color: var(--gb-text);
    font-variant-numeric: tabular-nums;
}
.attempt-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--gb-line);
    border-radius: 9px;
}
.attempt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    white-space: nowrap;
}
.attempt-table caption {
    padding: 0.75rem 1rem;
    text-align: left;
    color: var(--gb-muted);
    font-size: 0.75rem;
    caption-side: bottom;
    background: var(--gb-bg);
}
.attempt-table thead {
    background: var(--gb-raised);
    color: var(--gb-muted);
}
.attempt-table th,
.attempt-table td {
    padding: 0.7rem 0.75rem;
    text-align: right;
}
.attempt-table th:first-child {
    text-align: left;
}
.attempt-table thead th {
    font-weight: 500;
}
.attempt-table tbody tr {
    border-top: 1px solid var(--gb-line);
}
.attempt-table td {
    font-variant-numeric: tabular-nums;
    color: var(--gb-text);
}
.attempt-table th button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: transparent;
    border: 1px solid var(--gb-line);
    color: var(--gb-text);
    border-radius: 6px;
    padding: 0.5rem 0.65rem;
    min-height: 44px;
    min-width: 44px;
}
.attempt-table th button span {
    color: var(--gb-accent);
    font-size: 0.6rem;
    font-weight: 400;
}
.attempt-table th button[aria-pressed="true"] {
    border-color: var(--gb-accent);
}
.selected-attempt {
    background: var(--gb-raised);
}
.no-guess-note {
    color: var(--gb-muted);
    line-height: 1.7;
    font-size: 0.85rem;
    padding: 1rem;
    border: 1px dashed var(--gb-line);
    border-radius: 10px;
}
.round-score {
    margin: 1.2rem 0 0;
    display: grid;
    grid-template-columns: 1fr 1.3fr 1fr;
    gap: 1rem;
}
.round-score dd {
    font-size: 1.2rem;
}
.round-score > div:last-child {
    text-align: right;
}
.debrief-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.65rem;
    color: var(--gb-muted);
    border-top: 1px solid var(--gb-line);
    padding-top: 1rem;
    padding-bottom: 1rem;
}
@media (max-width: 640px) {
    .debrief-heading,
    .match-totals,
    .score-overview,
    .round-detail,
    .debrief-footer {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    .round-picker {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    h2 {
        font-size: 1.3rem;
    }
    h2 span {
        display: block;
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
    }
    .match-totals {
        grid-template-columns: 1.2fr 1fr 1fr;
        gap: 0.5rem;
    }
    dd {
        font-size: 1.5rem;
    }
    dt {
        font-size: 0.65rem;
    }
    .round-distance strong {
        font-size: 1.1rem;
    }
    .round-distance {
        text-align: left;
    }
    .round-score {
        gap: 0.5rem;
    }
    .round-score dt {
        font-size: 0.65rem;
    }
}
</style>
