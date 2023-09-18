<template>
    <div>
        <GameplayCountdownView v-show="game_flow === 'STARTING'" />
        <GameplayView />
        <GameplayMidRoundView v-show="game_flow === 'MID-ROUND'" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const game_flow = useGameFlow();
        return { game_flow };
    },
};
</script>

<style scoped></style>
