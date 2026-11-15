<template>
    <div class="round-timer" data-testid="round-timer" :class="{ 'timer-urgent': countdown <= 15 }">
        <div class="timer-label">
            <UiIcon name="clock" /><span class="sr-only">Time remaining</span><strong>{{ countdown }}<span>s</span></strong>
        </div>
        <progress :value="countdown" :max="Math.max(1, fullRoundTime)" aria-label="Round time remaining">{{ countdown }} seconds</progress>
    </div>
</template>
<script setup lang="ts">
const { countdown, fullRoundTime } = useTimer();
</script>
<style scoped>
.round-timer {
    min-width: 0;
    width: 100%;
    color: var(--gb-accent);
}
.timer-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}
strong {
    font: 700 1.4rem / 1.2 var(--gb-font-mono);
    letter-spacing: -0.06em;
    font-variant-numeric: tabular-nums;
}
strong span {
    font-size: 0.7rem;
    margin-left: 0.15rem;
    letter-spacing: 0;
    color: var(--gb-muted);
}
progress {
    display: block;
    width: 100%;
    height: 3px;
    margin-top: 0.4rem;
    border: 0;
    border-radius: 0;
    appearance: none;
    background: var(--gb-line);
    color: currentColor;
}
progress::-webkit-progress-bar {
    background: var(--gb-line);
}
progress::-webkit-progress-value {
    background: currentColor;
}
progress::-moz-progress-bar {
    background: currentColor;
}
.timer-urgent {
    color: var(--gb-coral);
}
@media (max-width: 760px), (pointer: coarse), (max-height: 600px) and (orientation: landscape) {
    .round-timer {
        min-width: 0;
    }
    .timer-label {
        gap: 4px;
    }
    .timer-label > svg {
        display: none;
    }
    strong {
        font-size: 1.1rem;
    }
    strong span {
        font-size: 0.65rem;
    }
    progress {
        margin-top: 3px;
        height: 2px;
    }
}
</style>
