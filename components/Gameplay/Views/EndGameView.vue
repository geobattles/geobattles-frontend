<template>
    <div class="endgame-container">
        <div id="endgame-map-and-results">
            <div id="endgame-results-container">
                <Tabs value="0" class="text-xs lg:text-base">
                    <TabList>
                        <Tab value="0">Round Results</Tab>
                        <Tab value="1">Total Results</Tab>
                    </TabList>
                    <TabPanels>
                        <!-- Round Results Table -->
                        <TabPanel value="0">
                            <GameplayBattleRoyaleLiveStatistics class="text-xs lg:text-base" />
                        </TabPanel>

                        <!-- Total Results Table -->
                        <TabPanel value="1">
                            <GameplayTotalStatistics class="text-xs lg:text-base" />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>

            <!-- Google Map Gets Appended here in ENDGAME -->
        </div>
        <div v-if="isPlayerAdmin()" class="endgame-menu-container">
            <Button
                type="button"
                label="New Game"
                severity="primary"
                icon="pi pi-play-circle"
                variant="outlined"
                size="large"
                @click="useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START })"
                pt:root:class="!text-xs lg:!text-base m-auto"
            />
            <Button
                type="button"
                label="Settings"
                severity="info"
                icon="pi pi-cog"
                variant="outlined"
                @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal"
                pt:root:class="!text-xs lg:!text-base m-auto"
            />
            <LobbyLeave class="m-auto" @click="handleClickLeaveLobby" />
        </div>
        <div v-else class="endgame-menu-container">
            <div class="flex gap-3">
                <div class="flex flex-col">
                    <p class="text-center">GAME OVER</p>
                    <p class="text-xs text-center">Waiting for admin to start next...</p>
                </div>
                <LobbyLeave class="m-auto" @click="handleClickLeaveLobby" />
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
}

.endgame-menu-container {
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 5px;
    background-color: var(--surface-background);
    padding: 10px 20px;

    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}
</style>
