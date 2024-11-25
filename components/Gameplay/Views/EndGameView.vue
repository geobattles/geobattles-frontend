<template>
    <div id="end_game_container">
        <div id="google-map-finished" style="width: 70vw"></div>
        <div class="flex flex-col justify-center gap-5 p-1" style="width: 30vw">
            <div class="results-section">
                <Panel header="Total Results" pt:header:class="text-xs lg:text-base">
                    <GameplayTotalStatistics class="text-xs lg:text-base" />
                </Panel>
            </div>
            <div class="endgame-menu">
                <Button type="button" label="NEXT GAME" icon="pi pi-play-circle" @click="gameFlowManager?.sendStartRoundSocketMessage" severity="" />
                <div style="text-align: center">
                    <Button @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal" type="button" label="Modify Lobby Settings" icon="pi pi-cog" severity="contrast" />
                </div>
            </div>
        </div>
        <Dialog v-model:visible="lobbyStore.modifySettingsModal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
    </div>
</template>

<script setup lang="ts">
// External services
const gameFlowManager = useGameFlowManager();
const lobbyStore = useLobbyStore();

// Watch for lobby settings modal
watch(
    () => lobbyStore.modifySettingsModal,
    (newVal) => {
        if (!newVal) lobbyStore.applyLobbySettings();
    }
);
</script>

<style scoped>
#end_game_container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    background-color: var(--p-surface-900);
    color: var(--p-surface-0);

    display: flex;
    flex-direction: row;
}

.endgame-menu {
    z-index: 1;

    display: flex;
    flex-direction: column;
    gap: 10px;

    width: 100%;
    max-width: 400px;
}
</style>
