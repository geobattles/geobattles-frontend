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
</style>
