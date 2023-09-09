<template>
    <div>
        <h1>Lobby: {{ lobby_settings.ID }}</h1>
        <span>Players:</span>
        <div v-for="(player, index) in lobby_settings.playerList" :key="index">
            {{ player.name }}
        </div>
        <button @click="nextRound()">Start</button>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_settings = useLobbySettings();
        console.log(useLobbySettings().value); //! Dev

        return { lobby_settings, nextRound };
    },
};
</script>

<style></style>
