<template>
    <div>
        <div ref="google_map" id="map"></div>
        <button @click="submitGuess">Submit</button>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const google_map = ref();

        onMounted(() => {
            initalizeNewGoogleMap(google_map.value);
            addMapClickListener();
        });
        return { google_map, submitGuess };
    },
};
</script>

<style scoped>
#map {
    height: 500px;
    width: 500px;
}
</style>
