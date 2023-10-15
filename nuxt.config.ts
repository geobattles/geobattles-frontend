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
});
