<template>
    <div id="midround_container">
        <div class="total-result-table relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">Name</th>
                        <th scope="col" class="px-6 py-3">Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(value, index) in total_results">
                        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ index }}</th>
                        <td class="px-6 py-4">{{ value.total || 0 }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="midround-menu">
            <button @click="next_round" type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2">Next round</button>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const total_results = useTotalResults();
        const next_round = Gameplay.nextRound;

        onMounted(() => {});
        return { total_results, next_round };
    },
};
</script>

<style scoped>
#midround_container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    background-color: white;
}

.midround-menu {
    z-index: 1;
    color: black;
    position: relative;
}

.total-result-table {
    @apply max-w-lg;
    z-index: 1;
}
</style>
