<template>
    <div>
        <Header />
        <div class="page-container">
            <div>
                <Button class="play-button w-56 md:w-80" @click="handlePlayNowClick" label="PLAY NOW" icon="pi pi-map-marker" :loading="isjoiningLobby" size="large" />
                <div class="m-auto text-center mt-4">
                    <span class="text-white">or join a lobby by <a class="clickable" @click="handleJoinByCodeClick()">game code!</a></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const router = useRouter();
const auth = useAuthenticationService().value;
const isLoginDialogVisible = useIsLoginDialogVisible();
const isjoiningLobby = ref(false);

const handlePlayNowClick = async () => {
    if (!auth.isPlayerAuthenticated()) return (isLoginDialogVisible.value = true);
    isjoiningLobby.value = true;

    // Try to create a lobby
    try {
        await createLobby();
    } catch (error) {
        console.error("Failed to create lobby:", error);
        isjoiningLobby.value = false;
        return window.alert("Failed to create lobby. Please try again later.\n" + error);
    }
};

const handleJoinByCodeClick = () => {
    if (!auth.isPlayerAuthenticated()) return (isLoginDialogVisible.value = true);
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
