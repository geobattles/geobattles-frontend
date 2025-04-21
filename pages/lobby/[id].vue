<template>
    <div class="h-screen overflow-scroll">
        <Header />
        <div class="main-content flex flex-wrap justify-center text-xs lg:text-base">
            <!-- Lobby Settings Content -->
            <Panel class="basis-full sm:basis-1/2" header="Lobby Settings">
                <template #header class="flex justify-around">
                    <div class="font-bold text-base">Lobby Settings</div>
                </template>
                <template v-if="isPlayerAdmin()" #icons>
                    <Button
                        @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal"
                        type="button"
                        label="Modify"
                        variant="outlined"
                        icon="pi pi-cog"
                        severity="contrast"
                    />
                </template>
                <LobbyDisplaySettings />
            </Panel>

            <!-- Game Info Content -->
            <div class="basis-full sm:basis-1/2 text-sm lg:text-base">
                <LobbyStartGame />
                <div class="flex justify-evenly mt-5">
                    <div class="flex flex-col">
                        <div class="mb-1">Lobby code</div>
                        <div class="text-base lg:text-xl" style="letter-spacing: 2px">
                            {{ lobbyStore.lobbySettings?.ID }}
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="mb-1">Connection Status</div>
                        <SocketConnectionStatus />
                    </div>
                </div>
                <LobbyInviteLink class="mt-3" />
                <LobbyPlayerList class="text-sm lg:text-base m-auto mt-5" style="max-width: 300px" />
            </div>
        </div>

        <!-- Dialog to update Lobby Settings -->
        <Dialog v-model:visible="lobbyStore.modifySettingsModal" header="Lobby Settings" modal :style="{ width: '95%' }" pt:header:class="!p-3 lg:!p-5">
            <template #header>
                <span class="text-base lg:text-xl font-bold">Lobby Settings</span>
            </template>
            <LobbyModifySettings />
        </Dialog>

        <!-- Connection Status Dialog -->
        <GameplayLostConnectionDialog @leaveLobby="handleClickLeaveLobby()" />
    </div>
</template>

<script setup lang="ts">
const isGuardDisabled = ref(false);
const wantsToLeaveLobby = ref(false);

// External services
const { leaveLobby, isPlayerAdmin } = useLobbyStore();
const lobbyStore = useLobbyStore();
const country_list = useCountryList();
const filtered_country_list = useFilteredCountryList();
const router = useRouter();

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
    if (!lobbyStore.lobbySettings) return console.error("Lobby settings not found");

    // Populate ccList
    if (lobbyStore.lobbySettings.conf.ccList.length === 0) lobbyStore.lobbySettings.conf.ccList = Object.values(country_list.value);
    filtered_country_list.value = country_list.value;
});

const handleClickLeaveLobby = () => {
    wantsToLeaveLobby.value = true;
    router.push("/");
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
    max-width: 1000px;
    margin: auto;
    margin-top: 0px;
    padding: 1% 3%;
}

.player-view {
    opacity: 0.7;
    pointer-events: none;
}
</style>
