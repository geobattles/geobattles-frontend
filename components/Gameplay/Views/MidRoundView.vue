<template>
    <div class="midround-container">
        <div id="midround-map-and-results">
            <!-- MidRound Results Content -->
            <div id="midround-results-container" class="overflow-auto">
                <Tabs value="1" class="text-xs lg:text-base">
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
        <div class="midround-menu" :style="{ width: uiManager.isVertical ? '100dvw' : '50dvw' }">
            <!-- Next Round Button -->
            <Button
                v-if="isPlayerAdmin()"
                pt:root:class="!text-xs lg:!text-base"
                :class="{ 'button-loading-animation': nextRoundButtonLoading }"
                @click="useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START })"
                :label="'Next Round'"
                icon="pi pi-forward"
                variant="outlined"
                severity="primary"
                :disabled="nextRoundButtonLoading"
            />
            <div v-else class="flex flex-col justify-right items-center gap-1">
                <p class="text-xs lg:text-base text-center">Admin will start round...</p>
                <div class="flex items-center space-x-2">
                    <div class="animate-ping w-2 h-2 rounded-full bg-indigo-400"></div>
                    <div class="animate-ping w-2 h-2 rounded-full bg-indigo-400 animation-delay-150"></div>
                    <div class="animate-ping w-2 h-2 rounded-full bg-indigo-400 animation-delay-300"></div>
                </div>
            </div>
            <!-- Leave Button -->
            <LobbyLeave class="text-xs lg:text-sm" @click="handleClickLeaveLobby" />

            <!-- Show round number -->
            <div class="round-indicator text-xs lg:text-base flex flex-col">
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
const uiManager = useUIManagerStore();

const isMidRound = computed(() => gameMode.modeLogic.currentState === GameState.MID_ROUND);
const nextRoundButtonLoading = ref(false);

// Watch for changes to isMidRound and trigger button timeout
watch(isMidRound, (newValue) => {
    if (newValue) {
        // When entering mid-round state, disable button for 8 seconds
        nextRoundButtonLoading.value = true;

        setTimeout(() => {
            nextRoundButtonLoading.value = false;
        }, 1);
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
    width: 50dvw;
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
    width: 50dvw;
    height: 100dvh;
    display: inline-block;
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
    right: 1px;

    background-color: var(--p-content-background); /* Use the root background color variable */
    padding: 8px 5px;

    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
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
