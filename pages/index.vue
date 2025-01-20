<template>
    <div>
        <Header />
        <div class="page-container">
            <div>
                <Button class="play-button w-56 md:w-80" @click="handlePlayNowClick" label="PLAY NOW" icon="pi pi-map-marker" :loading="isjoiningLobby" severity="contrast" size="large" raised />
                <div class="m-auto text-center mt-4">
                    <span>or join a lobby by <a class="clickable" @click="handleJoinByCodeClick()">game code!</a></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const isjoiningLobby = ref(false);

// External services
const router = useRouter();
const { createLobby } = useLobbyStore();
const auth = useAuthStore();
const isLoginDialogVisible = useIsLoginDialogVisible();

const handlePlayNowClick = async () => {
    if (!auth.isAuthenticated) return (isLoginDialogVisible.value = true);
    isjoiningLobby.value = true;

    // Try to create a lobby
    try {
        await createLobby();
    } catch (error) {
        console.error("Failed to create lobby:", error);
        return window.alert("Failed to create lobby. Please try again later.\n" + error);
    } finally {
        isjoiningLobby.value = false;
    }
};

const handleJoinByCodeClick = () => {
    if (!auth.isAuthenticated) return (isLoginDialogVisible.value = true);
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
