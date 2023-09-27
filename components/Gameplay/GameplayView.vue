<template>
    <div id="gameplay_container">
        <!-- BAR TIMER -->
        <GameplayTimerBar v-if="game_flow === 'PLAYING'" class="bar" style="z-index: 4" />
        <!-- GOOGLE MAP -->
        <div ref="google_map" id="google_map" class="google-map-gameplay"></div>
        <!-- GOOGLE PANORAMA -->
        <div ref="google_panorama" id="panorama_map"></div>
        <!-- SUBMIT BUTTON -->
        <button class="submit-button text-white bg-blue-400 dark:bg-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center" @click="handleSubmitClick" :disabled="isSubmitButtonDisabled() || is_submit_disabled">Submit</button>
        <!-- LIVE STATISTICS -->
        <GameplayLiveStatistics class="live-stats" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const google_map = ref<HTMLElement | null>(null);
        const google_panorama = ref<HTMLElement | null>(null);
        const game_flow = useGameFlow();

        const is_submit_disabled = useIsSubmitDisabled();

        onMounted(() => {
            if (!google_map.value) throw new Error("Google Map DOM element not found");

            initalizeNewGoogleMap(google_map.value); // Init Google Map
            initalizeNewPanoramaView(google_panorama.value); // Init Google Panorama
            addMapClickListener(); // Init Google Map click listener
            googleMapDOMTracker(google_map.value); // Watch and move Google Map DOM element
        });

        const getPlayerAttempt = (player_id: string) => useResults().value[player_id].attempt;

        const isSubmitButtonDisabled = () => {
            if (useMapMarkers().value.length === 0) return true; // Disable if no markers

            //  Disable if number of markers equals number of attempts
            const player_id = usePlayerInfo().value.ID;
            if (!player_id) throw new Error("Player ID not found");
            if (useMapMarkers().value.length === getPlayerAttempt(player_id)) return true;

            return false; // Enable button
        };

        const handleSubmitClick = () => {
            useIsSubmitDisabled().value = true; // Disable submit button, preventing double clicks
            submitGuess(); // Submit guess
        };

        return { google_map, google_panorama, is_submit_disabled, game_flow, handleSubmitClick, isSubmitButtonDisabled };
    },
};
</script>

<style scoped>
.google-map-gameplay {
    position: absolute;
    bottom: 50px;
    left: 0;
    height: 400px;
    width: 400px;
    z-index: 1;
}

.google-map-midround {
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 0;
}

#panorama_map {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 0;
}

.submit-button {
    position: absolute;
    bottom: 5px;
    left: 10px;
    z-index: 3;

    padding: 10px;
}

.submit-button:disabled {
    cursor: not-allowed;
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
</style>
