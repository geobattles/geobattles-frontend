<template>
    <div class="midround-container">
        <div id="midround-map-and-results">
            <!-- MidRound Results Content -->
            <div id="midround-results-container">
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

            <!-- Google Map Gets Appended here in MIDROUND -->
        </div>

        <!-- Start Next Round Button -->
        <div v-if="isPlayerAdmin()" class="next-round-button-container bg-p-surface-200">
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
    overflow: hidden;

    height: 100dvh; /* Fullscreen height */
    width: 100dvw; /* Fullscreen width */

    background-color: var(--p-surface-800);
}

/* Google Map MidRound Styles */
.google-map-midround-container-horizontal {
    width: 70dvw;
    height: 100dvh;
    opacity: 1;
    display: inline-block;
}

.google-map-midround-container-vertical {
    width: 100dvw;
    height: 50dvh;
    opacity: 1;
    display: block;
}

/* MidRound Results Styles */
.midround-results-container-horizontal {
    width: 30dvw;
    height: 100dvh;
    display: inline-block;
    vertical-align: top;
}

.midround-results-container-vertical {
    width: 100dvw;
    height: 50dvh;
    display: block;
}

/* Next Round Button Styles */
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
