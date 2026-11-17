<template>
    <div class="field number-setting">
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
}
.number-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
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
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    border: 1px solid var(--gb-line);
    border-radius: 10px;
    background: var(--gb-bg);
}
.number-stepper:focus-within {
    border-color: var(--gb-accent);
}
.number-stepper button {
    min-width: 44px;
    min-height: 44px;
    border-radius: 9px;
    background: var(--gb-raised);
    color: var(--gb-accent);
    font-size: 1.25rem;
    font-weight: 700;
    cursor: pointer;
}
.number-stepper button:hover:not(:disabled) {
    background: #394536;
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
