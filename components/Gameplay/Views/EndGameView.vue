<template>
    <div id="end_game_container">
        <div class="results-section">
            <div class="total-result-table">
                <GameplayTotalStatistics />
            </div>
        </div>
        <div class="endgame-menu">
            <Button type="button" label="NEXT GAME" @click="gameFlowManager?.sendStartRoundSocketMessage" />
            <LobbyDisplaySettings />
            <div style="text-align: center">
                <Button @click="modify_settings_modal = !modify_settings_modal" type="button" label="Modify Settings" icon="pi pi-cog" badgeSeverity="contrast" outlined />
            </div>
        </div>
        <Dialog v-model:visible="modify_settings_modal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
    </div>
</template>

<script setup lang="ts">
const total_results = useTotalResults();
const modify_settings_modal = useModifySettingsModal();
const gameFlowManager = useGameFlowManager();

watch(modify_settings_modal, (newVal) => {
    if (!newVal) applyLobbySettings();
});
</script>

<style scoped>
#end_game_container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    background-color: var(--p-zinc-900);

    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto;
    gap: 20px;
    flex-wrap: wrap;
}

.endgame-menu {
    flex: 50%;
    z-index: 1;
    color: white;

    display: flex;
    flex-direction: column;
    gap: 10px;

    width: 100%;
    max-width: 400px;
}

.results-section {
    flex: 50%;

    width: 100%;
    max-width: 400px;
    z-index: 1;
}
</style>
