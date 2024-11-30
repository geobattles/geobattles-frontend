<template>
    <div class="flex flex-col md:flex-row">
        <!-- MidRound Menu Content -->
        <div class="flex flex-col justify-center gap-5 p-1 w-full lg:w-[30vw] h-[50vh] md:h-auto">
            <!-- Show Total Results -->
            <Panel pt:header:class="text-xs lg:text-base" header="Total results">
                <GameplayTotalStatistics class="text-xs lg:text-base" />
            </Panel>

            <!-- Start Next Round Button -->
            <div class="mt-5 text-center">
                <Button v-if="isPlayerAdmin()" @click="gameFlowManager?.sendStartRoundSocketMessage" label="Next Round" icon="pi pi-forward" severity="warning" outlined />
            </div>
        </div>

        <!-- Google Map MidRound Position -->
        <div class="google-map-midround-position">
            <!-- *GoogleMap gets appended here when gameFlow changed to MID-ROUND -->
        </div>
    </div>
</template>

<script setup lang="ts">
const gameFlowManager = useGameFlowManager();
if (!gameFlowManager.value) throw new Error("GameFlowManager is not initialized");

const { isPlayerAdmin } = useLobbyStore();
</script>

<style>
/* MidRound View Styles */
.midround-container {
    height: 100vh; /* Fullscreen height */
    width: 100vw; /* Fullscreen width */
}

/* Google Map MidRound Styles */
.google-map-midround-container {
    width: 70vw;
    height: 100vh;
    opacity: 1;
}
</style>
