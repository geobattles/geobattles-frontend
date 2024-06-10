<template>
    <div>
        <Header />
        <div class="page-container">
            <div>
                <Button class="play-button" @click="handlePlayNowClick" label="PLAY NOW" />
                <br />
                <span class="join-text">or join a lobby by <span class="clickable" @click="router.push('/lobby/join')">game code!</span></span>
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
            if (!usePlayerInfo().value.name) return window.alert("Please enter a username before playing!");
            createLobby();
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
    width: 300px;
    padding: 15px 10px;

    font-size: 18px;
}

.join-text {
    color: white;
    font-size: 18px;
    margin-left: 20px;
}

.clickable {
    text-decoration: underline;
    cursor: pointer;
}
</style>
