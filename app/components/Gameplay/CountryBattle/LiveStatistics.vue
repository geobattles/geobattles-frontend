<template>
    <div class="table-scroll country-timing">
        <p class="notice mb-3">Country Battle is unfinished and is not available for new expeditions.</p>
        <table v-if="Object.keys(results).length" class="data-table">
            <caption class="sr-only">
                Legacy Country Battle results
            </caption>
            <thead>
                <tr>
                    <th scope="col">Explorer</th>
                    <th scope="col" class="numeric">Lives</th>
                    <th scope="col">Countries</th>
                    <th scope="col" class="numeric">Points</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(result, id) in results" :key="id">
                    <td>{{ getPlayerNameFromID(id) }}</td>
                    <td class="numeric">{{ result.lives }}</td>
                    <td>
                        <span v-for="code in result.player_countries" :key="code" class="badge mr-1">{{ flags.get(code)?.name || code }}</span>
                    </td>
                    <td class="numeric">{{ result.baseScr || 0 }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script setup lang="ts">
const results = useLiveResults();
const flags = useCountriesFlagMap();
const { getPlayerNameFromID } = usePlayerLookup();
</script>
<style scoped>
.country-timing {
    background: #101f19;
}
.country-timing .notice {
    margin: 0;
    padding: 0.5rem 0.6rem;
    border: 0;
    border-left: 3px solid var(--gb-accent);
    border-radius: 0;
    background: #1d352a;
    color: #e3ebe1;
    font-size: 0.76rem;
}
.data-table th {
    background: #1c3229;
    color: #b4cabb;
}
.data-table tbody tr:nth-child(even) {
    background: var(--gb-surface);
}
.data-table td {
    overflow-wrap: anywhere;
}
.numeric {
    font-variant-numeric: tabular-nums;
}
.data-table td:last-child {
    color: var(--gb-success);
    font-weight: 700;
}
</style>
