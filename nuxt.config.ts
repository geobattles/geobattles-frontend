// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from "node:child_process";

// VERSION can be set by GHA or manually (if building locally)
// If not set, it will try to get the git commit hash
// If not possible, it will fallback to 'dev'
function getVersion() {
    if (process.env.VERSION) {
        return process.env.VERSION;
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

    experimental: {
        // Nuxt's build checker otherwise schedules a reload on the next navigation.
        checkOutdatedBuildInterval: false,
        // Even "manual" includes a crawler reload plugin in locked Nuxt 4.6.4.
        // Observe Vite failures in the notice without swallowing their rejection.
        emitRouteChunkError: false,
    },

    app: {
        head: {
            link: [
                { rel: "icon", type: "image/png", href: "/icons/icon-192.png" },
                { rel: "apple-touch-icon", type: "image/png", href: "/icons/apple-touch-icon.png", sizes: "180x180" },
            ],
        },
    },

    runtimeConfig: {
        BACKEND_SERVER_HOST: "",
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
        tsConfig: {
            compilerOptions: {
                types: ["google.maps"],
            },
        },
    },

    modules: ["@nuxtjs/tailwindcss", "@vite-pwa/nuxt"],
    css: ["~/assets/css/main.css"],
    postcss: {
        plugins: {
            // Nuxt 4 resolves ESM entries; Tailwind 3's directory import is not one.
            "tailwindcss/nesting": false,
            "tailwindcss/nesting/index.js": {},
        },
    },

    vite: {
        optimizeDeps: {
            // Avoid a late dependency-optimization reload during a round.
            include: ["@vue/devtools-core", "canvas-confetti"],
        },
    },

    // PWA CONFIG
    pwa: {
        strategies: "generateSW",
        registerType: "prompt",
        // One client-owned registration; no module reload or install-prompt interception.
        injectRegister: false,
        scope: "/",
        manifest: {
            id: "/",
            name: "GeoBattles PWA",
            short_name: "GeoBattles",
            start_url: "/",
            scope: "/",
            display: "standalone",
            theme_color: "#181818",
            background_color: "#181818",
            description: "GeoLocation Guessing Game",
            icons: [
                {
                    src: "/icons/icon-192.png",
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "any",
                },
                {
                    src: "/icons/icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any",
                },
            ],
        },
        workbox: {
            globPatterns: ["_nuxt/**/*.{js,css}", "icons/*.png", "gameplay/map-icons/*.svg", "images/*.png", "logo.png"],
            // The module can append Nuxt payload patterns; never cache page/private payloads.
            globIgnores: ["**/_payload.json", "**/_payload.js", "**/*.html"],
            runtimeCaching: [],
            navigateFallback: null,
            cleanupOutdatedCaches: true,
            // Only activate updates once ALL old app clients close (including other tabs).
            skipWaiting: false,
            // Give an initial, uncached page a controller without reloading it.
            clientsClaim: true,
        },
        client: {
            registerPlugin: false,
        },
        devOptions: {
            enabled: false,
        },
    },

    compatibilityDate: "2024-10-06",
});
