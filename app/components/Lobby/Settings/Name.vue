<template>
    <div class="field name-setting">
        <label for="lobby-name">Lobby name</label>
        <input id="lobby-name" v-model="model" class="input name-input" type="text" required maxlength="80" placeholder="Name your lobby" />
    </div>
</template>
<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>
<style scoped>
.name-setting label {
    font-weight: 700;
}
.name-setting .name-input {
    min-height: 44px;
    border: 1px solid var(--gb-line);
    border-radius: 10px;
    background: var(--gb-bg);
    padding: 0.65rem 0.8rem;
    font-size: 1rem;
}
.name-input:focus-visible {
    border-color: var(--gb-accent);
    outline: 2px solid var(--gb-accent);
    outline-offset: 2px;
}
</style>
