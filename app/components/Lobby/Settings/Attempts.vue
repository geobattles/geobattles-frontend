<template>
    <LobbySettingsNumberStepper input-id="lobby-attempts" label="Guesses per round" v-model="model" :min="1" :max="5" />
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
