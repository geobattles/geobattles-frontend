<template>
    <div class="app-root">
        <Header />
        <Toast />
        <div class="page-container">
            <div class="hero">
                <h2 class="hero-sub">Welcome to</h2>
                <h1 class="hero-title">GeoBattles</h1>
            </div>
            <div class="play-card">
                <Button
                    class="play-btn"
                    @click="handlePlayNowClick"
                    label="PLAY NOW"
                    icon="pi pi-map-marker"
                    :loading="isJoiningLobby"
                    severity="primary"
                    size="large"
                    raised
                />
                <div class="help-text">
                    <span>or join a lobby by <a class="code-link" @click="handleJoinByCodeClick()">game code!</a></span>
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
    align-items: center;
    justify-content: center;
}

.app-root {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    overflow: hidden;
}

.page-container {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0 1rem;
    position: relative;
    z-index: 10;
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
    background: linear-gradient(90deg, #90B77D 0%, #42855B 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-size: 2.5rem;
    transition: transform 0.3s ease;
    text-shadow: 0 1px 0 rgba(0,0,0,0.02);
}

.hero-title:hover {
    transform: scale(1.03);
}

@media (prefers-color-scheme: dark) {
    .hero-sub { color: #fff; }
    .hero-title { background: linear-gradient(90deg, #B6E388 0%, #5F8D4E 100%); }
}

.play-btn {
    width: 14rem;
    letter-spacing: 4px;
    padding: 15px 10px;
    border: none;
    color: #fff;
    background: linear-gradient(90deg, #90B77D 0%, #42855B 100%);
    box-shadow: 0 8px 20px rgba(66,133,91,0.15);
    transition: transform 0.25s ease, background 0.25s ease;
}

.play-card {
    width: 100%;
    max-width: 28rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
}

.help-text {
    margin-top: 0.5rem;
    text-align: center;
    color: #4b5563;
}

.code-link {
    color: #42855B;
    text-decoration: underline;
    cursor: pointer;
}

@media (prefers-color-scheme: dark) {
    .app-root { background: #181c1b; }
    .play-card { background: #232a27; box-shadow: 0 12px 30px rgba(0,0,0,0.5); }
    .help-text { color: #ffffff; }
    .code-link { color: #B6E388; }
}

.play-btn:hover { transform: scale(1.03); }

@media (min-width: 768px) {
    .play-btn { width: 20rem; }
}

@media (prefers-color-scheme: dark) {
    .play-btn { background: linear-gradient(90deg, #B6E388 0%, #5F8D4E 100%); color: #181c1b; box-shadow: 0 10px 24px rgba(0,0,0,0.25); }
}
</style>
