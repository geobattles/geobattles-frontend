<template>
    <div class="field number-setting" data-viewport-field>
        <div class="number-heading">
            <label :for="inputId">{{ label }}</label>
            <span class="number-bounds" :id="`${inputId}-bounds`">{{ min }}–{{ max }}</span>
        </div>
        <div class="number-stepper">
            <button type="button" :aria-label="`Decrease ${label.toLowerCase()}`" :disabled="model <= min" @click="step(-1)"><span aria-hidden="true">−</span></button>
            <input
                :id="inputId"
                ref="input"
                v-model.number="model"
                class="input number-input"
                type="number"
                :min="min"
                :max="max"
                step="1"
                required
                inputmode="numeric"
                enterkeyhint="done"
                :aria-describedby="`${inputId}-bounds`"
            />
            <button type="button" :aria-label="`Increase ${label.toLowerCase()}`" :disabled="model >= max" @click="step(1)"><span aria-hidden="true">+</span></button>
        </div>
    </div>
</template>
<script setup lang="ts">
defineProps<{ inputId: string; label: string; min: number; max: number }>();
const model = defineModel<number>({ required: true });
const input = ref<HTMLInputElement | null>(null);
function step(direction: number) {
    const field = input.value;
    if (!field || field.matches(":disabled")) return;
    if (direction > 0) field.stepUp();
    else field.stepDown();
    if (Number.isFinite(field.valueAsNumber)) model.value = field.valueAsNumber;
}
</script>
<style scoped>
.number-setting {
    min-width: 0;
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.2rem 0.75rem;
    padding-block: 0.15rem;
    border-bottom: 1px solid var(--gb-line);
}
.number-heading {
    display: flex;
    align-items: baseline;
    flex: 1 1 8rem;
    flex-wrap: wrap;
    gap: 0.15rem 0.5rem;
}
.number-heading label {
    font-weight: 700;
}
.number-bounds {
    color: var(--gb-muted);
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
}
.number-stepper {
    display: grid;
    grid-template-columns: 44px minmax(44px, 1fr) 44px;
    width: 9rem;
    max-width: 100%;
}
.number-stepper button {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: transparent;
    color: var(--gb-accent);
    font-size: 1.25rem;
    font-weight: 700;
    cursor: pointer;
}
.number-stepper button:hover:not(:disabled) {
    background: var(--gb-raised);
}
.number-stepper button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.number-stepper > input.number-input {
    min-width: 0;
    min-height: 44px;
    padding: 0.4rem 0.15rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 0 -1px var(--gb-success);
    text-align: center;
    font-size: 1rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    appearance: textfield;
    -moz-appearance: textfield;
}
.number-input::-webkit-inner-spin-button,
.number-input::-webkit-outer-spin-button {
    margin: 0;
    -webkit-appearance: none;
}
.number-stepper :focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 2px;
}
</style>
