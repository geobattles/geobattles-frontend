<template>
    <div class="table-scroll">
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
