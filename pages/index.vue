<template>
    <div>
        <button @click="createLobby">Create Lobby</button>
        <br />
        <br />
        <div>
            <span>Join lobby: </span>
            <input type="text" v-model="lobby_name" />
            <button @click="joinLobby(lobby_name)">Join</button>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_name = ref("");

        const generateRandomNumber = () => Math.floor(1000 + Math.random() * 9000).toString();
        usePlayerInfo().value.name = `Player${generateRandomNumber()}`; //! Dev

        return { createLobby, joinLobby, lobby_name, useLobbySettings };
    },
};
</script>

<style></style>
