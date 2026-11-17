<template>
    <LobbySettingsNumberStepper input-id="lobby-rounds" label="Rounds" v-model="model" :min="1" :max="10" />
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
