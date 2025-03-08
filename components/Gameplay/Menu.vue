<template>
    <div class="flex flex-col justify-around gap-1 flex-wrap">
        <p class="text-center">Round: {{ knobValue }} / {{ lobbyStore.lobbySettings?.conf.numRounds }}</p>
        <Button label="Leave" severity="warn" variant="text" raised icon="pi pi-sign-out" pt:label:class="text-xs lg:text-base" size="small" @click="handleButtonClicked" />
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["leaveLobbyClicked"]);

const handleButtonClicked = () => {
    emit("leaveLobbyClicked");
};

const lobbyStore = useLobbyStore();
const gameMode = useGameMode();
const knobValue = computed(() => (gameMode.modeLogic.currentRound || 0) + 1);
</script>

<style scoped></style>
