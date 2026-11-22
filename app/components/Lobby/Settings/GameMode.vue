<template>
    <fieldset>
        <legend class="field-label">Game mode</legend>
        <label class="check-row"><input type="radio" :value="1" v-model="model" />Battle Royale</label
        ><label class="check-row muted"><input type="radio" :value="2" disabled />Country Battle — not available yet</label>
    </fieldset>
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
<style scoped>
fieldset {
    min-width: 0;
    margin: 0;
    border: 0;
    padding: 0;
}
.check-row {
    padding-block: 0.2rem;
    border-bottom: 1px solid var(--gb-line);
}
.check-row:has(:disabled) {
    cursor: not-allowed;
    color: var(--gb-muted);
}
</style>
