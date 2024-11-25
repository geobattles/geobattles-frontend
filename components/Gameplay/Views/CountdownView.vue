<template>
    <div class="content">
        <div class="timer">
            <span>
                {{ counter }}
            </span>
        </div>
        <Divider />
        Starting Round
        <Knob v-model="knobValue" :min="0" :max="lobbySettings?.conf.numRounds" readonly />
    </div>
</template>

<script setup lang="ts">
let counter = ref(3);
let interval: string | number | NodeJS.Timeout | undefined;
const { lobbySettings } = useLobbyStore();
const gameFlowManager = useGameFlowManager();
const knobValue = computed(() => (gameFlowManager?.value?.gameRound || 0) + 1);
onMounted(() => {
    interval = setInterval(() => {
        if (counter.value > 1) {
            counter.value--;
        } else {
            clearInterval(interval);
        }
    }, 1000);
});

onUnmounted(() => {
    // Clear interval so it stop counting when unmounted
    clearInterval(interval);
});
</script>

<style scoped>
.content {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    background-color: var(--p-surface-900);
    z-index: 9999;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.timer {
    font-size: 10rem;
    color: var(--p-primary-400);
}
</style>
