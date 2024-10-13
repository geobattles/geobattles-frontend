<template>
    <div>
        <Tag :severity="severity" :value="statusMessage" rounded />
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const { connectionStatus } = useWebSocket();

const statusMessage = computed(() => {
    switch (connectionStatus.value) {
        case "connected":
            return "Connected";
        case "reconnecting":
            return "Reconnecting...";
        case "disconnected":
            return "Disconnected";
        default:
            return "Unknown status";
    }
});

const severity = computed(() => {
    switch (connectionStatus.value) {
        case "connected":
            return "success";
        case "reconnecting":
            return "warn";
        case "disconnected":
            return "danger";
        default:
            return "info";
    }
});
</script>

<style scoped></style>
