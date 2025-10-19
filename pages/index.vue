<template>
    <div class="min-h-screen bg-white dark:bg-[#181c1b]">
        <Header />
        <Toast />
        <div class="page-container relative z-10 flex flex-col items-center justify-center gap-8 px-4">
            <div class="text-center animate-fade-in mt-8">
                <h2 class="text-2xl md:text-3xl font-light mb-2 text-gray-600 dark:text-white">Welcome to</h2>
                <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#90B77D] to-[#42855B] bg-clip-text text-transparent 
                    dark:from-[#B6E388] dark:to-[#5F8D4E] dark:bg-gradient-to-r dark:bg-clip-text dark:text-transparent
                    transform hover:scale-105 transition-transform duration-300
                    drop-shadow-sm dark:drop-shadow-lg">
                    GeoBattles
                </h1>
            </div>

            <div class="w-full max-w-md animate-fade-in p-8 flex flex-col items-center bg-white dark:bg-[#232a27] rounded-xl shadow-lg dark:shadow-xl">
                <Button
                    class="play-button w-56 md:w-80 !bg-gradient-to-r !from-[#90B77D] !to-[#42855B] hover:!from-[#86A877] hover:!to-[#3D7152] !border-none !text-white !shadow-lg dark:!from-[#B6E388] dark:!to-[#5F8D4E] dark:!text-[#181c1b] dark:!shadow-xl transform transition-all duration-300 hover:scale-105"
                    @click="handlePlayNowClick"
                    label="PLAY NOW"
                    icon="pi pi-map-marker"
                    :loading="isJoiningLobby"
                    severity="primary"
                    size="large"
                    raised
                />
                <div class="text-center mt-6">
                    <span class="text-gray-600 dark:text-white">or join a lobby by <a class="text-[#42855B] hover:text-[#90B77D] dark:text-[#B6E388] dark:hover:text-[#5F8D4E] underline underline-offset-4 cursor-pointer transition-colors" @click="handleJoinByCodeClick()">game code!</a></span>
                </div>
            </div>
                <AnimatedEarth />
        </div>
    </div>
</template>

<script setup lang="ts">
import AnimatedEarth from '~/components/Svgs/AnimatedEarth.vue';

const isJoiningLobby = ref(false); // Handle loader

// External services
const router = useRouter();
const authStore = useAuthStore();
const { createLobby } = useLobbyStore();
const toast = useToast();

const handlePlayNowClick = async () => {
    if (!authStore.isAuthenticated) return (authStore.isLoginDialog = true);
    isJoiningLobby.value = true;

    // Try to create a lobby
    try {
        await createLobby();
    } catch (error) {
        console.error("Failed to create lobby:", error);
        toast.add({
            severity: "error",
            summary: "Failed to create lobby",
            detail: error instanceof Error ? error.message : String(error),
            life: 5000,
        });
    } finally {
        isJoiningLobby.value = false;
    }
};

const handleJoinByCodeClick = () => {
    if (!authStore.isAuthenticated) return (authStore.isLoginDialog = true);
    router.push("/lobby/join");
};
</script>

<style scoped>

.page-container {
    width: 100%;
    display: flex;
    margin-top: 100px;
    justify-content: center;
}


.play-button {
    letter-spacing: 4px;
    padding: 15px 10px;
}


.clickable {
    text-decoration: underline;
    cursor: pointer;
    color: var(--p-primary-400);
}
</style>
