<template>
    <div class="flex flex-col md:flex-row justify-between gap-1 flex-wrap w-30 md:w-60">
        <div class="m-auto">
            <p class="text-xs text-center text-white">Connection:</p>
            <ConnectionStatus label="Contrast" class="text-center" />
        </div>
        <div class="text-center m-auto">
            <p class="text-xs text-center text-white">Round: {{ knobValue }} / {{ lobbySettings.conf.numRounds }}</p>
            <Button label="Leave" severity="warn" outlined icon="pi pi-sign-out" size="small" @click="handleButtonClicked" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineEmits } from "vue";

const emit = defineEmits(["leaveLobbyClicked"]);

const handleButtonClicked = () => {
    emit("leaveLobbyClicked");
};

const lobbySettings = useLobbySettings();
const gameFlowManager = useGameFlowManager();
const knobValue = computed(() => (gameFlowManager?.value?.gameRound || 0) + 1);
</script>

<style scoped></style>
