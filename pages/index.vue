<template>
    <div class="app-root">
        <Header />
        <Toast />
        <div class="page-container">
            <div class="opaque-container">
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
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
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

.app-root {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    position: relative;
    background-image: url('/images/wallpaper.jpg');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    overflow: hidden;
}

.page-container {
    width: 100%;
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

.app-root > * {
    position: relative;
    z-index: 12;
}

.app-root::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.28);
    z-index: 2;
    pointer-events: none;
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
    .hero { background: rgba(0,0,0,0.45); }
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
    border-radius: 0.75rem;
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

.opaque-container {
    width: min(86vw, 460px);
    max-width: 460px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255,255,255,0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 0.75rem;
    box-shadow: 0 10px 28px rgba(0,0,0,0.10);
    z-index: 6;
}

@media (min-width: 1024px) {
    .opaque-container { align-items: center; }
}

@media (prefers-color-scheme: dark) {
    .opaque-container { background: rgba(0,0,0,0.48); box-shadow: 0 12px 36px rgba(0,0,0,0.6); }
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

@media (min-width: 1024px) {
    .page-container { align-items: flex-start; justify-content: center; padding-left: clamp(1rem, 8vw, 6rem); }
    .hero { display: block; text-align: center; }
    .play-card { align-items: center; }
}

@media (prefers-color-scheme: dark) {
    .play-btn { background: linear-gradient(90deg, #B6E388 0%, #5F8D4E 100%); color: #181c1b; box-shadow: 0 10px 24px rgba(0,0,0,0.25); }
}
</style>
