<template>
    <div ref="progress_bar" id="progress-bar">
        <audio ref="refSound">
            <source src="/sounds/clock-tick.mp3" type="audio/mpeg" />
        </audio>
        <Knob v-model="countdown" class="p-2" :valueTemplate="valueTemplate" :size="knobSize" :min="0" :max="roundTime" :valueColor="countdownColor" readonly />
    </div>
</template>

<script setup lang="ts">
const { countdown, roundTime, countdownColor, knobSize, valueTemplate, refSound } = useTimer();
</script>

<style scoped>
#progress-bar {
    background-color: var(--surface-background);
    border-radius: 50%;
    width: fit-content;
}
</style>
