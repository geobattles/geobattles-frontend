// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";
const sw = process.env.SW === "true";

export default defineNuxtConfig({
    devtools: { enabled: true },
    ssr: false,

    app: {
        head: {
            link: [{ rel: "icon", type: "image/png", href: "/logo.png" }],
        },
    },

    runtimeConfig: {
        public: {
            GMAPS_API: process.env.GMAPS_API || "",
            BACKEND_API_HOST: process.env.BACKEND_API_HOST || "",
            DEV_BACKEND_API_HOST: process.env.DEV_BACKEND_API_HOST,
        },
    },

    typescript: {
        typeCheck: true,
        strict: true,
    },

    modules: ["@nuxtjs/tailwindcss", "@primevue/nuxt-module", "@pinia/nuxt", "@vite-pwa/nuxt"],
    css: ["primeicons/primeicons.css"],

    vite: {
        optimizeDeps: {
            include: ["primevue/toggleswitch", "primevue/inputnumber", "primevue/slider", "primevue/radiobutton", "primevue/checkbox", "primevue/panel", "primevue/button", "primevue/tabmenu", "primevue/card", "primevue/dropdown", "primevue/fieldset", "primevue/inputswitch", "primevue/progressbar", "primevue/progressspinner", "primevue/menubar", "primevue/badge", "primevue/inputtext", "primevue/floatlabel", "primevue/divider", "primevue/datatable", "primevue/column", "primevue/usetoast", "primevue/toast", "primevue/menu", "primevue/ripple", "primevue/dialog", "primevue/tag", "primevue/knob", "primevue/chart"],
        },
    },

    // PRIMEVUE CONFIG
    primevue: {
        options: {
            ripple: true,
            inputVariant: "filled",
            theme: {
                preset: Aura,
                options: {
                    prefix: "p",
                    darkModeSelector: "system",
                    cssLayer: false,
                },
            },
        },

        autoImport: true,
    },

    // PWA CONFIG
    pwa: {
        strategies: sw ? "injectManifest" : "generateSW",
        srcDir: sw ? "service-worker" : undefined,
        filename: sw ? "sw.ts" : undefined,
        registerType: "autoUpdate",
        manifest: {
            name: "GeoBattles PWA",
            short_name: "GeoBattles",
            theme_color: "#00A155",
            description: "GeoLocation Guessing Game",
            icons: [
                {
                    src: "logo.png",
                    sizes: "1024x1024",
                    type: "image/png",
                },
            ],
        },
        workbox: {
            globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        },
        injectManifest: {
            globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        },
        client: {
            installPrompt: true,
            // you don't need to include this: only for testing purposes
            // if enabling periodic sync for update use 1 hour or so (periodicSyncForUpdates: 3600)
            periodicSyncForUpdates: 20,
        },
        devOptions: {
            enabled: true,
            suppressWarnings: true,
            navigateFallback: "/",
            navigateFallbackAllowlist: [/^\/$/],
            type: "module",
        },
    },

    compatibilityDate: "2024-10-06",
});
