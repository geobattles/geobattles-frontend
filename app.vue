<template>
    <div>
        <NuxtPage />
    </div>
</template>

<script>
export default {
    setup() {
        if (process.server) {
            // Read ENV variables
            const runtimeConfig = useRuntimeConfig();
            console.log("App.vue was SSR-ed"); //! Dev
            console.log(`https://maps.googleapis.com/maps/api/js?key=${runtimeConfig.public.GMAPS_API}&v=weekly`); //! Dev
            const script = `https://maps.googleapis.com/maps/api/js?key=${runtimeConfig.public.GMAPS_API}&v=weekly`;

            useHead({
                script: [{ src: script, defer: true, async: true }],
                title: `GeoBattles`,
            });
            useBackendAPI().value = runtimeConfig.public.DEV_BACKEND_API_HOST;
        }

        if (process.client) {
            const saved_username = useCookie("saved_username");
            console.log("saved_username.value: ", saved_username.value); //! Dev
            usePlayerInfo().value.name = saved_username.value;
        }
    },
};
</script>

<style>
* {
    margin: 0;
    padding: 0;
}

*,
*::before,
*::after {
    box-sizing: inherit;
}

html {
    box-sizing: border-box;

    --color-primary: #4a6294;
    --color-primary-light: #6786ca;
    --color-primary-dark: #ba265d;

    --color-grey-light-1: #faf9f9;
    --color-grey-light-2: #f4f2f2;
    --color-grey-light-3: #f0eeee;
    --color-grey-light-4: #ccc;

    --color-grey-dark-1: #333;
    --color-grey-dark-2: #777;
    --color-grey-dark-3: #999;

    --shadow-dark: 0 2rem 6rem (0, 0, 0, 0.3);
}

body {
    /* Set background image */
    background: url("/images/earth.webp") no-repeat center center fixed;
    background-size: cover; /* Resize the background image to cover the entire container */

    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}

/* Default button */
.btn {
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    border: none;
}

.btn-blue {
    background-color: #3490dc;
    color: #fff;
}

.btn-blue:hover {
    background-color: #2779bd;
}

.btn-red {
    background-color: #e3342f;
    color: #fff;
}

.btn-red:hover {
    background-color: #cc1f1a;
}

.btn-green {
    background-color: #38c172;
    color: #fff;
}

.btn-green:hover {
    background-color: #2f855a;
}
</style>
