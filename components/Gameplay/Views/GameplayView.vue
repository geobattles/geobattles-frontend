<template>
    <div id="gameplay_container" class="gameplay-container">
        <!-- GOOGLE PANORAMA -->
        <GameplayGooglePanorama class="google-panorama" />

        <!-- CONNECTION STATUS -->
        <GameplayMenu class="gameplay-menu-container text-xs lg:text-sm" @leaveLobbyClicked="handleClickLeaveLobby" />

        <!-- MAP (overlapping the Panorama) -->
        <div class="gameplay-map-wrapper">
            <!-- GOOGLE MAP -->
            <GameplayGoogleMap id="map" />

            <!-- SUBMIT BUTTON -->
            <button ref="submitButton" severity="primary" class="submit-button" v-if="gameFlowManager?.gameMode.gameType === 'BattleRoyale'" @click="gameFlowManager.submitGuess()" :disabled="gameFlowManager.isSubmitButtonDisabled()">
                {{ gameFlowManager.isSubmitButtonDisabled() ? "Place your pin" : "GUESS" }}
            </button>
            <!-- <button ref="submit_button" v-if="gameFlowManager?.gameMode.gameType === 'CountryBattle'" class="submit-button" @click="gameFlowManager.submitGuess()" :disabled="false">
                    {{ false ? "Place your pin on the map" : "GUESS" }}
                </button> -->
        </div>

        <!-- MAP MOBILE -->
        <div class="gameplay-map-mobile-position"></div>

        <!-- LIVE STATISTICS -->
        <GameplayBattleRoyaleLiveStatistics v-if="gameFlowManager?.gameMode.gameType === 'BattleRoyale'" class="gameplay-live-results" />
        <GameplayCountryBattleLiveStatistics v-if="gameFlowManager?.gameMode.gameType === 'CountryBattle'" class="live-stats" />

        <!-- BAR TIMER -->
        <GameplayTimerBar v-if="gameFlowManager?.currentState === 'PLAYING'" class="timer-bar-container" />

        <!-- MAP MOBILE BUTTON -->
        <button ref="toggleMapMobile" v-show="showMapButtonMobile && gameFlowManager?.currentState === 'PLAYING'" class="mobile-map-button rounded-full p-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 lg:w-10" viewBox="0 0 576 512">
                <path d="M565.6 36.24C572.1 40.72 576 48.11 576 56V392C576 401.1 569.8 410.9 560.5 414.4L392.5 478.4C387.4 480.4 381.7 480.5 376.4 478.8L192.5 417.5L32.54 478.4C25.17 481.2 16.88 480.2 10.38 475.8C3.882 471.3 0 463.9 0 456V120C0 110 6.15 101.1 15.46 97.57L183.5 33.57C188.6 31.6 194.3 31.48 199.6 33.23L383.5 94.52L543.5 33.57C550.8 30.76 559.1 31.76 565.6 36.24H565.6zM48 421.2L168 375.5V90.83L48 136.5V421.2zM360 137.3L216 89.3V374.7L360 422.7V137.3zM408 421.2L528 375.5V90.83L408 136.5V421.2z" />
            </svg>
            <p style="color: var(--p-primary-600)">Map</p>
        </button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["leaveLobby"]);

// const submit_button = ref<HTMLElement | null>(null);
const submitButton = ref<HTMLElement | null>(null);
const toggleMapMobile = ref<HTMLElement | null>(null);
const showMapButtonMobile = ref(false);

// External services
const gameFlowManager = useGameFlowManager();

onMounted(() => {
    if (!gameFlowManager.value) return console.error("GameFlowManager is not initialized in the lobby");
    gameFlowManager.value.mountingProcess(toggleMapMobile, showMapButtonMobile, submitButton);
});

// Handle leaving the lobby
const handleClickLeaveLobby = () => {
    emit("leaveLobby");
};

// Resize panorama to re-render it when the game state changes
watch(
    () => gameFlowManager.value?.currentState,
    (newVal) => newVal && setTimeout(() => google.maps.event.trigger(useGooglePanorama().value, "resize"), 100)
);
</script>

<style scoped>
/* Game Container */
.gameplay-container {
    position: relative; /* Enable absolute positioning for children */
    height: 100dvh; /* Fullscreen height */
    width: 100dvw; /* Fullscreen width */

    background-color: white;
}

/* Panorama (Fullscreen) */
.google-panorama {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1; /* Base layer */
}

/* Connection Status (Absolute) */
.gameplay-menu-container {
    position: absolute;
    top: 10px;
    left: 10px;

    background-color: var(--p-surface-950);
    color: var(--p-surface-0);

    padding: 5px 10px;
    border-radius: 4px;
    z-index: 2; /* Above panorama */
}

/* Results (Absolute) */
.gameplay-live-results {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2; /* Above panorama */

    width: 350px;
}

/* Wrapper for Map and Submit Button */
.gameplay-map-wrapper {
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: flex;
    flex-direction: column; /* Stack Map and Button vertically */
    align-items: flex-start; /* Align items to the left */
    z-index: 2; /* Above panorama */
}

/* Map (Overlapping Bottom-Left) */
.google-map-gameplay-container {
    width: 350px;
    height: 300px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid white;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: width 0.3s, height 0.3s; /* Smooth transition for hover effect */
}

.google-map-gameplay-container-mobile {
    position: fixed;
    top: 0;
    left: 0;

    width: 100vw !important;
    height: 100vh !important;

    z-index: 1;

    animation: slideInFromBottomLeft 0.5s ease-in-out;
}

@keyframes slideInFromBottomLeft {
    0% {
        transform: translate(-100%, 100%);
        opacity: 0;
    }
    100% {
        transform: translate(0, 0);
        opacity: 1;
    }
}

/* Map Hover Effect */
.google-map-gameplay-container-hovered {
    width: 500px;
    height: 400px;

    /* padding: 30px 30px 0px 0px; */
    transition: height 0.3s ease-out, width 0.3s ease-out;
    opacity: 1;
}

/* Submit Button Styling */
.submit-button {
    width: 350px;

    margin-top: 10px; /* Space between map and button */
    padding: 10px 20px;
    font-size: 16px;
    letter-spacing: 1px;
    font-weight: 650;

    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: var(--p-surface-900);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
    transition: width 0.3s, height 0.3s; /* Smooth transition for hover effect when hovering Google Map */
}

/* Submit Button effect when Google Map is hovered */
.submit-button-hovered-map {
    width: 500px;
}

.submit-button:disabled {
    background-color: var(--p-surface-900);
    cursor: not-allowed;
    opacity: 0.8;
}

/* Timer bar container */
.timer-bar-container {
    position: absolute;
    z-index: 2; /* Above panorama */

    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    margin-left: auto;
    margin-right: auto;
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
    .map-wrapper {
        left: 5px;
        bottom: 5px;
    }

    .gameplay-menu-container {
        top: 5px;
        left: 5px;
    }

    .gameplay-live-results {
        top: 5px;
        right: 5px;

        width: 200px;
    }

    .google-map-gameplay-container {
        height: 0px;
        width: 0px;
    }

    .submit-button {
        width: 150px;
        font-size: 14px;
        padding: 8px 16px;
    }

    .mobile-map-button {
        position: absolute;
        bottom: 55px;
        left: 10px;
        z-index: 9999;

        background-color: var(--p-surface-900);
        fill: var(--p-primary-400);
    }
}
</style>
