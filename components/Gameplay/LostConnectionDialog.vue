<template>
    <div>
        <Dialog v-model:visible="isConnected" class="w-96" :closable="false" modal header="Connection Lost">
            <div class="flex flex-col items-center gap-4 p-4">
                <SocketConnectionStatus />
                <ProgressSpinner v-if="socketStore.connectionState === 'reconnecting'" />
                <Button v-if="socketStore.connectionState === 'disconnected'" label="Return to Home" severity="danger" @click="handleReturnHomeClick" />
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["leaveLobby"]);

const socketStore = useWebSocketStore();
const isConnected = computed(() => socketStore.connectionState !== "connected");

const handleReturnHomeClick = () => emit("leaveLobby");
</script>

<style scoped>
.lost-connection {
    text-align: center;
    padding: 20px;
}
</style>
