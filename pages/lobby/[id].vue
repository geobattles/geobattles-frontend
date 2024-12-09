<template>
    <div class="h-screen overflow-scroll">
        <Header />
        <div class="main-content flex flex-wrap gap-0 justify-center lg:gap-5 text-xs lg:text-base">
            <Panel class="basis-1/2 lg:basis-1/3" header="Lobby Settings" style="min-width: 250px; max-width: 500px">
                <template #header class="flex justify-around">
                    <div class="font-bold text-base">Lobby Settings</div>
                </template>
                <template v-if="isPlayerAdmin()" #icons>
                    <Button @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal" type="button" label="Modify" icon="pi pi-cog" severity="contrast" />
                </template>
                <LobbyDisplaySettings />
            </Panel>
            <div class="basis-1/2 lg:basis-1/3 text-sm lg:text-base">
                <Button v-if="isPlayerAdmin()" @click="handleStartGameButton()" size="large" label="Start Game" icon="pi pi-play-circle" badgeSeverity="contrast" :loading="isPlayNowLoading" />
                <div v-else style="color: white">Waiting for admin to start the game</div>
                <div class="flex justify-evenly mt-5">
                    <div class="flex flex-col">
                        <div class="mb-1">Lobby code</div>
                        <div class="text-base lg:text-xl" style="letter-spacing: 2px">{{ lobbySettings?.ID }}</div>
                    </div>
                    <div class="flex flex-col">
                        <div class="mb-1">Connection Status</div>
                        <ConnectionStatus />
                    </div>
                </div>
                <div class="flex flex-col mt-2">
                    <Tag class="mt-2 m-auto cursor-pointer" :icon="inviteLinkTagSettings.icon" :severity="inviteLinkTagSettings.severity" :value="inviteLinkTagSettings.value" @click="copyInviteLink()" />
                </div>
                <LobbyPlayerList class="text-sm lg:text-base m-auto mt-5" style="max-width: 300px" />
            </div>
        </div>
        <Dialog v-model:visible="lobbyStore.modifySettingsModal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
    </div>
</template>

<script setup lang="ts">
const isGuardDisabled = ref(false);
const isPlayNowLoading = ref(false);
const inviteLink = ref("");
const inviteLinkTagSettings = ref({ value: "Copy Invite Link", severity: "info", icon: "pi pi-copy" });

// External services
const { lobbySettings, leaveLobby, isPlayerAdmin } = useLobbyStore();
const lobbyStore = useLobbyStore();
const country_list = useCountryList();
const filtered_country_list = useFilteredCountryList();
const gameFlowManager = useGameFlowManager();

useHead({
    title: "GeoBattles | Lobby",
});

onMounted(async () => {
    // Fetch country list
    try {
        await fetchCountryList();
    } catch (error) {
        console.error("Failed to fetch country list:", error);
    }

    // If ccList is empty it populate it with all ccodes. Happend only on first load.
    if (!lobbySettings) return console.error("Lobby settings not found");

    // Populate ccList
    if (lobbySettings.conf.ccList.length === 0) lobbySettings.conf.ccList = Object.values(country_list.value);
    filtered_country_list.value = country_list.value;

    // Initialize GameFlowManager with default BattleRoyale game mode
    initGameFlowManager("BattleRoyale");

    // Generate invite link
    inviteLink.value = `${window.location.origin}/lobby/join?id=${lobbySettings.ID}`;
});

const handleStartGameButton = () => {
    isPlayNowLoading.value = true;
    gameFlowManager.value?.sendStartRoundSocketMessage();
};

const copyInviteLink = () => {
    navigator.clipboard
        .writeText(inviteLink.value)
        .then(() => {
            inviteLinkTagSettings.value.value = "Copied";
            inviteLinkTagSettings.value.severity = "success";
            inviteLinkTagSettings.value.icon = "pi pi-check";

            setTimeout(() => {
                inviteLinkTagSettings.value.value = "Copy Invite Link";
                inviteLinkTagSettings.value.severity = "info";
                inviteLinkTagSettings.value.icon = "pi pi-copy";
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy invite link:", err);
        });
};

onBeforeRouteLeave((to, from, next) => {
    if (isGuardDisabled.value) return next(); // If guard is disabled, allow navigation (so we can easily navigate to /index page)
    if (to.name === "gameplay-id") return next(); // If next route is gameplay, allow navigation

    // Ask if user really wants to leave lobby
    if (confirm("Are you sure you want to leave the lobby?")) {
        isGuardDisabled.value = true;
        leaveLobby();
        next();
        return navigateTo(to.path);
    } else next(false);
});
</script>

<style scoped>
.main-content {
    text-align: center;
    margin: 1%;
}

.player-view {
    opacity: 0.7;
    pointer-events: none;
}
</style>
