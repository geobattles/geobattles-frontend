<template>
    <div>
        <Header />
        <div class="page-container">
            <div>
                <button class="play-button btn btn-blue" @click="createLobby">PLAY NOW</button>
                <br />
                <span class="join-text">or join a lobby by <span class="clickable" @click="router.push('/join')">game code!</span></span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_name = ref("");
        const router = useRouter();
        return { createLobby, joinLobby, lobby_name, useLobbySettings, router };
    },
};
</script>

<style scoped>
.btn {
    @apply font-bold py-1 px-2 rounded text-sm;
}
.btn-blue {
    @apply bg-blue-500 text-white;
}
.btn-blue:hover {
    @apply bg-blue-700;
}

.page-container {
    width: 100%;
    display: flex;

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
