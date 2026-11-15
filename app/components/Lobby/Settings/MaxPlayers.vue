<template>
    <div class="field">
        <label for="lobby-max-players">Max players</label
        ><input id="lobby-max-players" type="number" class="input" v-model.number="model" min="1" max="20" step="1" required inputmode="numeric" />
    </div>
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
