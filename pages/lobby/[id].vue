<template>
    <div>
        <Header />
        <div class="main-content">
            <div class="w-full max-w-7xl">
                <div class="inline-block w-full md:w-3/5">
                    <LobbyDisplaySettings class="m-auto" />
                </div>
                <div class="inline-block align-top w-96 ml-7">
                    <div class="w-50 mb-11 mt-5">
                        <button @click="nextRound" :disabled="start_disabled" type="button" class="text-white text-xl p-3 bg-green-500 hover:bg-green-600 focus:ring-4 focus:outline-none font-medium rounded-lg text-center inline-flex items-center mr-2">
                            <svg aria-hidden="true" class="w-8 h-8 ml-4" fill="white" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                            <span class="ml-16 mr-8">Start Game</span>
                        </button>
                        <!-- <div v-else>Waiting for admin to start the game</div> -->
                    </div>
                    <span class="text-white text-lg">URL for your friends to join: {{ lobby_settings.ID }}</span>
                    <!-- <BattleRoyalJoinUrl /> -->
                    <LobbyPlayerList />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const lobby_settings = useLobbySettings();
        const start_disabled = ref(false); // Preventing double click
        const country_list = useCountryList();
        const filtered_country_list = useFilteredCountryList();

        onMounted(async () => {
            await fetchCountryList();
            // If ccList is empty it populate it with all ccodes. Happend only on first load.
            if (lobby_settings.value.conf.ccList.length === 0) lobby_settings.value.conf.ccList = Object.values(country_list.value);
            filtered_country_list.value = country_list.value;
        });

        return { lobby_settings, start_disabled, nextRound };
    },
};
</script>

<style scoped>
.main-content {
    text-align: center;
}
</style>
