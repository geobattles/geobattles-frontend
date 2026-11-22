<template>
    <LobbySettingsNumberStepper input-id="lobby-max-players" label="Max players" v-model="model" :min="1" :max="12" />
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
