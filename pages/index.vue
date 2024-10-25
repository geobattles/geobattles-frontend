<template>
    <div>
        <Header />
        <div class="page-container">
            <div>
                <Button class="play-button w-56 md:w-80" @click="handlePlayNowClick" label="PLAY NOW" />
                <div class="m-auto text-center mt-4">
                    <span class="text-white">or join a lobby by <a class="clickable" @click="router.push('/lobby/join')">game code!</a></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_name = ref("");
        const router = useRouter();

        const handlePlayNowClick = async () => {
            if (!usePlayerInfo().value.username) return window.alert("Please enter a username before playing!");

            // Try to create a lobby
            try {
                await createLobby();
            } catch (error) {
                console.error("Failed to create lobby:", error);
                return window.alert("Failed to create lobby. Please try again later.\n" + error);
            }
        };
        return { lobby_name, router, handlePlayNowClick };
    },
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
