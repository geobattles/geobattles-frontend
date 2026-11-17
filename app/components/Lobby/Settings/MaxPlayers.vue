<template>
    <LobbySettingsNumberStepper input-id="lobby-max-players" label="Max players" v-model="model" :min="1" :max="20" />
</template>
<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>
