// https://nuxt.com/docs/api/configuration/nuxt-config
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
    modules: ["nuxt-primevue"],
    css: ["@/assets/main.css", "primevue/resources/themes/lara-dark-green/theme.css", "primeicons/primeicons.css"],

    //@ts-ignore
    primevue: {
        options: {
            ripple: true,
        },
        components: {
            include: ["Calendar", "Slider", "Button", "TabMenu", "InputNumber", "Card", "Dropdown", "Fieldset", "Checkbox", "FileUpload", "MultiSelect", "Panel", "InputSwitch", "InputNumber", "ProgressBar", "ProgressSpinner", "MenuBar", "Badge", "Avatar", "InputText", "FloatLabel", "Divider", "RadioButton", "DataTable", "Column"],
        },
        cssLayerOrder: "tailwind-base, tailwind-utilities, primevue",
    },

    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },
});
