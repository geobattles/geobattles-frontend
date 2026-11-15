<template>
    <section v-if="leaders.length" class="winner-summary" aria-label="Expedition winner">
        <div class="winner-place" aria-hidden="true"><UiIcon name="trophy" /><strong>01</strong></div>
        <div class="winner-identity">
            <p class="eyebrow">{{ leaders.length > 1 ? "Shared victory" : "Victory" }}</p>
            <h2>{{ leaders.map(([id]) => getPlayerNameFromID(id)).join(" & ") }}</h2>
            <p class="winner-points">
                <strong>{{ leaders[0]?.[1].total ?? 0 }}</strong> points{{ leaders.length > 1 ? " each · shared first place" : " · first place" }}
            </p>
        </div>
    </section>
</template>
<script setup lang="ts">
defineProps<{ winnerId?: string | null }>();
const results = useResultsStore();
const { getPlayerNameFromID } = usePlayerLookup();
const leaders = computed(() => {
    const entries = Object.entries(results.totalResults);
    const maximum = Math.max(...entries.map(([, row]) => row.total ?? 0));
    return entries.filter(([, row]) => (row.total ?? 0) === maximum);
});
</script>
<style scoped>
.winner-summary {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding-block: 0.25rem 1.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--gb-line);
}
.winner-place {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.2rem;
    flex: none;
    width: 64px;
    min-height: 76px;
    color: var(--gb-accent);
    border: 1px solid var(--gb-accent-end);
    border-radius: 3px;
    background: #b6e38809;
}
.winner-place > svg {
    width: 18px;
    height: 18px;
}
.winner-place > strong {
    font: 700 1.7rem / 1.1 var(--gb-font-mono);
    letter-spacing: -0.08em;
}
.winner-identity {
    min-width: 0;
}
h2 {
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 800;
    overflow-wrap: anywhere;
}
.winner-summary .eyebrow {
    font-size: 0.65rem;
    margin-bottom: 0.4rem;
}
.winner-points {
    color: var(--gb-muted);
    font-size: 0.8rem;
    margin-top: 0.5rem;
}
.winner-points strong {
    color: var(--gb-accent);
    font-family: var(--gb-font-mono);
    font-variant-numeric: tabular-nums;
}
@media (max-width: 850px), (pointer: coarse), (max-height: 600px) and (orientation: landscape) {
    .winner-summary {
        gap: 0.7rem;
        padding-bottom: 0.75rem;
        margin-bottom: 0.75rem;
    }
    .winner-place {
        width: 44px;
        min-height: 54px;
    }
    .winner-place > strong {
        font-size: 1.2rem;
    }
    .winner-place > svg {
        width: 14px;
        height: 14px;
    }
    h2 {
        font-size: 1.2rem;
    }
    .winner-summary .eyebrow {
        margin-bottom: 0.2rem;
    }
    .winner-points {
        margin-top: 0.3rem;
        font-size: 0.75rem;
    }
}
</style>
