<template>
    <div class="countdown-container">
        <!-- Countdown Timer -->
        <div class="timer">
            <span>{{ counter }}</span>
        </div>

        <Divider />

        <!-- Round Info -->
        <p>Starting Round</p>
        <Knob v-model="knobValue" :min="0" :max="lobbySettings?.conf.numRounds" readonly />
    </div>
</template>

<script setup lang="ts">
const COUNTDOWN_SECONDS = 3;
const { counter, startCountdown } = useCountdown(COUNTDOWN_SECONDS);

// Store references
const { lobbySettings } = useLobbyStore();
const gameMode = useGameMode();

// Computed properties
const knobValue = computed(() => (gameMode.modeLogic.currentRound || 0) + 1);

// Lifecycle hooks
onMounted(() => {
    startCountdown();
});
</script>

<style scoped>
.countdown-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100dvw;
    height: 100dvh;
    z-index: 9999;

    color: var(--p-primary-400);
    background-color: var(--surface-background);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.timer {
    font-size: 10rem;
    color: var(--p-primary-400);
    margin-bottom: 1rem;
}

@media (max-width: 1024px) {
    .timer {
        font-size: 5rem;
    }
}

p {
    margin: 1rem 0;
    text-align: center;
}
</style>
