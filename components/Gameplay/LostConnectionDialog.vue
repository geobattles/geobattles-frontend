<template>
    <div>
        <Dialog v-model:visible="isConnected" class="w-96" :closable="false" modal :header="dialogHeader" :pt:header:class="'!m-auto'">
            <div class="flex flex-col items-center gap-4 p-4">
                <!-- Network connection lost -->
                <template v-if="!socketStore.isOnline">
                    <div class="text-center">
                        <i class="pi pi-wifi text-4xl text-red-500 mb-3"></i>
                        <p>Your internet connection appears to be down</p>
                        <p class="text-sm text-gray-500 mt-2">Waiting for connection to reestablish</p>
                    </div>
                    <Button variant="outlined" label="Exit game" severity="danger" @click="handleReturnHomeClick" />
                </template>

                <!-- Socket connection issues -->
                <template v-else>
                    <SocketConnectionStatus />
                    <ProgressSpinner v-if="socketStore.connectionState === 'reconnecting' || socketStore.connectionState === 'connecting'" />
                    <div v-if="socketStore.connectionState === 'disconnected'">
                        <p>Lost connection to the game server.</p>
                        <Button variant="outlined" label="Exit game" severity="danger" @click="handleReturnHomeClick" />
                    </div>
                </template>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["leaveLobby"]);

const socketStore = useWebSocketStore();
const isConnected = computed(() => socketStore.connectionState !== "connected" || socketStore.isOnline !== true);

const dialogHeader = computed(() => {
    return !socketStore.isOnline ? "Network Connection Lost" : "Server Connection Lost";
});

const handleReturnHomeClick = () => emit("leaveLobby");
</script>

<style scoped>
.lost-connection {
    text-align: center;
    padding: 20px;
}
</style>
