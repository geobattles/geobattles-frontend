<template>
    <div id="midround_container">
        <div class="midround-content">
            <div class="total-result-table">
                <GameplayTotalStatistics />
            </div>
            <div class="midround-menu">
                <Button @click="next_round" label="Next Round" icon="pi pi-forward" severity="warning" outlined />
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
    background-color: var(--p-zinc-900);

    overflow: hidden;
    display: flex;
    flex-direction: row;
}

.midround-content {
    flex: 30%;

    margin: 10px;
}

.google-map-window {
    flex: 70%;

    overflow: hidden;
}
</style>
