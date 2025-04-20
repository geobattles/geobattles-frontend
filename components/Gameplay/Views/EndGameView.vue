<template>
    <div class="endgame-container">
        <div id="endgame-map-and-results">
            <div id="endgame-results-container" class="overflow-auto">
                <GameplayTotalStatistics class="text-xs lg:text-base p-2 md:p-4" />
            </div>
            <!-- Google Map Gets Appended here in ENDGAME -->
        </div>
        <div v-if="isPlayerAdmin()" class="endgame-menu-container" :class="[uiManager.isVertical ? 'w-full' : 'w-1/2']">
            <Button
                type="button"
                label="New Game"
                severity="primary"
                icon="pi pi-play-circle"
                variant="outlined"
                size="large"
                @click="useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START })"
                pt:root:class="!text-xs lg:!text-base"
            />
            <Button
                type="button"
                label="Settings"
                severity="info"
                icon="pi pi-cog"
                variant="outlined"
                @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal"
                pt:root:class="!text-xs lg:!text-base"
            />
            <LobbyLeave @click="handleClickLeaveLobby" />
        </div>
        <div v-else class="endgame-menu-container" :class="[uiManager.isVertical ? 'w-full' : 'w-1/2']">
            <div class="flex gap-3">
                <div class="flex flex-col justify-center">
                    <Tag class="text-center" severity="danger">GAME OVER</Tag>
                    <p class="text-xs lg:text-base">Admin can start next game!</p>
                </div>
                <LobbyLeave @click="handleClickLeaveLobby" />
            </div>
        </div>
        <div></div>
        <Dialog v-model:visible="lobbyStore.modifySettingsModal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["leaveLobby"]);

// External services
const lobbyStore = useLobbyStore();
const { isPlayerAdmin } = useLobbyStore();
const uiManager = useUIManagerStore();

// Watch for lobby settings modal
watch(
    () => lobbyStore.modifySettingsModal,
    (newVal) => {
        if (!newVal) lobbyStore.applyLobbySettings();
    }
);

// Handle leaving the lobby
const handleClickLeaveLobby = () => emit("leaveLobby");
</script>

<style>
.endgame-container {
    position: relative;
    height: 100dvh;
    width: 100dvw;

    overflow: hidden;
}

.endgame-menu-container {
    position: absolute;
    bottom: 0;
    right: 0;

    background-color: var(--p-content-background); /* Use the root background color variable */
    padding: 8px 0px;

    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
}
</style>
