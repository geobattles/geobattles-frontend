<template>
    <div class="table-scroll">
        <table class="data-table total-table">
            <caption class="sr-only">
                Expedition leaderboard
            </caption>
            <thead>
                <tr>
                    <th scope="col">Place</th>
                    <th scope="col">Explorer</th>
                    <th scope="col" class="numeric">Total points</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in ranked" :key="row.id" :class="{ 'leader-row': row.rank === 1, 'own-row': row.id === player.ID }">
                    <td class="rank">
                        <span class="rank-number">{{ String(row.rank).padStart(2, "0") }}</span
                        ><UiIcon v-if="row.rank === 1" name="trophy" />
                    </td>
                    <td>
                        <span class="player-identity"
                            ><span class="player-swatch" :style="{ backgroundColor: getPlayerColorByID(row.id) }" />{{ getPlayerNameFromID(row.id)
                            }}<span v-if="row.id === player.ID" class="self-label">(you)</span></span
                        >
                    </td>
                    <td class="numeric score">{{ row.result.total ?? 0 }}</td>
                </tr>
            </tbody>
        </table>
        <p v-if="!ranked.length" class="muted mt-4">No scored rounds yet.</p>
    </div>
</template>
<script setup lang="ts">
const results = useResultsStore();
const player = usePlayerInfo();
const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
const ranked = computed(() => {
    const rows = Object.entries(results.totalResults).sort(([, a], [, b]) => (b.total ?? 0) - (a.total ?? 0));
    let rank = 0;
    let previous: number | undefined;
    return rows.map(([id, result], index) => {
        const score = result.total ?? 0;
        if (score !== previous) rank = index + 1;
        previous = score;
        return { id, result, rank };
    });
});
</script>
<style scoped>
.total-table {
    font-size: 0.85rem;
}
.total-table th {
    background: #1e201e;
}
.rank {
    width: 4.75rem;
    color: var(--gb-muted);
    font: 600 0.8rem var(--gb-font-mono);
    white-space: nowrap;
}
.rank-number {
    display: inline-grid;
    place-items: center;
    min-width: 1.6rem;
    min-height: 1.6rem;
}
.rank svg {
    margin-left: 0.3rem;
    width: 14px;
    height: 14px;
    color: var(--gb-accent);
}
.score {
    color: var(--gb-text);
    font-weight: 700;
    font-size: 1.05rem;
}
.leader-row {
    background: color-mix(in srgb, var(--gb-accent) 7%, var(--gb-surface));
}
.leader-row .score,
.leader-row .rank-number {
    color: var(--gb-accent);
}
.leader-row .rank-number {
    background: #b6e38812;
}
.own-row .player-identity {
    font-weight: 700;
}
.self-label {
    color: var(--gb-muted);
    font-size: 0.68rem;
    font-weight: 400;
}
@media (max-width: 850px), (pointer: coarse), (max-height: 600px) and (orientation: landscape) {
    .total-table {
        font-size: 0.78rem;
    }
    .total-table :is(td, th) {
        padding: 0.6rem 0.35rem;
    }
    .total-table .player-identity {
        flex-wrap: wrap;
        gap: 0.3rem;
    }
    .rank {
        width: 3.75rem;
    }
    .score {
        font-size: 0.95rem;
    }
}
</style>
