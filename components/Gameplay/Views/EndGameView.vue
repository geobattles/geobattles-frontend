<template>
    <div class="flex flex-col md:flex-row">
        <div class="flex flex-col justify-center gap-5 p-1 w-full md:w-[30vw] h-[50vh] md:h-auto">
            <Panel pt:header:class="text-xs lg:text-base" header="Total Results">
                <GameplayTotalStatistics class="text-xs lg:text-base" />
            </Panel>
            <div class="flex flex-col gap-2">
                <Button type="button" class="m-auto" label="NEXT GAME" icon="pi pi-play-circle" @click="gameFlowManager?.sendStartRoundSocketMessage" severity="primary" size="small" />
                <Button @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal" type="button" class="m-auto" label="Modify Lobby Settings" icon="pi pi-cog" severity="info" size="small" />
            </div>
        </div>
        <div class="google-map-finished-position"></div>

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

// Watch for lobby settings modal
watch(
    () => lobbyStore.modifySettingsModal,
    (newVal) => {
        if (!newVal) lobbyStore.applyLobbySettings();
    }
);

const isVertical = ref(window.innerWidth < window.innerHeight);

const updateOrientation = () => {
    isVertical.value = window.innerWidth < window.innerHeight;

    const mapHTML = googleMapHTML;
    if (mapHTML.value) {
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
.google-map-endgame-container {
    width: 70vw;
    height: 100vh;
}

.google-map-endgame-container-vertical {
    width: 100vw;
    height: 50vh;
}
</style>
