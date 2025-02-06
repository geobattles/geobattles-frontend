<template>
    <div class="flex flex-col gap-1">
        <label for="username" class="text-xs">Lobby name</label>
        <InputText id="username" size="small" v-model="lobbyStore.lobbySettings!.conf.name" aria-describedby="username-help" fluid />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobbyStore = useLobbyStore();

        return { lobbyStore };
    },
};
</script>

<style scoped></style>
