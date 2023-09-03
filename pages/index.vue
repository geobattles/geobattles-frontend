<template>
    <div @click="createLobby">Hello World!</div>
</template>

<script>
import { createLobby } from "~/lobby";
export default {
    setup() {
        onMounted(() => {});

        return { createLobby };
    },
};
</script>

<style></style>
