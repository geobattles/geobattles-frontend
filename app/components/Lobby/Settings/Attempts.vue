<template>
    <div class="field">
        <label for="lobby-attempts">Guesses per round</label
        ><input id="lobby-attempts" type="number" class="input" v-model.number="model" min="1" max="5" step="1" required inputmode="numeric" />
    </div>
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
