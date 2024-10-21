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
            const existingMap = useGoogleMapHTML().value;
            console.log("Existing Google Map", existingMap);
            if (existingMap) {
                console.log("Google Map HTML already exists");
                google_map.value.appendChild(existingMap);
            } else {
                console.log("Google Map HTML does not exist so creating new one");
                useGoogleMapHTML().value = google_map.value;
                initalizeNewGoogleMap(google_map.value); // Init Google Map
            }
        });

        return { google_map, props };
    },
};
</script>

<style scoped></style>
