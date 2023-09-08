<template>
    <div>
        <div v-show="game_flow === 'PLAYING'" id="gameplay playing">
            <div ref="google_map" id="google_map"></div>
            <button class="submit-button" @click="submitGuess">Submit</button>
            <div ref="google_panorama" id="panorama_map"></div>
            <GameplayLiveStatistics class="live-stats" />
        </div>
        <div v-show="game_flow === 'MID-ROUND'" id="gameplay mid-round">This is mid round</div>
        <div id="gameplay end-game"></div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const google_map = ref<HTMLElement | null>(null);
        const google_panorama = ref<HTMLElement | null>(null);
        const game_flow = useGameFlow();

        onMounted(() => {
            initalizeNewGoogleMap(google_map.value);
            initalizeNewPanoramaView(google_panorama.value);
            addMapClickListener();

            console.log(game_flow.value);
        });

        watch(game_flow, (newVal) => {
            console.log(newVal);
        });
        return { google_map, google_panorama, game_flow, submitGuess };
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

.gameplay {
    height: 100vh;
    width: 100vw;
}

.playing {
    z-index: 0;
}

.mid-round {
    z-index: 10;
}
</style>
