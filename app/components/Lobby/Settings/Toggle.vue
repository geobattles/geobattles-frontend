<template>
    <label class="check-row toggle-setting">
        <input type="checkbox" v-model="model" />
        <span class="toggle-track" aria-hidden="true"><span></span></span>
        <span class="toggle-copy"
            ><span class="toggle-label">{{ label }}</span
            ><small v-if="description" class="field-help">{{ description }}</small></span
        >
    </label>
</template>
<script setup lang="ts">
defineProps<{ label: string; description?: string }>();
const model = defineModel<boolean>({ required: true });
</script>
<style scoped>
.toggle-setting {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
    padding: 0.3rem 0;
    justify-content: space-between;
    border-bottom: 1px solid var(--gb-line);
    cursor: pointer;
}
.toggle-setting > input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
}
.toggle-track {
    order: 1;
    display: flex;
    align-items: center;
    flex: 0 0 40px;
    height: 24px;
    padding: 3px;
    border: 1px solid var(--gb-line);
    border-radius: 999px;
    background: var(--gb-surface);
}
.toggle-track > span {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--gb-muted);
}
input:checked + .toggle-track {
    order: 1;
    border-color: var(--gb-accent-end);
    background: var(--gb-success);
}
input:checked + .toggle-track > span {
    transform: translateX(16px);
    background: var(--gb-on-accent);
}
.toggle-setting:has(input:focus-visible) {
    outline: 2px solid var(--gb-accent);
    outline-offset: 2px;
}
.toggle-setting:has(input:disabled) {
    cursor: not-allowed;
}
input:disabled ~ span {
    opacity: 0.55;
}
.toggle-copy {
    min-width: 0;
}
.toggle-label {
    font-weight: 700;
}
small {
    display: block;
    margin-top: 0.15rem;
}
</style>
