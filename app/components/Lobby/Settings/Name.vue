<template>
    <label class="name-setting" for="lobby-name" data-viewport-field>
        <span class="name-label">Lobby name</span>
        <input id="lobby-name" v-model="model" type="text" required maxlength="80" placeholder="Name your lobby" autocapitalize="sentences" enterkeyhint="done" />
        <span class="name-pencil" aria-hidden="true"><UiIcon name="pencil" /></span>
    </label>
</template>
<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>
<style scoped>
.name-setting {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px;
    align-items: center;
    border-bottom: 1px solid var(--gb-line);
    cursor: text;
}
.name-label {
    grid-column: 1;
    font: 600 0.75rem var(--gb-font-mono);
    color: var(--gb-muted);
    letter-spacing: 0.04em;
}
.name-setting input {
    grid-column: 1;
    min-width: 0;
    width: 100%;
    min-height: 44px;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--gb-text);
}
.name-pencil {
    grid-column: 2;
    grid-row: 1 / 3;
    display: grid;
    min-height: 44px;
    place-items: center;
    color: var(--gb-accent);
}
.name-setting:focus-within {
    border-color: var(--gb-success);
}
.name-setting input:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: -2px;
}
</style>
