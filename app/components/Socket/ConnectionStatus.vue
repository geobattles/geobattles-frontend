<template>
    <span data-testid="connection-status" class="badge" :class="socket.isConnected && socket.isOnline ? 'badge-success' : 'badge-warn'" role="status"
        ><span class="status-dot" />{{ message }}</span
    >
</template>
<script setup lang="ts">
const socket = useWebSocketStore();
const message = computed(() => {
    if (!socket.isOnline) return "Offline";
    if (socket.isConnected) return "Connected";
    if (socket.connectionState === "connecting") return "Connecting";
    if (socket.connectionState === "reconnecting") return `Reconnecting${socket.recoverySecondsRemaining ? ` · ${socket.recoverySecondsRemaining}s` : ""}`;
    return "Disconnected";
});
</script>
