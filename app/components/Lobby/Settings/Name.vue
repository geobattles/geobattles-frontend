<template>
    <div class="field"><label for="lobby-name">Lobby name</label><input id="lobby-name" v-model="model" class="input" required maxlength="80" /></div>
</template>
<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>
