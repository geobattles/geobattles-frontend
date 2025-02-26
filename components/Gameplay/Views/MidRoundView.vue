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
        <div class="midround-menu">
            <Button
                v-if="isPlayerAdmin()"
                pt:root:class="!text-xs !lg:text-sm"
                class="m-auto"
                @click="gameStore.sendStartRoundSocketMessage"
                label="Next Round"
                icon="pi pi-forward"
                variant="outlined"
                severity="primary"
            />
            <LobbyLeave class="gameplay-connection-and-leave text-xs lg:text-sm m-auto" @click="handleClickLeaveLobby" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { LobbyLeave } from "#components";

const emit = defineEmits(["leaveLobby"]);
const gameStore = useGameplayStore();

const { isPlayerAdmin } = useLobbyStore();

// Handle leaving the lobby
const handleClickLeaveLobby = () => emit("leaveLobby");
</script>

<style>
/* MidRound View Styles */
.midround-container {
    position: relative;
    overflow: hidden;

    height: 100dvh; /* Fullscreen height */
    width: 100dvw; /* Fullscreen width */
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
.midround-menu {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);

    background-color: var(--surface-background);
    padding: 15px 20px;

    border-top-left-radius: 10px;
    border-top-right-radius: 10px;

    display: flex;
}
</style>
