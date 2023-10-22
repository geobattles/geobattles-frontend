<template>
    <div id="midround_container">
        <div class="midround-content">
            <div class="total-result-table">
                <GameplayTotalStatistics />
            </div>
            <div class="midround-menu">
                <button @click="next_round" type="button" class="btn btn-blue">Next round</button>
            </div>
        </div>
        <div class="google-map-window">
            <!-- *GoogleMap gets appended here when gameFlow changed to MID-ROUND -->
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const total_results = useTotalResults();
        const next_round = Gameplay.nextRound;
        const game_type = useGameType();

        onMounted(() => {});
        return { total_results, next_round, game_type };
    },
};
</script>

<style scoped>
#midround_container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2;
    background-color: rgb(220, 220, 220);

    /* overflow: hidden; */
    display: flex;
    flex-direction: row;
}

.midround-content {
    background-color: blue;
    flex: 30%;
}

.google-map-window {
    flex: 70%;
    background-color: aquamarine;

    overflow: hidden;
}

.midround-menu {
    z-index: 1;
    color: black;
    /* position: relative; */
}

.total-result-table {
    background-color: white;
    color: black;

    z-index: 1;
}
</style>
