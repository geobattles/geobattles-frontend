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
        const auth = useAuthenticationService().value;

        // Read ENV variables
        const runtimeConfig = useRuntimeConfig();

        useHead({
            title: `GeoBattles`,
        });

        useBackendAPI().value = runtimeConfig.public.DEV_BACKEND_API_HOST;

        onMounted(() => {
            try {
                auth.saveTokenData();
            } catch (error) {
                console.log("Failed to save token data:", error);
            }

            // Dynamically load the provided Google Maps script
            const script = document.createElement("script");
            script.innerHTML = `
                (g => {
                    var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window;
                    b = b[c] || (b[c] = {});
                    var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => {
                        await (a = m.createElement("script"));
                        e.set("libraries", [...r] + "");
                        for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
                        e.set("callback", c + ".maps." + q);
                        a.src = \`https://maps.\${c}apis.com/maps/api/js?\` + e;
                        d[q] = f;
                        a.onerror = () => h = n(Error(p + " could not load."));
                        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
                        m.head.append(a);
                    }));
                    d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
                })({
                    key: "${runtimeConfig.public.GMAPS_API}",
                    v: "weekly",
                });
            `;
            document.head.appendChild(script);

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
