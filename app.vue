<template>
    <div>
        <VitePwaManifest />
        <NuxtLoadingIndicator color="#4f46e5" />

        <!-- Main content -->
        <NuxtLayout>
            <ClientOnly>
                <NuxtPage />
            </ClientOnly>
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
const appStore = useAppStore();
appStore.startApplication();
</script>

<style>
html {
    font-size: 14px;
}

body {
    /* background: url("/images/earth.webp") no-repeat center center fixed; */
    background-size: cover; /* Resize the background image to cover the entire container */
}

:root {
    --surface-light: var(--p-surface-100);
    --surface-dark: var(--p-surface-800);
}

@media (prefers-color-scheme: dark) {
    :root {
        --surface-background: var(--surface-dark);
    }
}
@media (prefers-color-scheme: light) {
    :root {
        --surface-background: var(--surface-light);
    }
}
</style>
