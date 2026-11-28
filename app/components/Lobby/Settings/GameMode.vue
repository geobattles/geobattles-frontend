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
    display: grid;
    gap: 0.32rem;
    min-width: 0;
    margin: 0;
    border: 0;
    padding: 0;
}
legend {
    margin-bottom: 0.25rem;
    color: #aac9ba;
    font-size: 0.72rem;
    font-weight: 720;
}
.check-row {
    min-height: 38px;
    padding: 0.38rem 0.65rem;
    border: 1px solid #9be0a52b;
    border-radius: 0.78rem;
    background: #06241ecc;
    font-size: 0.8rem;
    font-weight: 700;
    color: #eef9ef;
}
.check-row:has(:checked) {
    border-color: #b7f98688;
    background: linear-gradient(105deg, #214a35d8, #0b2d24e0);
}
.check-row:has(:disabled) {
    cursor: not-allowed;
    color: #88a698;
    background: #051d18a8;
}
</style>
