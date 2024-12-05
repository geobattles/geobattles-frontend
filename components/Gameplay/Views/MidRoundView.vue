<template>
    <div class="midround-container">
        <div class="absolute flex flex-col md:flex-row w-full h-full overflow-auto">
            <!-- MidRound Menu Content -->

            <div class="w-full lg:w-[30dvw] h-[50dvh] lg:h-auto">
                <Tabs value="0" class="text-xs lg:text-base" pt:root:class="!bg-p-surface-950">
                    <TabList>
                        <Tab value="0">Round Results</Tab>
                        <Tab value="1">Total Results</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel value="0">
                            <GameplayBattleRoyaleLiveStatistics class="text-xs lg:text-base" />
                        </TabPanel>
                        <TabPanel value="1">
                            <GameplayTotalStatistics class="text-xs lg:text-base" />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>
            <!-- Google Map MidRound Position -->
            <div class="google-map-midround-position">
                <!-- *GoogleMap gets appended here when gameFlow changed to MID-ROUND -->
            </div>
        </div>
        <!-- Start Next Round Button -->
        <div v-if="isPlayerAdmin()" class="next-round-button-container">
            <Button @click="gameFlowManager?.sendStartRoundSocketMessage" label="Next Round" icon="pi pi-forward" severity="primary" />
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
    position: relative;

    height: 100dvh; /* Fullscreen height */
    width: 100dvw; /* Fullscreen width */

    background-color: var(--p-surface-800);
}

/* Google Map MidRound Styles */
.google-map-midround-container {
    width: 70dvw;
    height: 100dvh;
    opacity: 1;
}

.google-map-midround-container-vertical {
    width: 100dvw;
    height: 50dvh;
    opacity: 1;
}

.next-round-button-container {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);

    background-color: var(--p-surface-800);
    padding: 15px 20px;

    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}
</style>
