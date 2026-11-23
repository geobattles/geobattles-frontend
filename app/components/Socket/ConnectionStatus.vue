<template>
    <span data-testid="connection-status" class="badge" :class="tone" :title="message"
        ><span class="status-dot" aria-hidden="true" /><span class="connection-label">{{ message }}</span></span
    >
</template>
<script setup lang="ts">
const socket = useWebSocketStore();
const message = computed(() => {
    if (!socket.isOnline) return "Offline";
    if (socket.isWeak) return "Slow connection";
    if (socket.isConnected) return "Connected";
    if (socket.connectionState === "connecting") return "Connecting";
    if (socket.connectionState === "reconnecting") return "Reconnecting";
    return "Disconnected";
});
const tone = computed(() => {
    if (!socket.isOnline || socket.connectionState === "disconnected") return "connection-unavailable";
    return socket.isConnected && !socket.isWeak ? "badge-success" : "badge-warn";
});
</script>
<style scoped>
.connection-unavailable {
    color: var(--gb-coral);
}
</style>
