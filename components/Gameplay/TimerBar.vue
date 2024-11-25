<template>
    <div ref="progress_bar" id="progress-bar">
        <audio ref="ref_sound">
            <source src="/sounds/clock-tick.mp3" type="audio/mpeg" />
        </audio>
        <div id="bar" ref="bar_ref" data-style="smooth" :style="{ '--duration': lobbySettings?.conf.roundTime, '--delay': lobbySettings?.conf.roundTime ?? 0 - timer_sound }">
            <div></div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { lobbySettings } = useLobbyStore();
const timer_sound = ref(10); // Default timer sound starts 10s before round ends

// Template refs
const progress_bar = ref<HTMLElement | null>(null);
const ref_sound = ref<HTMLAudioElement | null>(null);
const bar_ref = ref<HTMLElement | null>(null);

// Timers
let interval_id: NodeJS.Timeout;
let timeout_id: NodeJS.Timeout;

onMounted(() => {
    if (!lobbySettings) return console.error("Lobby settings are not set!");
    if (!lobbySettings.conf.roundTime) return console.error("Round time is not set in lobbySettings!");

    // Default tick-tock is 10s before end. If round time is less than 20s, then tick-tock is 5s before end.
    if (lobbySettings.conf.roundTime <= 20) timer_sound.value = 5;

    // Start timer after (roundTime - timer_sound) seconds
    timeout_id = setTimeout(() => {
        interval_id = setInterval(() => ref_sound.value?.play(), 1000); // Tick on every second after timeout
    }, (lobbySettings.conf.roundTime - timer_sound.value) * 1000);
});

onUnmounted(() => {
    clearTimeout(timeout_id);
    clearInterval(interval_id);
});
</script>

<style scoped>
#progress-bar {
    position: absolute;
    top: 2rem;
    background-color: #ddd;

    width: 40%;

    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;

    border: 4px solid var(--p-surface-900);

    border-radius: 5px;

    z-index: 3;
}

#bar div {
    height: 8px;
    background: linear-gradient(to bottom, var(--p-primary-400), var(--p-primary-600));

    border-radius: 3px;

    transform-origin: left center;
}

/* For smoother animation */
#bar[data-style="smooth"] div {
    animation: roundtime calc(var(--duration) * 1s) linear forwards, ticking 1s linear calc(var(--delay) * 1s) 10;
}
@keyframes ticking {
    75% {
        background: var(--p-red-400);
    }
    100% {
        background: var(--p-red-400);
    }
}

@keyframes roundtime {
    to {
        /* More performant than animating `width` */
        transform: scaleX(0);
    }
}
</style>
