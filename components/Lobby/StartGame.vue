<template>
    <div>
        <Button v-if="isPlayerAdmin()" @click="handleStartGameButton()" size="large" label="Start Game" icon="pi pi-play-circle" badgeSeverity="contrast" :loading="isPlayNowLoading" />
        <div v-else style="color: white">Waiting for admin to start the game</div>
    </div>
</template>

<script setup lang="ts">
const { isPlayerAdmin } = useLobbyStore();
const gameStore = useGameplayStore();
const isPlayNowLoading = ref(false);

const handleStartGameButton = () => {
    isPlayNowLoading.value = true;
    gameStore.sendStartRoundSocketMessage();
};
</script>

<style scoped></style>
