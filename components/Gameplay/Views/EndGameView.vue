<template>
    <div id="end_game_container">
        <div class="results-section">
            <div>Show first three places with trophy</div>
            <div class="total-result-table">
                <GameplayTotalStatistics />
            </div>
        </div>
        <div class="endgame-menu">
            <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2">New Game</button>
            <LobbyDisplaySettings />
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const total_results = useTotalResults();

        onMounted(() => {});
        return { total_results };
    },
};
</script>

<style scoped>
#end_game_container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    background-color: white;

    display: flex;
    align-items: center;
    margin: auto;
}

.endgame-menu {
    z-index: 1;
    color: black;
    /* position: relative; */

    display: flex;
    flex-direction: column;

    min-width: 500px;
}

.total-result-table {
    min-width: 600px;
    z-index: 1;
}
</style>
