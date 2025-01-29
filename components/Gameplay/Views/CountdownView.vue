<template>
    <div class="content">
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
import { ref, computed, onMounted, onUnmounted } from "vue";

// Reactive state and store dependencies
const counter = ref<number>(3);
let intervalId: ReturnType<typeof setInterval> | null = null;

// Store references
const { lobbySettings } = useLobbyStore();
const gameStore = useGameplayStore();

// Computed properties
const knobValue = computed(() => (gameStore.currentRound || 0) + 1);

// Function to handle countdown logic
const startCountdown = () => {
    intervalId = setInterval(() => {
        if (counter.value > 1) {
            counter.value--;
        } else {
            clearInterval(intervalId!); // Stop countdown when it reaches 0
            intervalId = null;
        }
    }, 1000);
};

// Lifecycle hooks
onMounted(() => {
    startCountdown();
});

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId); // Cleanup interval on unmount
});
</script>

<style scoped>
.content {
    position: fixed;
    top: 0;
    left: 0;
    width: 100dvw;
    height: 100dvh;
    z-index: 9999;

    color: var(--p-primary-400);
    background-color: var(--p-surface-950);

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
