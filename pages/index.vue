<template>
    <div>
        <Header />
        <button class="btn btn-blue" @click="createLobby">Create Lobby</button>
        <br />
        <div>
            <span class="text-white">Join lobby: </span>
            <input type="text" v-model="lobby_name" />
            <button class="btn btn-blue" @click="joinLobby(lobby_name)">Join</button>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_name = ref("");
        return { createLobby, joinLobby, lobby_name, useLobbySettings };
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
</style>
