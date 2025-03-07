<template>
    <div ref="google_map" id="google_map" :class="props.default_class"></div>
</template>

<script lang="ts">
export default {
    props: {
        default_class: String,
    },
    setup(props) {
        const google_map = useTemplateRef<HTMLElement>("google_map");
        const googleStore = useGoogleStore();

        onMounted(() => {
            if (!google_map.value) throw new Error("Google Map DOM element not found");

            // Append existing Google Map HTML to the DOM or create new one
            if (googleStore.isGoogleInitialized) {
                google_map.value.appendChild(googleStore.getMapHTML);
            } else {
                googleStore.setMapHTML(google_map.value);
                googleStore.initializeGoogleMap(google_map.value); // Init Google Map
            }
        });

        return { google_map, props };
    },
};
</script>

<style scoped></style>
