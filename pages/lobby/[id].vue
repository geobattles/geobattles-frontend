<template>
    <div>
        <h1>Lobby: {{ lobby_settings.ID }}</h1>
        <span>Players:</span>
        <div v-for="(player, index) in lobby_settings.playerList" :key="index">
            {{ player.name }}
        </div>
        <button @click="startGame()">Start</button>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_settings = useLobbySettings();
        console.log(useLobbySettings().value); //! Dev

        const startGame = () => {
            // Notify server to start the game
            const data = JSON.stringify({
                command: "start",
            });
            useSocketConnection().value.send(data);
        };

        return { lobby_settings, startGame };
    },
};
</script>

<style></style>
