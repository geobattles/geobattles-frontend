<template>
    <div id="gameplay_container">
        <div ref="google_map" id="google_map"></div>
        <button class="submit-button" @click="submitGuess">Submit</button>
        <div ref="google_panorama" id="panorama_map"></div>
        <GameplayLiveStatistics class="live-stats" />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const google_map = ref<HTMLElement | null>(null);
        const google_panorama = ref<HTMLElement | null>(null);

        // TODO: Disable submit as on old version

        onMounted(() => {
            if (!google_map.value) throw new Error("Google Map DOM element not found");

            initalizeNewGoogleMap(google_map.value); // Init Google Map
            initalizeNewPanoramaView(google_panorama.value); // Init Google Panorama
            addMapClickListener(); // Init Google Map click listener
            googleMapDOMTracker(google_map.value); // Watch and move Google Map DOM element
        });
        return { google_map, google_panorama, submitGuess };
    },
};
</script>

<style scoped>
#google_map {
    position: absolute;
    bottom: 50px;
    left: 0;
    height: 400px;
    width: 400px;
    z-index: 1;
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
    z-index: 2;

    padding: 10px;
}

.live-stats {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
}
</style>
