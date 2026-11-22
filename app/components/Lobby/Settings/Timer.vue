<template>
    <div class="timer-setting" @keydown.enter="preventInputSubmit">
        <LobbySettingsNumberStepper
            input-id="round-timer-seconds"
            label="Time in seconds"
            :model-value="draft"
            :min="minimum"
            :max="maximum"
            @update:model-value="setTime"
            @focusout="restoreInvalidTime"
        />
        <div class="timer-presets" role="group" aria-label="Round time presets">
            <button v-for="seconds in presets" :key="seconds" type="button" :aria-pressed="draft === seconds" @click="setTime(seconds)">{{ seconds }}s</button>
        </div>
        <label class="timer-range-label" for="round-timer">Round timer adjustment</label>
        <input id="round-timer" :value="model" type="range" :min="minimum" :max="maximum" step="1" @input="setTime(($event.target as HTMLInputElement).valueAsNumber)" />
        <p v-if="!validDraft" class="field-help">Choose a whole number from {{ minimum }} to {{ maximum }} seconds.</p>
    </div>
</template>

<script setup lang="ts">
const model = defineModel<number>({ required: true });
const draft = ref(model.value);
const minimum = 20;
const maximum = 200;
const presets = [30, 60, 90, 120];
const validDraft = computed(() => Number.isInteger(draft.value) && draft.value >= minimum && draft.value <= maximum);

watch(model, (value) => {
    draft.value = value;
});
function setTime(value: number) {
    draft.value = value;
    if (validDraft.value) model.value = value;
}
function restoreInvalidTime() {
    if (!validDraft.value) draft.value = model.value;
}
function preventInputSubmit(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement) event.preventDefault();
}
</script>

<style scoped>
.timer-setting {
    container: timer-editor / inline-size;
    display: grid;
    gap: 0.35rem;
    min-width: 0;
    padding-block: 0.2rem 0.45rem;
    border-bottom: 1px solid var(--gb-line);
}
.timer-presets {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    max-width: 18rem;
    border-bottom: 1px solid var(--gb-line);
}
.timer-presets button {
    min-width: 44px;
    min-height: 44px;
    padding-inline: 0.25rem;
    color: var(--gb-text);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}
.timer-presets button[aria-pressed="true"] {
    box-shadow: inset 0 -2px var(--gb-success);
    background: var(--gb-raised);
    color: var(--gb-success);
}
.timer-presets button:hover:not(:disabled) {
    box-shadow: inset 0 -2px var(--gb-accent);
}
.timer-setting :is(button, input):focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 2px;
}
.timer-range-label {
    color: var(--gb-muted);
    font-size: 0.75rem;
}
.timer-setting input[type="range"] {
    min-height: 44px;
    margin: 0;
    cursor: pointer;
}
@container timer-editor (max-width: 200px) {
    .timer-presets {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
