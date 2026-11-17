<template>
    <div ref="root" class="timer-setting" :class="{ 'timer-editing': editing }">
        <div class="timer-heading">
            <div>
                <span class="timer-label">Round timer</span>
                <p class="timer-value">
                    <strong>{{ model }}</strong> <span>seconds / round</span>
                </p>
            </div>
            <button v-if="!editing" ref="editButton" class="timer-edit" type="button" aria-expanded="false" @click="beginEditing">Edit</button>
            <span v-else class="timer-status">Editing time</span>
        </div>
        <div v-if="editing" class="timer-editor" @keydown.enter="preventInputSubmit" @keydown.esc.stop.prevent="cancelEditing">
            <div class="timer-presets" role="group" aria-label="Round time presets">
                <button v-for="seconds in presets" :key="seconds" type="button" :aria-pressed="draft === seconds" @click="draft = seconds">{{ seconds }}s</button>
            </div>
            <LobbySettingsNumberStepper input-id="round-timer-seconds" label="Time in seconds" v-model="draft" :min="20" :max="200" />
            <label class="timer-range-label" for="round-timer">Round timer adjustment</label>
            <input id="round-timer" v-model.number="draft" type="range" min="20" max="200" step="1" aria-describedby="timer-draft-hint" />
            <p id="timer-draft-hint" class="field-help">{{ validDraft ? "Save time to confirm this change." : "Choose a whole number from 20 to 200 seconds." }}</p>
            <div class="timer-actions">
                <button type="button" class="timer-cancel" @click="cancelEditing">Cancel</button>
                <button type="button" class="timer-save" :disabled="!validDraft" @click="saveTime">Save time</button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
const emit = defineEmits<{ editing: [value: boolean] }>();
const root = ref<HTMLDivElement | null>(null);
const editButton = ref<HTMLButtonElement | null>(null);
const editing = ref(false);
const draft = ref(model.value);
const presets = [30, 60, 90, 120];
const validDraft = computed(() => Number.isInteger(draft.value) && draft.value >= 20 && draft.value <= 200);

function isDisabled() {
    return Boolean(root.value?.closest("fieldset:disabled"));
}
async function beginEditing() {
    if (isDisabled()) return;
    draft.value = model.value;
    editing.value = true;
    emit("editing", true);
    await nextTick();
    root.value?.querySelector<HTMLInputElement>("#round-timer-seconds")?.focus();
}
async function finishEditing() {
    editing.value = false;
    emit("editing", false);
    await nextTick();
    editButton.value?.focus();
}
function cancelEditing() {
    if (isDisabled()) return;
    draft.value = model.value;
    void finishEditing();
}
function saveTime() {
    if (isDisabled() || !validDraft.value) return;
    model.value = draft.value;
    void finishEditing();
}
function preventInputSubmit(event: KeyboardEvent) {
    // Enter still activates native buttons, but a number field must not submit the outer settings form.
    if (event.target instanceof HTMLInputElement) {
        event.preventDefault();
        event.stopPropagation();
    }
}
onBeforeUnmount(() => {
    if (editing.value) emit("editing", false);
});
</script>
<style scoped>
.timer-setting {
    min-width: 0;
    padding: 0.85rem;
    border: 1px solid var(--gb-line);
    border-radius: 12px;
    background: var(--gb-bg);
}
.timer-editing {
    border-color: var(--gb-accent-end);
}
.timer-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.timer-label {
    font-weight: 700;
}
.timer-value {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0.2rem 0 0;
}
.timer-value strong {
    color: var(--gb-accent);
    font-size: 1.75rem;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
}
.timer-value span,
.timer-range-label {
    color: var(--gb-muted);
    font-size: 0.75rem;
}
.timer-setting button {
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
}
.timer-edit,
.timer-cancel,
.timer-presets button {
    background: var(--gb-surface);
    color: var(--gb-text);
}
.timer-setting button:hover:not(:disabled) {
    border-color: var(--gb-accent);
}
.timer-setting button:focus-visible,
.timer-setting input:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 2px;
}
.timer-setting button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}
.timer-status {
    color: var(--gb-accent);
    font-size: 0.7rem;
}
.timer-editor {
    container: timer-editor / inline-size;
    display: grid;
    gap: 0.65rem;
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--gb-line);
}
.timer-presets {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.35rem;
}
@container timer-editor (max-width: 200px) {
    .timer-presets {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
.timer-presets button {
    padding-inline: 0.25rem;
    font-variant-numeric: tabular-nums;
}
.timer-presets button[aria-pressed="true"] {
    border-color: var(--gb-accent-end);
    background: var(--gb-raised);
    color: var(--gb-accent);
}
.timer-editor input[type="range"] {
    min-height: 44px;
    margin-block: -0.5rem;
    cursor: pointer;
}
.timer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}
.timer-save {
    background: var(--gb-accent);
    color: var(--gb-on-accent);
}
</style>
