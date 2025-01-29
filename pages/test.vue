<template>
    <div class="game-container">
        <Button @click="handleClick" label="Test" />
    </div>
</template>

<script setup lang="ts">
const gameplayStore = useGameplayStore();

onMounted(() => {
    gameplayStore.initializeGameplay();
});

const handleClick = () => {
    gameplayStore.startRound();
    console.log(gameplayStore.currentRound);
};
</script>
