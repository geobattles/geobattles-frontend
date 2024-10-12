<template>
    <div class="connection-status-container">
      <Tag :severity="severity" :value="statusMessage" rounded />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConnectionStatus } from '~/composables/socketConnectionStatus'

const { connectionStatus } = useConnectionStatus()

const statusMessage = computed(() => {
switch (connectionStatus.value) {
    case 'connected':
    return 'Connected'
    case 'reconnecting':
    return 'Reconnecting...'
    case 'disconnected':
    return 'Disconnected'
    default:
    return 'Unknown status'
}
})

const severity = computed(() => {
switch (connectionStatus.value) {
    case 'connected':
    return 'success'
    case 'reconnecting':
    return 'warn'
    case 'disconnected':
    return 'danger'
    default:
    return 'info'
}
})
</script>

<style scoped>
.connection-status-container {
position: fixed;
top: 10px;
left: 10px;
z-index: 9999;

background-color: var(--p-zinc-900);
border-radius: 10px;
padding: 0.5rem;
}

:deep(.p-tag) {
font-size: 0.8rem;
padding: 0.25rem 0.5rem;
}
</style>