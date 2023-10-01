<template>
    <div ref="google_panorama" id="panorama_map"></div>
</template>

<script lang="ts">
export default {
    setup() {
        const google_panorama = ref<HTMLElement | null>(null);

        onMounted(() => {
            if (!google_panorama.value) throw new Error("Google Panorama DOM element not found");
            useGooglePanoramaHTML().value = google_panorama.value;
            initalizeNewPanoramaView(google_panorama.value); // Init Google Map
        });

        return { google_panorama };
    },
};
</script>

<style scoped></style>
