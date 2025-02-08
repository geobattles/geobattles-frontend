<template>
    <div class="container mx-auto">
        <div class="flex flex-col md:flex-row justify-evenly flex-wrap">
            <div v-if="lobbyStore.lobbySettings" class="w-full md:w-1/2 flex flex-col gap-5 pr-0 md:pr-3 max-w-[40rem] m-auto">
                <!-- Define lobby name section -->
                <LobbySettingsName />

                <!-- Define lobby GameMode section -->
                <LobbySettingsGameMode />

                <!-- Define lobby round timer section -->
                <LobbySettingsTimer />

                <!-- Define lobby rounds, attempts and max players section -->
                <div class="flex flex-row flex-wrap justify-around gap-2">
                    <LobbySettingsRounds />
                    <LobbySettingsAttempts />
                    <LobbySettingsMaxPlayers />
                </div>

                <!-- Define lobby score factor section -->
                <LobbySettingsScoreFactor class="mt-4" />
                <LobbyScoreVisualizer :scoreFactor="lobbyStore.lobbySettings.conf.scoreFactor" :animate="false" />

                <!-- Define lobby dynamic lives and place bonus section -->
                <div class="flex flex-row gap-2" style="scale: 0.9">
                    <LobbySettingsToggle label="Dynamic lives" v-model="lobbyStore.lobbySettings.conf.dynLives" />
                    <LobbySettingsToggle label="Place bonus" v-model="lobbyStore.lobbySettings.conf.placeBonus" />
                </div>

                <!-- Define lobby powerups section -->
                <div class="flex flex-row gap-2 mt-2" style="scale: 0.9">
                    <LobbySettingsToggle label="Double score" v-model="lobbyStore.lobbySettings.conf.powerups[0]" />
                    <LobbySettingsToggle label="Duel battle" v-model="lobbyStore.lobbySettings.conf.powerups[1]" />
                </div>
            </div>

            <!-- Component to select countries which user wants to play -->
            <div class="w-full md:w-1/2 max-w-[40rem] m-auto">
                <Panel header="Country Settings">
                    <LobbySettingsCountries style="max-height: 800px" />
                </Panel>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const lobbyStore = useLobbyStore();

onMounted(() => {
    // Will lock lobbySettings for the user if he is modifying the settings
    lobbyStore.isUpdatingSettings = true;
});

onUnmounted(() => {
    // Apply the lobby settings when user closes the modify settings dialog and unlock the settings
    lobbyStore.applyLobbySettings();
    lobbyStore.isUpdatingSettings = false;
});
</script>

<style scoped>
.container {
    max-width: 100%;
}
</style>
