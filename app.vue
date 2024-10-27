<template>
    <div id="vue-app">
        <div class="initial-loader" v-if="is_loading">
            <span>Loading...</span>
            <ProgressSpinner />
        </div>
        <div id="my_vue_app" ref="vue_app">
            <NuxtPage />
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const vue_app = ref<HTMLElement | null>(null);

        // Read ENV variables
        const runtimeConfig = useRuntimeConfig();
        const script = `https://maps.googleapis.com/maps/api/js?key=${runtimeConfig.public.GMAPS_API}&v=weekly&loading=async`;

        useHead({
            script: [{ src: script, defer: true, async: true }],
            title: `GeoBattles`,
        });

        useBackendAPI().value = runtimeConfig.public.DEV_BACKEND_API_HOST;

        onMounted(() => {
            const { isAuthenticated } = useAuth();
            const playerTokenCookie = useCookie("saved_token");

            if (playerTokenCookie.value) {
                const tokenData = parseJwt(playerTokenCookie.value);
                if (tokenData && tokenData.exp > Math.floor(Date.now() / 1000)) {
                    usePlayerInfo().value.username = tokenData.user_name;
                    usePlayerInfo().value.ID = tokenData.uid;
                    usePlayerInfo().value.displayName = tokenData.display_name;
                    isAuthenticated.value = true;
                } else {
                    playerTokenCookie.value = null; // Clear invalid or expired token
                    isAuthenticated.value = false;
                }
            } else {
                isAuthenticated.value = false;
            }

            // const img = new Image();
            // img.src = "/images/earth.webp";
            // img.onload = () => (vue_app.value !== null ? (vue_app.value.style.backgroundImage = "url(/images/earth.webp)") : "");
        });

        const is_loading = ref(true);
        const nuxtApp = useNuxtApp();

        onBeforeMount(() => {
            nuxtApp.hooks.hook("page:start", () => {
                is_loading.value = true;
            });
            nuxtApp.hooks.hook("page:finish", () => {
                is_loading.value = false;
            });
        });

        return {
            vue_app,
            is_loading,
        };
    },
};
</script>

<style>
html {
    font-size: 14px;
}
body {
    /* background: url("/images/earth.webp") no-repeat center center fixed; */
    background-size: cover; /* Resize the background image to cover the entire container */
}

#my_vue_app {
    background-color: var(--p-surface-900);
    min-height: 100vh;
}

.initial-loader {
    position: fixed;
    z-index: 9999;

    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--p-zinc-950);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;

    font-size: 20px;
}
</style>
