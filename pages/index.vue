<template>
    <div>
        <Header />
        <Toast />
        <div class="page-container">
            <div>
                <Button
                    class="play-button w-56 md:w-80 !bg-gradient-to-r !from-green-600 !to-teal-700 !border-none !text-white"
                    @click="handlePlayNowClick"
                    label="PLAY NOW"
                    icon="pi pi-map-marker"
                    :loading="isJoiningLobby"
                    severity="primary"
                    size="large"
                    raised
                />
                <div class="m-auto text-center mt-4">
                    <span>or join a lobby by <a class="clickable" @click="handleJoinByCodeClick()">game code!</a></span>
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
