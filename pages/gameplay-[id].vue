<template>
    <div ref="gameplayPageContainer">
        <!-- Countdown View (before starting next round) -->
        <GameplayViewsCountdownView v-if="gameMode.modeLogic.currentState === 'STARTING'" />

        <!-- Gameplay View (when game is playing and also starting to render StreetView in starting time) -->
        <GameplayViewsGameplayView v-show="gameMode.modeLogic.currentState === 'PLAYING' || gameMode.modeLogic.currentState === 'STARTING'" @leaveLobby="handleClickLeaveLobby()" />

        <!-- MidRound View (when game is in mid-round) -->
        <GameplayViewsMidRoundView v-show="gameMode.modeLogic.currentState === 'MID-ROUND'" @leaveLobby="handleClickLeaveLobby()" />

        <!-- EndGame View (when game is finished) -->
        <GameplayViewsEndGameView v-show="gameMode.modeLogic.currentState === 'FINISHED'" @leaveLobby="handleClickLeaveLobby()" />

        <!-- Screen dimensions display (debug purposes) -->
        <!-- <div class="screen-dimensions">Width: {{ screenWidth }}px, Height: {{ screenHeight }}px</div> -->

        <!-- Connection Status Dialog -->
        <GameplayLostConnectionDialog @leaveLobby="handleClickLeaveLobby()" />

        <!-- Toast when player leaves lobby -->
        <Toast :pt:root:class="'!w-48'" :pt:detail:class="'!text-xs'" class="w-24 text-sm" position="bottom-right" />
    </div>
</template>

<script setup lang="ts">
const wantsToLeaveLobby = ref(false);
const gameplayPageContainer = useTemplateRef<HTMLElement>("gameplayPageContainer");

// External services
const { leaveLobby } = useLobbyStore();
const gameMode = useGameMode(); // To get the current game state
const uiManager = useUIManagerStore();
const toast = useToast();
const router = useRouter();

// Screen width debugging
const screenWidth = ref(window.innerWidth);
const screenHeight = ref(window.innerHeight);
const updateDimensions = () => {
    screenWidth.value = window.innerWidth;
    screenHeight.value = window.innerHeight;
};

useHead({
    title: "GeoBattles | Gameplay",
});

onMounted(() => {
    // Add listener when player leaves lobby to show toast
    uiManager.on("showPlayerLeftToast", handlePlayerLeftToast);

    // Set the gameplay page container in UIManager
    if (gameplayPageContainer.value) uiManager.setGameplayPageContainer(gameplayPageContainer.value);

    // Add event listener for window resize
    window.addEventListener("resize", updateDimensions);
    updateDimensions();
});

onUnmounted(() => {
    uiManager.off("showPlayerLeftToast", handlePlayerLeftToast);

    // Remove event listener for window resize
    window.removeEventListener("resize", updateDimensions);

    // Leave lobby when component is unmounted
    leaveLobby();
});

onBeforeRouteLeave((to, from, next) => {
    if (wantsToLeaveLobby.value) {
        if (confirm("Are you sure you want to leave the lobby?")) {
            next();
        } else next(false);
    } else {
        next(false);
    }
    wantsToLeaveLobby.value = false;
});

const handleClickLeaveLobby = () => {
    wantsToLeaveLobby.value = true;
    router.push("/");
};

// When player leaves lobby, show toast
const handlePlayerLeftToast = (event: CustomEvent) => {
    toast.add({
        severity: "contrast",
        summary: `${event.detail.playerName} Left`,
        life: 3000,
    });
};
</script>

<style scoped>
.fullscreen-button {
    position: absolute;
    bottom: 20px;
    right: 60px;
    padding: 8px 10px;
    font-size: 12px;
    cursor: pointer;
    background-color: var(--p-surface-950);
    color: var(--p-surface-0);
    border-radius: 5px;
}

.screen-dimensions {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    z-index: 1000;
}
</style>
