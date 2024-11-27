<template>
    <div ref="gameplay_page">
        <Toast position="bottom-right" />
        <GameplayMenu class="connection-status-container scale-75 lg:scale-100" @leaveLobbyClicked="handleClickLeaveLobby" />
        <GameplayViewsCountdownView v-if="gameFlowManager?.currentState === 'STARTING'" />
        <div id="gameplay_container">
            <!-- BAR TIMER -->
            <GameplayTimerBar v-if="gameFlowManager?.currentState === 'PLAYING'" class="bar" style="z-index: 4" />
            <!-- GOOGLE MAP -->
            <GameplayGoogleMap default_class="google-map-gameplay" />
            <!-- GOOGLE PANORAMA -->
            <GameplayGooglePanorama />
            <!-- SUBMIT BUTTON -->
            <div v-if="gameFlowManager?.currentState === 'PLAYING'">
                <button ref="submit_button" v-if="gameFlowManager?.gameMode.gameType === 'BattleRoyale'" class="submit-button" @click="gameFlowManager.submitGuess()" :disabled="gameFlowManager.isSubmitButtonDisabled()">GUESS</button>
                <button ref="submit_button" v-if="gameFlowManager?.gameMode.gameType === 'CountryBattle'" class="submit-button" @click="gameFlowManager.submitGuess()" :disabled="false">GUESS</button>
            </div>
            <!-- LIVE STATISTICS -->
            <GameplayBattleRoyaleLiveStatistics v-if="gameFlowManager?.gameMode.gameType === 'BattleRoyale'" class="live-stats min-w-80" />
            <GameplayCountryBattleLiveStatistics v-if="gameFlowManager?.gameMode.gameType === 'CountryBattle'" class="live-stats min-w-80" />
            <!-- MAP MOBILE BUTTON -->
            <button v-show="show_map_button && gameFlowManager?.currentState === 'PLAYING'" ref="toggle_map_mobile" class="mobile-map-button rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" viewBox="0 0 576 512">
                    <path d="M565.6 36.24C572.1 40.72 576 48.11 576 56V392C576 401.1 569.8 410.9 560.5 414.4L392.5 478.4C387.4 480.4 381.7 480.5 376.4 478.8L192.5 417.5L32.54 478.4C25.17 481.2 16.88 480.2 10.38 475.8C3.882 471.3 0 463.9 0 456V120C0 110 6.15 101.1 15.46 97.57L183.5 33.57C188.6 31.6 194.3 31.48 199.6 33.23L383.5 94.52L543.5 33.57C550.8 30.76 559.1 31.76 565.6 36.24H565.6zM48 421.2L168 375.5V90.83L48 136.5V421.2zM360 137.3L216 89.3V374.7L360 422.7V137.3zM408 421.2L528 375.5V90.83L408 136.5V421.2z" />
                </svg>
                <p style="color: var(--p-primary-600)">Map</p>
            </button>
        </div>
        <GameplayViewsMidRoundView v-show="gameFlowManager?.currentState === 'MID-ROUND'" />
        <GameplayViewsEndGameView v-show="gameFlowManager?.currentState === 'FINISHED'" />
        <button @click="toggleFullscreen" class="fullscreen-button">Enter Fullscreen</button>
    </div>
</template>

<script setup lang="ts">
import { useToast } from "primevue/usetoast";
const submit_button = ref<HTMLElement | null>(null);
const toggle_map_mobile = ref<HTMLElement | null>(null);
const show_map_button = ref(false);
const wantsToLeaveLobby = ref(false);
const gameplay_page = ref<HTMLElement | null>(null);

// External services
const { leaveLobby } = useLobbyStore();
const gameFlowManager = useGameFlowManager();
const toast = useToast();
const UIManager = useUIManager();
const router = useRouter();

useHead({
    title: "GeoBattles | Gameplay",
    meta: [
        { name: "description", content: "My amazing site." },
        { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" },
        { name: "touch-action", content: "manipulation" },
    ],
});

onMounted(() => {
    if (!gameFlowManager.value) return console.error("GameFlowManager is not initialized in the lobby");
    gameFlowManager.value.mountingProcess(toggle_map_mobile, show_map_button, submit_button);

    // Add listener when player leaves lobby
    UIManager.value.on("showPlayerLeftToast", handlePlayerLeftToast);
});

onUnmounted(() => {
    try {
        UIManager.value.off("showPlayerLeftToast", handlePlayerLeftToast);
    } catch (error) {
        console.error("Error during onUnmounted:", error);
    }
});

onBeforeRouteLeave((to, from, next) => {
    if (wantsToLeaveLobby.value) {
        if (confirm("Are you sure you want to leave the lobby?")) {
            next();
            leaveLobby();
        } else next(false);
    } else {
        next(false);
    }
    wantsToLeaveLobby.value = false;
});

// When player leaves lobby, show toast
const handlePlayerLeftToast = (event: CustomEvent) => {
    console.log("playerLeftLobby event triggered", event.detail);
    toast.add({ severity: "warn", summary: `Player ${event.detail.playerName} Left`, detail: `Player ${event.detail.playerName} has left the lobby`, life: 3000 });
};

const handleClickLeaveLobby = () => {
    wantsToLeaveLobby.value = true;
    router.push("/");
};

const toggleFullscreen = () => {
    const elem = gameplay_page.value;
    if (elem) {
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }
};
</script>

<style scoped>
.google-map-gameplay {
    position: absolute;
    bottom: 60px;
    left: 20px;
    height: 400px;
    width: 380px;
    z-index: 1;

    opacity: 0.7;
    cursor: pointer;
    transition: height 0.3s ease-out, width 0.3s ease-out;

    border-radius: 10px;
}

.google-map-midround {
    position: absolute;

    width: 70vw;
    height: 100vh;
    z-index: 0;
    opacity: 1;
}

.google-map-hover {
    height: 500px;
    width: 600px;

    max-width: 1000px;
    max-height: 700px;

    padding: 30px 30px 0px 0px;

    transition: height 0.3s ease-out, width 0.3s ease-out;

    opacity: 1;
}

.submit-button {
    position: absolute;
    width: 380px;
    left: 20px;
    bottom: 10px;
    padding: 0.75rem 1.5rem;

    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 5px;

    color: var(--p-surface-0);
    background-color: var(--p-surface-900);
    border: none;
    border-radius: 0.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: height 0.3s ease-out, width 0.3s ease-out;
}

.submit-button-hover {
    width: 600px;
    max-width: 1000px;
    transition: height 0.3s ease-out, width 0.3s ease-out;
}

#panorama_map {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 0;
}

.submit-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.live-stats {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
}

.bar {
    position: relative;
}

.connection-status-container {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 9999;

    background-color: var(--p-surface-900);
    color: var(--p-surface-0);
    border-radius: 10px;
    padding: 0.5rem;
}

.fullscreen-button {
    position: fixed;
    bottom: 20px;
    right: 60px;
    padding: 8px 10px;
    font-size: 12px;
    cursor: pointer;
    background-color: var(--p-surface-950);
    color: white;
    border: none;
    border-radius: 5px;
}

/* MOPBILE VIEW */
@media (max-width: 1024px) {
    .google-map-gameplay {
        height: 0px;
        width: 0px;
    }

    .google-map-hover {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        left: 0;
        height: 100vh;
        width: 100vw;

        max-width: 100vw;
        max-height: 100vh;
    }

    .mobile-map-button {
        position: fixed;
        bottom: 75px;
        left: 20px;
        z-index: 9999;

        background-color: var(--p-surface-900);
        fill: var(--p-primary-400);
    }

    .submit-button {
        position: absolute;
        bottom: 60;
        left: 20px;
        max-width: 200px;
        color: var(--p-surface-0);

        z-index: 3;
    }
}
</style>
