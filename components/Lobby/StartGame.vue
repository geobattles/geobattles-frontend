<template>
    <div class="flex justify-center items-center p-4">
        <Button
            v-if="isPlayerAdmin()"
            @click="handleStartGameButton()"
            size="large"
            label="Start Game"
            icon="pi pi-play-circle"
            :loading="isPlayNowLoading"
            class="!w-full md:!w-auto !text-lg !font-semibold !bg-gradient-to-r !from-green-600 !to-teal-700 !border-none !text-white hover:!from-indigo-700 hover:!to-purple-700 !transition-all !shadow-lg hover:!shadow-xl !border-none !rounded-xl !px-6 !py-3 !text-white"
        />
        <div v-else class="flex flex-col items-center p-4 rounded-lg bg-gray-100/80 dark:bg-gray-800/50 shadow-lg border border-gray-200 dark:border-gray-700">
            <div class="text-gray-800 dark:text-white text-center mb-3 font-medium">Waiting for admin to start the game</div>
            <div class="flex items-center space-x-2">
                <div class="animate-ping w-2 h-2 rounded-full bg-indigo-400"></div>
                <div class="animate-ping w-2 h-2 rounded-full bg-indigo-400 animation-delay-150"></div>
                <div class="animate-ping w-2 h-2 rounded-full bg-indigo-400 animation-delay-300"></div>
            </div>
            <div class="text-gray-600 dark:text-gray-400 text-sm mt-3">Get ready for the battle!</div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { isPlayerAdmin } = useLobbyStore();
const isPlayNowLoading = ref(false);

const handleStartGameButton = () => {
    isPlayNowLoading.value = true;
    useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START });
};
</script>

<style scoped>
.animation-delay-150 {
    animation-delay: 150ms;
}
.animation-delay-300 {
    animation-delay: 300ms;
}
</style>
