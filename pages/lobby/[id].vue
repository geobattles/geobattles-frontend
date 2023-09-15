<template>
    <div>
        <h1>Lobby: {{ lobby_settings.ID }}</h1>
        <LobbyPlayerList class="player-list" />
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

<style scoped>
.player-list {
    max-width: 400px;
    font-size: 1.2rem;
}
</style>
