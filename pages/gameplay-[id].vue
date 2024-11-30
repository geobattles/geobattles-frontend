<template>
    <div ref="gameplayPage">
        <!-- Toast when player leaves lobby -->
        <Toast position="bottom-right" />

        <!-- Countdown View (before starting next round) -->
        <GameplayViewsCountdownView v-if="gameFlowManager?.currentState === 'STARTING'" />

        <!-- Gameplay View (when game is playing) -->
        <GameplayViewsGameplayView v-show="gameFlowManager?.currentState === 'PLAYING'" @leaveLobby="handleClickLeaveLobby()" />

        <!-- MidRound View (when game is in mid-round) -->
        <GameplayViewsMidRoundView v-show="gameFlowManager?.currentState === 'MID-ROUND'" />

        <!-- EndGame View (when game is finished) -->
        <GameplayViewsEndGameView v-show="gameFlowManager?.currentState === 'FINISHED'" />
        <button @click="toggleFullscreen" class="fullscreen-button">Fullscreen</button>
    </div>
</template>

<script setup lang="ts">
import { useToast } from "primevue/usetoast";
const wantsToLeaveLobby = ref(false);
const gameplayPage = ref<HTMLElement | null>(null);

// External services
const { leaveLobby } = useLobbyStore();
const gameFlowManager = useGameFlowManager(); // To track the game state
const UIManager = useUIManager(); // To show toasts on player leave
const toast = useToast();
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
    // Add listener when player leaves lobby to show toast
    UIManager.value.on("showPlayerLeftToast", handlePlayerLeftToast);

    // Go fullscreen on less than 1024px
    if (gameplayPage.value && window.innerWidth < 1024) {
        gameplayPage.value.requestFullscreen({ navigationUI: "show" }).catch((err) => {
            alert(`Error switching to fullscreen: ${err.message} (${err.name})`);
        });
    }
});

onUnmounted(() => {
    UIManager.value.off("showPlayerLeftToast", handlePlayerLeftToast);
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

const handleClickLeaveLobby = () => {
    wantsToLeaveLobby.value = true;
    router.push("/");
};

// When player leaves lobby, show toast
const handlePlayerLeftToast = (event: CustomEvent) => {
    toast.add({ severity: "warn", summary: `Player ${event.detail.playerName} Left`, detail: `Player ${event.detail.playerName} has left the lobby`, life: 3000 });
};

const toggleFullscreen = () => {
    const elem = gameplayPage.value;
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
</style>
