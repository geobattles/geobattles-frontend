<template>
    <div ref="google_panorama" id="panorama_map"></div>
</template>

<script lang="ts">
export default {
    setup() {
        const google_panorama = ref<HTMLElement | null>(null);
        const googleStore = useGoogleStore();

        onMounted(() => {
            if (!google_panorama.value) throw new Error("Google Panorama DOM element not found");

            // Append existing Google Panorama HTML to the DOM or create new one
            if (googleStore.isGoogleInitialized) {
                google_panorama.value.appendChild(googleStore.getPanoramaHTML);
            } else {
                googleStore.setPanoramaHTML(google_panorama.value);
                googleStore.initalizePanoramaView(google_panorama.value); // Init Google Map
            }
        });

        return { google_panorama };
    },
};
</script>

<style scoped></style>
