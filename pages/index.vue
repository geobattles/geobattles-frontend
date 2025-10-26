<template>
    <div class="app-root">
        <Header />
        <Toast />
        <div class="page-container relative z-10 flex-1 h-0 flex flex-col items-center justify-center gap-4 px-4">
            <div class="text-center animate-fade-in mt-4">
                <h2 class="text-2xl md:text-3xl font-light mb-2 text-gray-600 dark:text-white">Welcome to</h2>
                <h1
                    class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#90B77D] to-[#42855B] bg-clip-text text-transparent dark:from-[#B6E388] dark:to-[#5F8D4E] dark:bg-gradient-to-r dark:bg-clip-text dark:text-transparent transform hover:scale-105 transition-transform duration-300 drop-shadow-sm dark:drop-shadow-lg"
                >
                    GeoBattles
                </h1>
            </div>
            <div class="w-full max-w-md animate-fade-in p-6 flex flex-col items-center bg-white dark:bg-[#232a27] rounded-xl shadow-lg dark:shadow-xl">
                <Button class="play-btn" @click="handlePlayNowClick" label="PLAY NOW" icon="pi pi-map-marker" :loading="isJoiningLobby" severity="primary" size="large" raised />
                <div class="text-center mt-4">
                    <span class="text-gray-600 dark:text-white"
                        >or join a lobby by
                        <a
                            class="text-[#42855B] hover:text-[#90B77D] dark:text-[#B6E388] dark:hover:text-[#5F8D4E] underline underline-offset-4 cursor-pointer transition-colors"
                            @click="handleJoinByCodeClick()"
                            >game code!</a
                        ></span
                    >
                </div>
            </div>
            <SvgsAnimatedEarth />
        </div>
    </div>
</template>

<script setup lang="ts">
import AnimatedEarth from "~/components/Svgs/AnimatedEarth.vue";

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
    align-items: center;
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

.hero {
    margin-top: 0.25rem;
    text-align: center;
}

.hero-sub {
    font-weight: 300;
    margin-bottom: 0.5rem;
    color: #4b5563;
    font-size: 1.25rem;
}

.hero-title {
    font-weight: 700;
    background: linear-gradient(90deg, #90b77d 0%, #42855b 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-size: 2.5rem;
    transition: transform 0.3s ease;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
}

.hero-title:hover {
    transform: scale(1.03);
}

@media (prefers-color-scheme: dark) {
    .hero-sub {
        color: #fff;
    }
    .hero-title {
        background: linear-gradient(90deg, #b6e388 0%, #5f8d4e 100%);
    }
}

.play-btn {
    width: 14rem;
    letter-spacing: 4px;
    padding: 15px 10px;
    border: none;
    color: #fff;
    background: linear-gradient(90deg, #90b77d 0%, #42855b 100%);
    box-shadow: 0 8px 20px rgba(66, 133, 91, 0.15);
    transition:
        transform 0.25s ease,
        background 0.25s ease;
}

.play-btn:hover {
    transform: scale(1.03);
}

@media (min-width: 768px) {
    .play-btn {
        width: 20rem;
    }
}

@media (prefers-color-scheme: dark) {
    .play-btn {
        background: linear-gradient(90deg, #b6e388 0%, #5f8d4e 100%);
        color: #181c1b;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
    }
}
</style>
