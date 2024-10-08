<template>
    <div>
        <GameplayViewsCountdownView v-show="game_flow === 'STARTING'" />
        <div id="gameplay_container">
            <!-- BAR TIMER -->
            <GameplayTimerBar v-if="game_flow === 'PLAYING'" class="bar" style="z-index: 4" />
            <!-- GOOGLE MAP -->
            <GameplayGoogleMap default_class="google-map-gameplay" />
            <!-- GOOGLE PANORAMA -->
            <GameplayGooglePanorama />
            <!-- SUBMIT BUTTON -->
            <button ref="submit_button" class="submit-button" @click="handleSubmitClick()" :disabled="isSubmitButtonDisabled()">GUESS</button>
            <!-- LIVE STATISTICS -->
            <GameplayCountryBattleLiveStatistics class="live-stats" />
            <!-- MAP MOBILE BUTTON -->
            <button v-show="show_map_button && game_flow === 'PLAYING'" ref="toggle_map_mobile" class="rounded-full bg-zinc-900 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" fill="white" viewBox="0 0 576 512">
                    <path d="M565.6 36.24C572.1 40.72 576 48.11 576 56V392C576 401.1 569.8 410.9 560.5 414.4L392.5 478.4C387.4 480.4 381.7 480.5 376.4 478.8L192.5 417.5L32.54 478.4C25.17 481.2 16.88 480.2 10.38 475.8C3.882 471.3 0 463.9 0 456V120C0 110 6.15 101.1 15.46 97.57L183.5 33.57C188.6 31.6 194.3 31.48 199.6 33.23L383.5 94.52L543.5 33.57C550.8 30.76 559.1 31.76 565.6 36.24H565.6zM48 421.2L168 375.5V90.83L48 136.5V421.2zM360 137.3L216 89.3V374.7L360 422.7V137.3zM408 421.2L528 375.5V90.83L408 136.5V421.2z" />
                </svg>
            </button>
        </div>
        <GameplayViewsMidRoundView v-show="game_flow === 'MID-ROUND'" />
        <GameplayViewsEndGameView v-show="game_flow === 'FINISHED'" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const game_flow = useGameFlow();
        const lobby_settings = useLobbySettings();

        const submit_button = ref<HTMLElement | null>(null);
        const toggle_map_mobile = ref<HTMLElement | null>(null);
        const show_map_button = ref(false);
        const is_guard_disabled = ref(false);

        onMounted(() => {
            Gameplay.mountingProcess(useGameType().value, toggle_map_mobile, show_map_button, submit_button);
        });

        const isSubmitButtonDisabled = () => {
            // TODO: Implement logic to disable submit button
            return false;
        };

        const handleSubmitClick = () => {
            Gameplay.submitGuess(); // Submit guess
        };

        onBeforeRouteLeave((to, from, next) => {
            if (is_guard_disabled.value) return next(); // If guard is disabled, allow navigation (so we can easily navigate to /index page)

            // Ask if user eally wants to leave lobby
            if (confirm("Are you sure you want to leave the lobby?")) {
                is_guard_disabled.value = true;
                next();
                leaveLobby();
                return navigateTo("/");
            } else next(false);
        });

        return { submit_button, game_flow, toggle_map_mobile, show_map_button, lobby_settings, handleSubmitClick, isSubmitButtonDisabled };
    },
};
</script>

<style scoped>
.google-map-gameplay {
    position: absolute;
    bottom: 60px;
    left: 20px;
    height: 400px;
    width: 380px;
    z-index: 1;

    opacity: 0.7;
    cursor: pointer;
    transition: height 0.3s ease-out, width 0.3s ease-out;

    border-radius: 10px;
}

.google-map-midround {
    position: absolute;

    width: 70vw;
    height: 100vh;
    z-index: 0;
    opacity: 1;
}

.google-map-hover {
    height: 500px;
    width: 600px;

    max-width: 1000px;
    max-height: 700px;

    padding: 30px 30px 0px 0px;

    transition: height 0.3s ease-out, width 0.3s ease-out;

    opacity: 1;
}

.submit-button {
    position: absolute;
    width: 380px;
    left: 20px;
    bottom: 10px;
    padding: 0.75rem 1.5rem;

    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 5px;

    color: white;
    background-color: var(--p-zinc-900);
    border: none;
    border-radius: 0.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: height 0.3s ease-out, width 0.3s ease-out;
}

.submit-button-hover {
    width: 600px;
    max-width: 1000px;
    transition: height 0.3s ease-out, width 0.3s ease-out;
}

#panorama_map {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 0;
}

.submit-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.live-stats {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
}

.bar {
    position: relative;
}

/* MOPBILE VIEW */
@media (max-width: 1000px) {
    .google-map-gameplay {
        height: 0px;
        width: 0px;
    }

    .google-map-hover {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        left: 0;
        height: 100vh;
        width: 100vw;

        max-width: 100vw;
        max-height: 100vh;
    }

    button {
        position: absolute;
        bottom: 110px;
        left: 30px;
        color: var(--text-color);

        z-index: 3;
    }
}
</style>
