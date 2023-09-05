<template>
    <div>
        <h1>Lobby: {{ lobby_settings.ID }}</h1>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_settings = useLobbySettings();

        console.log("User Joined Lobby");
        console.log(lobby_settings.value);

        return { lobby_settings };
    },
};
</script>

<style></style>
