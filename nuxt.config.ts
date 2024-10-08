// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";

export default defineNuxtConfig({
    devtools: { enabled: false },

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

    imports: {
        autoImport: true,
    },

    modules: ["@nuxtjs/tailwindcss", "@primevue/nuxt-module"],
    css: ["primeicons/primeicons.css"],

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
        components: {
            include: ["Calendar", "Slider", "Button", "TabMenu", "InputNumber", "Card", "Dropdown", "Fieldset", "Checkbox", "FileUpload", "MultiSelect", "Panel", "InputSwitch", "InputNumber", "ProgressBar", "ProgressSpinner", "MenuBar", "Badge", "Avatar", "InputText", "FloatLabel", "Divider", "RadioButton", "DataTable", "Column"],
        },
    },

    compatibilityDate: "2024-10-06",
});
