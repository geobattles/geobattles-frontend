<template>
    <div id="end_game_container">
        <div class="results-section">
            <div class="total-result-table">
                <GameplayTotalStatistics />
            </div>
        </div>
        <div class="endgame-menu">
            <Button type="button" label="NEXT GAME" />
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
    background-color: var(--surface-ground);

    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto;
    gap: 20px;
    flex-wrap: wrap;
}

.endgame-menu {
    flex: 50%;
    z-index: 1;
    color: black;

    display: flex;
    flex-direction: column;
    gap: 10px;

    width: 100%;
    max-width: 400px;
}

.results-section {
    flex: 50%;

    width: 100%;
    max-width: 400px;
    z-index: 1;
}
</style>
