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
    padding: 0.42rem 0.65rem;
    border: 1px solid #9be0a52e;
    border-radius: 0.78rem;
    background: #06241ecc;
}
.timer-setting :deep(.number-setting) {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
}
.timer-presets {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.3rem;
    max-width: 18rem;
}
.timer-presets button {
    min-width: 36px;
    min-height: 32px;
    padding-inline: 0.3rem;
    border: 1px solid #8ddbaf38;
    border-radius: 999px;
    background: #0a2e25c8;
    color: #d6ede2;
    font-size: 0.74rem;
    font-weight: 740;
    font-variant-numeric: tabular-nums;
}
.timer-presets button[aria-pressed="true"] {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
}
.timer-presets button:hover:not(:disabled):not([aria-pressed="true"]) {
    border-color: #b7f98670;
    background: #144336;
}
.timer-setting :is(button, input):focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 2px;
}
@container timer-editor (max-width: 200px) {
    .timer-presets {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
