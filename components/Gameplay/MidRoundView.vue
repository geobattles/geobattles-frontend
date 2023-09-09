<template>
    <div id="midround_container">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">Name</th>
                        <th scope="col" class="px-6 py-3">Lives</th>
                        <th scope="col" class="px-6 py-3">Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(value, index) in results">
                        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ index }}</th>
                        <td class="px-6 py-4">{{ value.lives }}</td>
                        <td class="px-6 py-4">{{ value.baseScr }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div>
            <button @click="nextRound">Next round</button>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const results = useResults();

        onMounted(() => {});
        return { results, nextRound };
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
</style>
