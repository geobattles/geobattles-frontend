<template>
    <div id="vue-app">
        <NuxtPage />
    </div>
</template>

<script>
export default {
    setup() {
        if (process.server) {
            // Read ENV variables
            const runtimeConfig = useRuntimeConfig();
            console.log("App.vue was SSR-ed"); //! Dev
            const script = `https://maps.googleapis.com/maps/api/js?key=${runtimeConfig.public.GMAPS_API}&v=weekly`;

            useHead({
                script: [{ src: script, defer: true, async: true }],
                title: `GeoBattles`,
            });
            useBackendAPI().value = runtimeConfig.public.DEV_BACKEND_API_HOST;
        }

        if (process.client) {
            const saved_username = useCookie("saved_username");
            usePlayerInfo().value.name = saved_username.value;
        }
    },
};
</script>

<style>
body {
    /* Set background image */
    background: url("/images/earth.webp") no-repeat center center fixed;
    background-size: cover; /* Resize the background image to cover the entire container */
}
</style>
