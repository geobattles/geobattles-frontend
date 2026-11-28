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
    gap: 0.65rem;
    min-height: 42px;
    padding: 0.42rem 0.65rem;
    justify-content: space-between;
    border: 1px solid #9be0a52b;
    border-radius: 0.78rem;
    background: #06241ecc;
    cursor: pointer;
    transition: border-color 140ms ease;
}
.toggle-setting:has(input:checked) {
    border-color: #70d9af66;
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
    flex: 0 0 38px;
    height: 22px;
    padding: 2px;
    border: 1px solid #8ddbaf44;
    border-radius: 999px;
    background: #041c18;
    transition:
        background-color 150ms ease,
        border-color 150ms ease;
}
.toggle-track > span {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #8aa89a;
    transition:
        transform 150ms ease,
        background-color 150ms ease;
}
input:checked + .toggle-track {
    order: 1;
    border-color: #b7f986;
    background: #70d9af;
}
input:checked + .toggle-track > span {
    transform: translateX(16px);
    background: #05221a;
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
    font-size: 0.8rem;
    font-weight: 740;
    color: #eef9ef;
}
small {
    display: block;
    margin-top: 0.1rem;
}
</style>
