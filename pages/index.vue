<template>
    <div>
        <button @click="createLobby">Create Lobby</button>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        onMounted(() => {});

        usePlayerInfo().value.name = "Martin"; //! Dev

        return { createLobby };
    },
};
</script>

<style></style>
