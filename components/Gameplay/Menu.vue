<template>
    <div class="flex flex-col md:flex-row justify-between gap-1 flex-wrap w-30 md:w-60">
        <div class="m-auto">
            <p class="text-center">Connection:</p>
            <ConnectionStatus label="Contrast" class="text-center" />
        </div>
        <div class="text-center m-auto">
            <p class="text-center">Round: {{ knobValue }} / {{ lobbySettings?.conf.numRounds }}</p>
            <Button label="Leave" severity="warn" variant="text" raised icon="pi pi-sign-out" pt:label:class="text-xs lg:text-base" size="small" @click="handleButtonClicked" />
        </div>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["leaveLobbyClicked"]);

const handleButtonClicked = () => {
    emit("leaveLobbyClicked");
};

const { lobbySettings } = useLobbyStore();
const gameStore = useGameplayStore();
const knobValue = computed(() => (gameStore.currentRound || 0) + 1);
</script>

<style scoped></style>
