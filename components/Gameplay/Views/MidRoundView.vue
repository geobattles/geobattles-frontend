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

        <!-- Mid Round Menu -->
        <div class="midround-menu">
            <!-- Next Round Button -->
            <Button
                v-if="isPlayerAdmin()"
                pt:root:class="!text-xs lg:!text-base"
                class="m-auto"
                :class="{ 'button-loading-animation': nextRoundButtonLoading }"
                @click="useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START })"
                :label="'Next Round'"
                icon="pi pi-forward"
                variant="outlined"
                severity="primary"
                :disabled="nextRoundButtonLoading"
            />
            <!-- Leave Button -->
            <LobbyLeave class="gameplay-connection-and-leave text-xs lg:text-sm m-auto" @click="handleClickLeaveLobby" />

            <!-- Show round number -->
            <div class="round-indicator m-auto text-xs lg:text-base flex flex-col">
                <span class="font-semibold">Round:</span>
                <div class="m-auto">{{ gameMode.modeLogic.currentRound }} / {{ lobbyStore.lobbySettings?.conf.numRounds }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { GameState } from "~/types/appTypes";

const emit = defineEmits(["leaveLobby"]);

const gameMode = useGameMode();
const lobbyStore = useLobbyStore();
const { isPlayerAdmin } = useLobbyStore();

const isMidRound = computed(() => gameMode.modeLogic.currentState === GameState.MID_ROUND);
const nextRoundButtonLoading = ref(false);

// Watch for changes to isMidRound and trigger button timeout
watch(isMidRound, (newValue) => {
    if (newValue) {
        // When entering mid-round state, disable button for 8 seconds
        nextRoundButtonLoading.value = true;

        setTimeout(() => {
            nextRoundButtonLoading.value = false;
        }, 6000);
    }
});

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

/* Button Loading Animation */
.button-loading-animation {
    position: relative;
    overflow: hidden;
    transition: background-color 0.3s ease;
    opacity: 0.85;
}

.button-loading-animation::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(to left, rgba(255, 255, 255, 0.8), transparent);
    animation: slide-left 6s linear forwards;
}

@keyframes slide-left {
    0% {
        transform: translateX(0%);
        opacity: 0.8;
    }

    100% {
        transform: translateX(-100%);
        opacity: 0;
    }
}
</style>
