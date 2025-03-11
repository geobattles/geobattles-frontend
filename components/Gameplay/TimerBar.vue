<template>
    <div ref="progress_bar" id="progress-bar">
        <Knob
            v-model="countdown"
            class="p-2"
            :valueTemplate="valueTemplate"
            :size="knobSize"
            :min="0"
            :max="fullRoundTime"
            :valueColor="countdownColor"
            :textColor="countdownColor"
            :strokeWidth="10"
            pt:root:class="!p-1"
            pt:text:class="!font-bold !text-2xl"
            readonly
        />
    </div>
</template>

<script setup lang="ts">
const { countdown, fullRoundTime, countdownColor, knobSize, valueTemplate } = useTimer();
</script>

<style scoped>
#progress-bar {
    background-color: var(--surface-background);
    border-radius: 100%;
}
</style>
