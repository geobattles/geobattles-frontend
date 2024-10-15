<template>
    <div id="midround_container">
        <div class="midround-content">
            <Panel class="mt-12" header="Total results">
                <GameplayTotalStatistics class="text-sm md:text-base" />
            </Panel>
            <div class="mt-5 text-center">
                <Button v-if="isPlayerAdmin()" @click="gameFlowManager?.sendStartRoundSocketMessage" label="Next Round" icon="pi pi-forward" severity="warning" outlined />
            </div>
        </div>
        <div class="google-map-window">
            <!-- *GoogleMap gets appended here when gameFlow changed to MID-ROUND -->
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const gameFlowManager = useGameFlowManager();
        if (!gameFlowManager.value) throw new Error("GameFlowManager is not initialized");
        const total_results = useTotalResults();

        onMounted(() => {});
        return { total_results, gameFlowManager };
    },
};
</script>

<style scoped>
#midround_container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2;
    background-color: var(--p-zinc-900);

    overflow: hidden;
    display: flex;
    flex-direction: row;
}

.midround-content {
    flex: 30%;
    margin: 10px;

    display: flex;
    flex-direction: column;
    justify-content: center;
}

.google-map-window {
    flex: 70%;

    overflow: hidden;
}
</style>
