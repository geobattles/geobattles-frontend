<template>
    <div class="field">
        <label for="lobby-rounds">Rounds</label
        ><input id="lobby-rounds" type="number" class="input" v-model.number="model" min="1" max="10" step="1" required inputmode="numeric" />
    </div>
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
