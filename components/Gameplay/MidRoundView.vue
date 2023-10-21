<template>
    <div id="midround_container">
        <div class="total-result-table">
            <GameplayBattleRoyaleTotalStatistics v-if="game_type === 'BattleRoyale'" />
        </div>
        <div class="midround-menu">
            <button @click="next_round" type="button" class="btn btn-blue">Next round</button>
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
    position: relative;

    background-color: white;
    color: black;

    max-width: 600px;
    z-index: 1;
}
</style>
