<template>
    <div>
        <Header />
        <div class="main-content flex flex-wrap gap-0 md:gap-5 justify-center text-xs md:text-base">
            <Panel class="basis-1/2 md:basis-1/3" header="Lobby Settings" :class="{ 'player-view': !isPlayerAdmin() }" style="min-width: 250px">
                <LobbyDisplaySettings />
                <div style="text-align: center">
                    <Button @click="modify_settings_modal = !modify_settings_modal" type="button" label="Modify Settings" icon="pi pi-cog" badgeSeverity="contrast" outlined />
                </div>
            </Panel>

            <div class="basis-1/2 md:basis-1/3 text-sm md:text-base">
                <Button v-if="isPlayerAdmin()" @click="gameFlowManager?.sendStartRoundSocketMessage" size="large" label="Start Game" icon="pi pi-play-circle" badgeSeverity="contrast" :disabled="start_disabled" />
                <div v-else style="color: white">Waiting for admin to start the game</div>
                <div class="flex justify-evenly mt-5">
                    <div class="flex flex-col">
                        <div class="mb-1">Lobby code</div>
                        <div class="text-xl" style="letter-spacing: 2px">{{ lobby_settings.ID }}</div>
                    </div>
                    <div class="flex flex-col">
                        <div class="mb-1">Connection Status</div>
                        <ConnectionStatus />
                    </div>
                </div>
                <LobbyPlayerList class="text-sm md:text-base m-auto mt-5" style="max-width: 350px; min-width: 250px" />
            </div>
        </div>
        <Dialog v-model:visible="modify_settings_modal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_settings = useLobbySettings();
        const start_disabled = ref(false); // Preventing double click
        const country_list = useCountryList();
        const filtered_country_list = useFilteredCountryList();
        const is_guard_disabled = ref(false);
        const modify_settings_modal = useModifySettingsModal();
        const gameFlowManager = useGameFlowManager();

        onMounted(async () => {
            await fetchCountryList();
            // If ccList is empty it populate it with all ccodes. Happend only on first load.
            if (lobby_settings.value.conf.ccList.length === 0) lobby_settings.value.conf.ccList = Object.values(country_list.value);
            filtered_country_list.value = country_list.value;

            initGameFlowManager("BattleRoyale"); // Initialize GameFlowManager with default BattleRoyale game mode
        });

        watch(modify_settings_modal, (newVal) => {
            if (!newVal) applyLobbySettings();
        });

        onBeforeRouteLeave((to, from, next) => {
            if (is_guard_disabled.value) return next(); // If guard is disabled, allow navigation (so we can easily navigate to /index page)
            if (to.name === "gameplay-id") return next(); // If next route is gameplay, allow navigation

            // Ask if user eally wants to leave lobby
            if (confirm("Are you sure you want to leave the lobby?")) {
                is_guard_disabled.value = true;
                leaveLobby();
                next();
                return navigateTo(to.path);
            } else next(false);
        });

        return { lobby_settings, start_disabled, modify_settings_modal, gameFlowManager, isPlayerAdmin };
    },
};
</script>

<style scoped>
.main-content {
    text-align: center;
    margin-top: 50px;
}

.player-view {
    opacity: 0.7;
    pointer-events: none;
}
</style>
