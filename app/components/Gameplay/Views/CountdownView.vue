<template>
    <div class="countdown-screen" role="status" aria-live="polite">
        <p class="eyebrow">Eyes on the horizon</p>
        <h2>Round {{ lobby.lobbySettings?.currentRound }} / {{ lobby.lobbySettings?.conf.numRounds }}</h2>
        <p class="countdown-number">{{ counter > 0 ? counter : "Go" }}</p>
        <p class="muted">Take a breath. Look for the small details.</p>
    </div>
</template>
<script setup lang="ts">
const lobby = useLobbyStore();
const { counter, startCountdown } = useCountdown(3);
onMounted(startCountdown);
</script>
<style scoped>
.countdown-screen {
    position: fixed;
    z-index: 100;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: var(--gb-bg);
    padding: 2rem;
    text-align: center;
}
.countdown-number {
    font-size: clamp(5rem, 18vw, 10rem);
    line-height: 1.5;
    font-weight: 700;
    color: var(--gb-accent);
    font-variant-numeric: tabular-nums;
}
</style>
