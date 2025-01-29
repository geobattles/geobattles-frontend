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
            <Button type="button" class="m-auto" label="NEXT GAME" icon="pi pi-play-circle" @click="gameStore.sendStartRoundSocketMessage" severity="primary" size="small" />
            <Button @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal" type="button" class="m-auto" label="Modify Lobby Settings" icon="pi pi-cog" severity="info" size="small" />
        </div>
        <div v-else class="next-round-button-container">
            <p class="text-center">GAMEOVER</p>
            <p class="text-xs text-center">Waiting for admin to start next...</p>
        </div>
        <Dialog v-model:visible="lobbyStore.modifySettingsModal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
    </div>
</template>

<script setup lang="ts">
// External services
const gameStore = useGameplayStore();
const lobbyStore = useLobbyStore();
const { isPlayerAdmin } = useLobbyStore();

// Watch for lobby settings modal
watch(
    () => lobbyStore.modifySettingsModal,
    (newVal) => {
        if (!newVal) lobbyStore.applyLobbySettings();
    }
);
</script>

<style>
.endgame-container {
    position: relative;
    height: 100dvh;
    width: 100dvw;
    background-color: var(--p-surface-800);
}

.endgame-menu-container {
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: var(--p-surface-900);
    padding: 10px 20px;

    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}
</style>
