<template>
    <div class="field">
        <label for="round-timer" class="flex justify-between gap-3"
            >Round timer <output for="round-timer" class="accent">{{ model }} seconds</output></label
        ><input id="round-timer" type="range" v-model.number="model" min="20" max="200" step="1" />
    </div>
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
