<template>
    <div ref="vue_app" id="vue-app">
        <NuxtPage />
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const vue_app = ref<HTMLElement | null>(null);

        if (process.server) {
            // Read ENV variables
            const runtimeConfig = useRuntimeConfig();
            console.log("App.vue was SSR-ed"); //! Dev
            const script = `https://maps.googleapis.com/maps/api/js?key=${runtimeConfig.public.GMAPS_API}&v=weekly&loading=async`;

            useHead({
                script: [{ src: script, async: true, defer: true }],
                title: `GeoBattles`,
            });

            useBackendAPI().value = runtimeConfig.public.DEV_BACKEND_API_HOST;
        }

        if (process.client) {
            const saved_username = useCookie("saved_username");
            console.log("saved_username: ", saved_username.value); //! Dev
            if (typeof saved_username.value === "string") usePlayerInfo().value.name = saved_username.value;

            const img = new Image();
            img.src = "/images/earth.webp";
            img.onload = () => (vue_app.value !== null ? (vue_app.value.style.backgroundImage = "url(/images/earth.webp)") : "");
        }

        return { vue_app };
    },
};
</script>

<style>
#vue-app {
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    height: 100%;
    min-height: 100vh;
}
</style>
