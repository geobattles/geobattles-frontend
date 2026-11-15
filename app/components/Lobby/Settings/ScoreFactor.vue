<template>
    <div class="field">
        <label for="score-factor" class="flex justify-between"
            >Score factor <output for="score-factor" class="accent">{{ model }}</output></label
        ><input id="score-factor" type="range" v-model.number="model" min="1" max="500" step="1" aria-describedby="score-factor-help" />
        <p id="score-factor-help" class="field-help">Lower = stricter: points drop faster. Higher = more forgiving: points drop more slowly.</p>
    </div>
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
