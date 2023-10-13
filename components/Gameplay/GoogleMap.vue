<template>
    <div ref="google_map" id="google_map" :class="props.default_class"></div>
</template>

<script lang="ts">
export default {
    props: {
        default_class: String,
    },
    setup(props) {
        const google_map = ref<HTMLElement | null>(null);

        onMounted(() => {
            if (!google_map.value) throw new Error("Google Map DOM element not found");
            useGoogleMapHTML().value = google_map.value;
            initalizeNewGoogleMap(google_map.value); // Init Google Map
        });

        return { google_map, props };
    },
};
</script>

<style scoped></style>
