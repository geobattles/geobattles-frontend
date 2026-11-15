<template>
    <ol class="match-list" aria-label="Completed matches">
        <li v-for="match in matches" :key="match.gameId">
            <button
                type="button"
                class="match-button"
                data-testid="journal-entry"
                :data-game-id="match.gameId"
                :class="{ 'is-selected': match.gameId === selectedId }"
                :aria-pressed="match.gameId === selectedId"
                aria-controls="match-debrief"
                @click="emit('select', match.gameId)"
            >
                <span class="match-date">
                    <time :datetime="new Date(match.completedAt).toISOString()">{{ journalDate(match.completedAt) }}</time>
                    <span>{{ journalTime(match.completedAt) }}</span>
                </span>
                <span class="match-score" data-testid="journal-match-score">{{ journalNumber(match.totalScore) }} <small>pts</small></span>
                <span class="match-meta">
                    <span>{{ match.rounds.length }} rounds</span>
                    <span>Place {{ match.rank }} / {{ match.participants }}</span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.5" /></svg>
                </span>
            </button>
        </li>
    </ol>
</template>

<script setup lang="ts">
import type { JournalMatch } from "~/types/journal";
import { journalDate, journalNumber, journalTime } from "./format";

defineProps<{ matches: readonly JournalMatch[]; selectedId: string | null }>();
const emit = defineEmits<{ select: [gameId: string] }>();
</script>

<style scoped>
.match-list {
    display: grid;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
}
.match-button {
    width: 100%;
    min-height: 110px;
    border: 1px solid var(--gb-line);
    border-radius: 12px;
    padding: 1rem 1.1rem;
    background: var(--gb-surface);
    color: var(--gb-text);
    text-align: left;
    transition:
        background 0.15s,
        border-color 0.15s;
}
.match-button:hover {
    background: var(--gb-raised);
    border-color: var(--gb-muted);
}
.match-button.is-selected {
    border-color: var(--gb-accent);
    background: var(--gb-raised);
}
.match-button:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 4px;
}
.match-date,
.match-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    color: var(--gb-muted);
    font-size: 0.78rem;
}
.match-date time {
    color: var(--gb-text);
}
.match-score {
    display: block;
    font-size: 1.75rem;
    font-weight: 650;
    letter-spacing: -0.04em;
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
}
.match-score small {
    font-size: 0.75rem;
    color: var(--gb-muted);
    font-weight: 400;
    letter-spacing: 0.02em;
}
.match-meta {
    justify-content: flex-start;
}
.match-meta > span + span::before {
    content: "·";
    margin-right: 0.6rem;
}
.match-meta svg {
    margin-left: auto;
    width: 16px;
    height: 16px;
    color: var(--gb-accent);
}
@media (prefers-reduced-motion: reduce) {
    .match-button {
        transition: none;
    }
}
</style>
