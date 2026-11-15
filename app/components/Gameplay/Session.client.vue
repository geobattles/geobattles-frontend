<template>
    <GameplayViewsCountdownView v-if="game.modeLogic.currentState === 'STARTING'" />
    <GameplayViewsGameplayView v-show="game.modeLogic.currentState === 'PLAYING' || game.modeLogic.currentState === 'STARTING'" @leaveLobby="emit('leaveLobby')" />
    <GameplayViewsMidRoundView v-show="game.modeLogic.currentState === 'MID-ROUND'" @leaveLobby="emit('leaveLobby')" />
    <GameplayViewsEndGameView v-show="game.modeLogic.currentState === 'FINISHED'" @leaveLobby="emit('leaveLobby')" />
    <GameplayMapRecovery v-if="['MID-ROUND', 'FINISHED'].includes(game.modeLogic.currentState)" />
    <div v-if="game.modeLogic.currentState === 'WAITING'" class="page-shell">
        <p class="eyebrow">Rejoining the expedition</p>
        <h1>Restoring your place.</h1>
        <p class="muted mt-4">Waiting for the server to confirm the current round.</p>
    </div>
    <GameplayLostConnectionDialog @leaveLobby="emit('leaveLobby')" />
</template>
<script setup lang="ts">
const props = defineProps<{ container: HTMLElement | null }>();
const emit = defineEmits<{ leaveLobby: [] }>();
// This setup runs only in the browser; the route page keeps its SSR shell and guard.
const game = useGameMode();
const ui = useUIManagerStore();
const toast = useToast();
const playerLeft = (event: CustomEvent<{ playerName: string; disconnected: boolean }>) => {
    toast.add({
        severity: event.detail.disconnected ? "warn" : "info",
        summary: `${event.detail.playerName} ${event.detail.disconnected ? "is reconnecting" : "left the expedition"}`,
        life: 5000,
    });
};
watch(
    () => props.container,
    (container) => ui.setGameplayPageContainer(container),
    { flush: "post" }
);
onMounted(() => {
    ui.on("showPlayerLeftToast", playerLeft);
    ui.setGameplayPageContainer(props.container);
});
onBeforeUnmount(() => {
    ui.off("showPlayerLeftToast", playerLeft);
    ui.setGameplayPageContainer(null);
});
</script>
