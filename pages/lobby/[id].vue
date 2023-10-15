<template>
    <div>
        <Header />
        <div class="main-content">
            <div class="settings-block">
                <LobbyDisplaySettings />
            </div>
            <div class="lobby-block">
                <button v-if="isPlayerAdmin()" @click="next_round" :disabled="start_disabled" class="btn btn-green start-button">
                    <svg aria-hidden="true" class="arrow-icon" fill="white" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    <span>Start Game</span>
                </button>
                <div v-else style="color: white">Waiting for admin to start the game</div>
                <div class="lobby-code">Lobby code: {{ lobby_settings.ID }}</div>
                <!-- <BattleRoyalJoinUrl /> -->
                <LobbyPlayerList style="margin-top: 30px" />
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

        const next_round = Gameplay.nextRound;

        onMounted(async () => {
            await fetchCountryList();
            // If ccList is empty it populate it with all ccodes. Happend only on first load.
            if (lobby_settings.value.conf.ccList.length === 0) lobby_settings.value.conf.ccList = Object.values(country_list.value);
            filtered_country_list.value = country_list.value;
        });

        return { lobby_settings, start_disabled, next_round, isPlayerAdmin };
    },
};
</script>

<style scoped>
.main-content {
    text-align: center;
    width: 100%;
}

.settings-block {
    display: inline-block;
    vertical-align: top;
    min-width: 450px;
}

.lobby-block {
    display: inline-block;
    vertical-align: top;
    width: 24rem;
    margin-left: 1.75rem;
}

.start-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: auto;
}

.arrow-icon {
    width: 1.5rem;
    margin-right: 1rem;
}

.lobby-code {
    color: white;
    margin-top: 30px;
}

/* @media applies to screen of max width 768px */
@media (max-width: 768px) {
    .settings-block {
    }

    .join-block {
        margin-left: 0rem;
    }
}
</style>
