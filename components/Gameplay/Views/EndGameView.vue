<template>
    <div class="endgame-container">
        <div class="flex flex-col md:flex-row">
            <div class="flex flex-col justify-center gap-5 p-1 w-full md:w-[30dvw] h-[50dvh] md:h-auto">
                <Panel pt:header:class="text-xs lg:text-base" header="Total Results">
                    <GameplayTotalStatistics class="text-xs lg:text-base" />
                </Panel>
            </div>
            <div class="google-map-finished-position"></div>
        </div>
        <div v-if="isPlayerAdmin()" class="endgame-menu-container">
            <Button type="button" class="m-auto" label="NEXT GAME" icon="pi pi-play-circle" @click="gameFlowManager?.sendStartRoundSocketMessage" severity="primary" size="small" />
            <Button @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal" type="button" class="m-auto" label="Modify Lobby Settings" icon="pi pi-cog" severity="info" size="small" />
        </div>
        <div v-else class="next-round-button-container">
            <p class="text-center">GAMEOVER</p>
            <p class="text-xs text-center">Waiting for admin to start next...</p>
        </div>
        <Dialog v-model:visible="lobbyStore.modifySettingsModal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
    </div>
</template>

<script setup lang="ts">
// External services
const gameFlowManager = useGameFlowManager();
const lobbyStore = useLobbyStore();
const googleMapHTML = useGoogleMapHTML();
const uiManager = useUIManager();
const { isPlayerAdmin } = useLobbyStore();

// Watch for lobby settings modal
watch(
    () => lobbyStore.modifySettingsModal,
    (newVal) => {
        if (!newVal) lobbyStore.applyLobbySettings();
    }
);

const isVertical = ref(window.innerWidth < window.innerHeight);

const updateOrientation = () => {
    console.log("Orientation UPDATE is vertical: ", window.innerWidth < window.innerHeight);

    isVertical.value = window.innerWidth < window.innerHeight;

    const mapHTML = googleMapHTML;
    if (mapHTML.value && uiManager.value.getIsMobile()) {
        if (isVertical.value) {
            mapHTML.value.classList.add("google-map-endgame-container-vertical");
            mapHTML.value.classList.remove("google-map-endgame-container");
        } else {
            mapHTML.value.classList.add("google-map-endgame-container");
            mapHTML.value.classList.remove("google-map-endgame-container-vertical");
        }
    }
};

onMounted(() => {
    window.addEventListener("resize", updateOrientation);
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", updateOrientation);
});
</script>

<style>
.endgame-container {
    position: relative;
    height: 100dvh;
    width: 100dvw;
    background-color: var(--p-surface-800);
}

.endgame-menu-container {
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: var(--p-surface-900);
    padding: 10px 20px;

    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.google-map-endgame-container {
    width: 70dvw;
    height: 100dvh;
}

.google-map-endgame-container-vertical {
    width: 100dvw;
    height: 50dvh;
}
</style>
