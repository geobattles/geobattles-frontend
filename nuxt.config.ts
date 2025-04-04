// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";
import { execSync } from "child_process";

const sw = process.env.SW === "true";

// VERSION can be set by GHA or manually (if building locally)
// If not set, it will try to get the git commit hash
// If not possible, it will fallback to 'dev'
function getVersion() {
    if (process.env.VERSION) {
        return process.env.VERSION
    }

    // Try local git command
    try {
        return execSync("git rev-parse --short HEAD").toString().trim();
    } catch (error) {
        return "dev";
    }
}

export default defineNuxtConfig({
    devtools: { enabled: true },
    ssr: true,

    app: {
        head: {
            link: [{ rel: "icon", type: "image/png", href: "/logo.png" }],
        },
    },

    runtimeConfig: {
        public: {
            GMAPS_API: "",
            BACKEND_HOST: "",
            VERSION: getVersion(),
            BUILD_DATE: new Date().toISOString(),
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
            include: [
                "primevue/toggleswitch",
                "primevue/inputnumber",
                "primevue/slider",
                "primevue/radiobutton",
                "primevue/checkbox",
                "primevue/panel",
                "primevue/button",
                "primevue/tabmenu",
                "primevue/card",
                "primevue/dropdown",
                "primevue/fieldset",
                "primevue/inputswitch",
                "primevue/progressbar",
                "primevue/progressspinner",
                "primevue/menubar",
                "primevue/badge",
                "primevue/inputtext",
                "primevue/floatlabel",
                "primevue/divider",
                "primevue/datatable",
                "primevue/column",
                "primevue/usetoast",
                "primevue/toast",
                "primevue/menu",
                "primevue/ripple",
                "primevue/dialog",
                "primevue/tag",
                "primevue/knob",
                "primevue/chart",
                "primevue/tabs",
                "primevue/tabpanels",
                "primevue/tabpanel",
                "primevue/tablist",
                "primevue/tab",
                "primevue/password",
            ],
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
        strategies: "generateSW",
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
            navigateFallback: null, // Don't use a fallback for navigation

            // Add these options for better control over service worker updates
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,
        },
        client: {
            installPrompt: true,
        },
        devOptions: {
            enabled: true,
            suppressWarnings: true,
            type: "module",
        },
    },

    compatibilityDate: "2024-10-06",
});
