<template>
    <GameplayViewsCountdownView v-if="game.modeLogic.currentState === 'STARTING'" />
    <GameplayViewsGameplayView v-show="roundRunning" @leaveLobby="emit('leaveLobby')" @connectionTarget="mapConnectionTarget = $event" />
    <GameplayViewsMidRoundView v-show="game.modeLogic.currentState === 'MID-ROUND'" @leaveLobby="emit('leaveLobby')" />
    <GameplayViewsEndGameView v-show="game.modeLogic.currentState === 'FINISHED'" @leaveLobby="emit('leaveLobby')" />
    <GameplayMapRecovery v-if="['MID-ROUND', 'FINISHED'].includes(game.modeLogic.currentState)" />
    <div :class="{ 'page-shell connection-entry': !retained }">
        <SocketSessionFeedback
            :retained="retained"
            gameplay
            :round-running="roundRunning"
            :banner-target="roundRunning ? mapConnectionTarget : null"
            @leaveLobby="emit('leaveLobby')"
        />
    </div>
</template>
<script setup lang="ts">
const props = defineProps<{ container: HTMLElement | null }>();
const emit = defineEmits<{ leaveLobby: [] }>();
// This setup runs only in the browser; the route page keeps its SSR shell and guard.
const game = useGameMode();
const ui = useUIManagerStore();
const toast = useToast();
const route = useRoute();
const { lobbySettings } = useLobbyState();
const retained = computed(() => !!lobbySettings.value && lobbySettings.value.ID === routeLobbyId(route) && game.modeLogic.currentState !== "WAITING");
const roundRunning = computed(() => game.modeLogic.currentState === "PLAYING" || game.modeLogic.currentState === "STARTING");
const mapConnectionTarget = shallowRef<HTMLElement | null>(null);
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
<style scoped>
.connection-entry {
    padding-block: clamp(1rem, 10vh, 6rem);
}
</style>
