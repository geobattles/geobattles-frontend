<template>
    <div>
        <div v-show="game_flow === 'STARTING'">Countdown 3, 2, 1. GO</div>
        <div v-show="game_flow === 'PLAYING'" id="playing">
            <GameplayView />
        </div>
        <div v-show="game_flow === 'MID-ROUND'" id="mid_round" class="gameplay mid-round">
            <GameplayMidRoundView />
        </div>
        <div class="gameplay end-game"></div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const game_flow = useGameFlow();
        onMounted(() => {});

        return { game_flow, submitGuess };
    },
};
</script>

<style scoped>
.gameplay {
    height: 100vh;
    width: 100vw;
}

.playing {
    z-index: 0;
}

.mid-round {
    z-index: 0;
}
</style>
