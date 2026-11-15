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
