<template>
    <div>
        <Tag :severity="severity" pt:label:class="text-xs lg:text-base" :value="statusMessage" rounded />
    </div>
</template>

<script setup lang="ts">
const socketStore = useWebSocketStore();

const statusMessage = computed(() => {
    switch (socketStore.connectionStatus) {
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
    switch (socketStore.connectionStatus) {
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
