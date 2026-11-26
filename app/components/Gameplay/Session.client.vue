<template>
    <GameplayViewsSpectatorView
        v-if="lobbySettings?.spectating"
        :key="lobbySettings.gameId"
        :snapshot="lobbySettings"
        @leaveLobby="emit('leaveLobby')"
        @connection-target="watchConnectionTarget = $event"
    />
    <template v-else>
        <Transition name="round-reveal" :css="game.modeLogic.currentState === 'PLAYING'">
            <GameplayViewsCountdownView v-if="countdown" :key="game.modeLogic.currentRound" :remaining="countdown" />
        </Transition>
        <GameplayViewsGameplayView v-show="roundRunning" :inert="!!countdown" @leaveLobby="emit('leaveLobby')" @connectionTarget="mapConnectionTarget = $event" />
        <GameplayViewsMidRoundView v-show="game.modeLogic.currentState === 'MID-ROUND'" @leaveLobby="emit('leaveLobby')" @connection-target="recapConnectionTarget = $event" />
        <GameplayViewsEndGameView v-show="game.modeLogic.currentState === 'FINISHED'" @leaveLobby="emit('leaveLobby')" @connection-target="journeyConnectionTarget = $event" />
    </template>
    <div :class="{ 'page-shell connection-entry': !retained }">
        <SocketSessionFeedback :retained="retained" gameplay :round-running="roundRunning" :banner-target="bannerTarget" @leaveLobby="emit('leaveLobby')" />
    </div>
</template>
<script setup lang="ts">
const props = defineProps<{ container: HTMLElement | null }>();
const emit = defineEmits<{ leaveLobby: [] }>();
// This setup runs only in the browser; the route page keeps its SSR shell and guard.
const game = useGameMode();
const ui = useUIManagerStore();
const route = useRoute();
const { lobbySettings } = useLobbyState();
const retained = computed(
    () => !!lobbySettings.value && lobbySettings.value.ID === routeLobbyId(route) && (lobbySettings.value.spectating || game.modeLogic.currentState !== "WAITING")
);
const roundRunning = computed(() => game.modeLogic.currentState === "PLAYING" || game.modeLogic.currentState === "STARTING");
const { countdownRemaining } = useNuxtApp().$gameRuntime.battleRoyale;
const countdown = computed(() => (game.modeLogic.currentState === "STARTING" ? countdownRemaining.value : null));
const mapConnectionTarget = shallowRef<HTMLElement | null>(null);
const recapConnectionTarget = shallowRef<HTMLElement | null>(null);
const journeyConnectionTarget = shallowRef<HTMLElement | null>(null);
const watchConnectionTarget = shallowRef<HTMLElement | null>(null);
const bannerTarget = computed(() => {
    if (lobbySettings.value?.spectating) return watchConnectionTarget.value;
    if (roundRunning.value) return mapConnectionTarget.value;
    return game.modeLogic.currentState === "FINISHED" ? journeyConnectionTarget.value : recapConnectionTarget.value;
});
watch(
    () => props.container,
    (container) => ui.setGameplayPageContainer(container),
    { flush: "post" }
);
onMounted(() => {
    ui.setGameplayPageContainer(props.container);
});
onBeforeUnmount(() => {
    ui.setGameplayPageContainer(null);
});
</script>
<style scoped>
.connection-entry {
    padding-block: clamp(1rem, 10vh, 6rem);
}
</style>
