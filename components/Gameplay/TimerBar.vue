<template>
    <div ref="progress_bar" id="progress-bar">
        <audio ref="ref_sound">
            <source src="/sounds/clock-tick.mp3" type="audio/mpeg" />
        </audio>
        <Knob v-model="countdown" class="p-2" :valueTemplate="valueTemplate" :size="knobSize" :min="0" :max="roundTime" :valueColor="countdownColor" readonly />
    </div>
</template>

<script setup lang="ts">
// State and refs
const { lobbySettings } = useLobbyStore();
const screenWidth = ref(window.innerWidth);
const countdown = ref(lobbySettings?.conf.roundTime ?? 0);
const timerSoundThreshold = ref(10);
const ref_sound = ref<HTMLAudioElement | null>(null);

// Computed properties
const roundTime = computed(() => lobbySettings?.conf.roundTime ?? 0);
const countdownColor = ref("var(--p-primary-500)");
const knobSize = computed(() => (screenWidth.value > 1024 ? 80 : 50));
const valueTemplate = (value: number) => `${value}s`;

// Utility function
function startCountdown() {
    const start = Date.now();
    return setInterval(() => {
        const delta = Date.now() - start;
        countdown.value = Math.max(roundTime.value - Math.floor(delta / 1000), 0);
    }, 1000);
}

// Timers
let intervalSound: ReturnType<typeof setInterval>;
let intervalCountdown: ReturnType<typeof setInterval>;
let timeoutSound: ReturnType<typeof setTimeout>;

onMounted(() => {
    if (!lobbySettings || !lobbySettings.conf.roundTime) {
        console.error("Lobby settings or round time are not set!");
        return;
    }

    // Adjust sound timer threshold for short rounds
    if (roundTime.value <= 20) timerSoundThreshold.value = 5;

    // Start tick-tock sound (at 10s remaining or 5 for short rounds)
    timeoutSound = setTimeout(() => {
        intervalSound = setInterval(() => ref_sound.value?.play(), 1000);
        countdownColor.value = "var(--p-red-600)";
    }, (roundTime.value - timerSoundThreshold.value) * 1000);

    // Start countdown
    intervalCountdown = startCountdown();

    // Listen for window resize
    const resizeListener = () => (screenWidth.value = window.innerWidth);
    window.addEventListener("resize", resizeListener);

    // Cleanup on unmount
    onUnmounted(() => {
        clearTimeout(timeoutSound);
        clearInterval(intervalSound);
        clearInterval(intervalCountdown);
        window.removeEventListener("resize", resizeListener);
    });
});
</script>

<style scoped>
#progress-bar {
    background-color: var(--p-surface-900);
    border-radius: 50%;
    width: fit-content;
}
</style>
