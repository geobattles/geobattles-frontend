<template>
    <div>
        <Header />
        <div class="main-content">
            <div class="settings-block">
                <LobbyDisplaySettings />
            </div>
            <div class="lobby-block">
                <Button v-if="isPlayerAdmin()" @click="next_round" size="large" label="Start Game" icon="pi pi-play-circle" badgeSeverity="contrast" :disabled="start_disabled" />
                <div v-else style="color: white">Waiting for admin to start the game</div>
                <div class="lobby-code">Lobby code: {{ lobby_settings.ID }}</div>
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
        const is_guard_disabled = ref(false);

        onMounted(async () => {
            await fetchCountryList();
            // If ccList is empty it populate it with all ccodes. Happend only on first load.
            if (lobby_settings.value.conf.ccList.length === 0) lobby_settings.value.conf.ccList = Object.values(country_list.value);
            filtered_country_list.value = country_list.value;
        });

        onBeforeRouteLeave((to, from, next) => {
            if (is_guard_disabled.value) return next(); // If guard is disabled, allow navigation (so we can easily navigate to /index page)
            if (to.name === "gameplay-BattleRoyale-id") return next(); // If next route is gameplay, allow navigation

            // Ask if user eally wants to leave lobby
            if (confirm("Are you sure you want to leave the lobby?")) {
                is_guard_disabled.value = true;
                leaveLobby();
                next();
                return navigateTo("/");
            } else next(false);
        });

        return { lobby_settings, start_disabled, next_round, isPlayerAdmin };
    },
};
</script>

<style scoped>
.main-content {
    text-align: center;
    width: 100%;

    margin-top: 50px;
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

/* .start-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: auto;
} */

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
