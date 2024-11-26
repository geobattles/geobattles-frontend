// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";

export default defineNuxtConfig({
    devtools: { enabled: true },
    ssr: false,

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

    modules: ["@nuxtjs/tailwindcss", "@primevue/nuxt-module", "@pinia/nuxt"],

    css: ["primeicons/primeicons.css"],

    vite: {
        optimizeDeps: {
            include: ["primevue/toggleswitch", "primevue/inputnumber", "primevue/slider", "primevue/radiobutton", "primevue/checkbox", "primevue/panel", "primevue/button", "primevue/tabmenu", "primevue/card", "primevue/dropdown", "primevue/fieldset", "primevue/inputswitch", "primevue/progressbar", "primevue/progressspinner", "primevue/menubar", "primevue/badge", "primevue/inputtext", "primevue/floatlabel", "primevue/divider", "primevue/datatable", "primevue/column", "primevue/usetoast", "primevue/toast", "primevue/menu", "primevue/ripple", "primevue/dialog", "primevue/tag"],
        },
    },

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

    compatibilityDate: "2024-10-06",
});
