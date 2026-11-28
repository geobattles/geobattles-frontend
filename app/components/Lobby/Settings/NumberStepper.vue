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
    gap: 0.3rem 0.65rem;
    padding: 0.42rem 0.65rem;
    border: 1px solid #9be0a52e;
    border-radius: 0.78rem;
    background: #06241ecc;
}
.number-heading {
    display: flex;
    align-items: center;
    flex: 1 1 7rem;
    flex-wrap: wrap;
    gap: 0.22rem 0.45rem;
}
.number-heading label {
    font-size: 0.8rem;
    font-weight: 740;
    color: #eef9ef;
}
.number-bounds {
    padding: 0.06rem 0.4rem;
    border-radius: 999px;
    background: #b6efa314;
    color: #aac9ba;
    font-size: 0.64rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}
.number-stepper {
    display: grid;
    grid-template-columns: 34px minmax(42px, 1fr) 34px;
    align-items: center;
    width: 7.4rem;
    max-width: 100%;
    padding: 0.14rem;
    border: 1px solid #8ddbaf44;
    border-radius: 999px;
    background: #041d19d9;
}
.number-stepper button {
    min-width: 34px;
    min-height: 34px;
    border: 0;
    border-radius: 50%;
    background: #a4ecd316;
    color: #c8f994;
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
}
.number-stepper button:hover:not(:disabled) {
    background: #a4ecd32e;
}
.number-stepper button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}
.number-stepper > input.number-input {
    min-width: 0;
    min-height: 34px;
    padding: 0.1rem 0.15rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    text-align: center;
    color: #f4fbf3;
    font-size: 0.92rem;
    font-weight: 800;
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
