<template>
    <div>
        <Dialog
            v-model:visible="isConnected"
            class="w-11/12 md:w-96 rounded-xl shadow-lg"
            :closable="false"
            modal
            :pt="{
                root: { class: '!rounded-xl !shadow-lg' },
                header: { class: '!p-4 !text-center !font-semibold !text-lg !hidden' }, // Hide default header
                content: { class: '!p-6' },
            }"
        >
            <div class="flex flex-col items-center justify-center gap-6 text-center">
                <!-- Network connection lost -->
                <template v-if="!socketStore.isOnline">
                    <i class="pi pi-wifi text-6xl text-red-500 mb-2 animate-pulse"></i>
                    <p class="text-lg font-semibold">Network Connection Lost</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Your internet connection appears to be down. Waiting for connection to reestablish...</p>
                    <Button variant="outlined" label="Exit Game" severity="danger" class="mt-4 w-full sm:w-auto" @click="handleReturnHomeClick" />
                </template>

                <!-- Socket connection issues -->
                <template v-else>
                    <SocketConnectionStatus />
                    <template v-if="socketStore.connectionState === 'reconnecting' || socketStore.connectionState === 'connecting'">
                        <ProgressSpinner class="w-12 h-12 mt-2" strokeWidth="4" animationDuration=".8s" aria-label="Connecting" />
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Attempting to reconnect... You can also exit game via button below.</p>
                        <Button variant="outlined" label="Exit Game" severity="danger" class="mt-4 w-full sm:w-auto" @click="handleReturnHomeClick" />
                    </template>
                    <template v-if="socketStore.connectionState === 'disconnected'">
                        <i class="pi pi-times-circle text-6xl text-orange-500 mb-2"></i>
                        <p class="text-lg font-semibold">Server Connection Lost</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Lost connection to the game server. You can try waiting or exit the game.</p>
                        <Button variant="outlined" label="Exit Game" severity="danger" class="mt-4 w-full sm:w-auto" @click="handleReturnHomeClick" />
                    </template>
                </template>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["leaveLobby"]);

const socketStore = useWebSocketStore();
const isConnected = computed(() => socketStore.connectionState !== "connected" || socketStore.isOnline !== true);

const handleReturnHomeClick = () => emit("leaveLobby");
</script>

<style scoped></style>
