<template>
    <Teleport :to="target || 'body'" :disabled="!target">
        <div v-if="(updateAvailable || assetLoadFailed) && !dismissed" role="status" class="notice fixed bottom-3 left-1/2 -translate-x-1/2 z-[1900] max-w-lg w-[90%] shadow-lg">
            <p v-if="assetLoadFailed">
                Part of the app could not load. Check your connection and try the link or action again. If it still fails, finish playing, close all GeoBattles tabs and app
                windows, then reopen. The app will not reload automatically.
            </p>
            <p v-else>An update is ready. When you finish playing, close all GeoBattles tabs and app windows, then reopen to update.</p>
            <button type="button" class="text-link mt-2" @click="dismissed = true">Later</button>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
defineProps<{ target: Element | null }>();

const updateAvailable = ref(false);
const assetLoadFailed = ref(false);
const dismissed = ref(false);
let disposed = false;
let container: ServiceWorkerContainer | undefined;
let registration: ServiceWorkerRegistration | undefined;
let installing: ServiceWorker | null = null;

const reportAssetFailure = () => {
    assetLoadFailed.value = true;
    dismissed.value = false;
    // Do NOT preventDefault: Vite must reject JS/CSS imports so failed route
    // loads are cancelled, not treated as successful/partially styled navigation.
    // No router push/retry here: the original leave/cancellation guards still own it.
};
const syncWaiting = () => {
    // A first install activates normally; it is not an update notification.
    updateAvailable.value = Boolean(registration?.active && registration.waiting);
};
const observeInstalling = () => {
    installing?.removeEventListener("statechange", syncWaiting);
    installing = registration?.installing || null;
    installing?.addEventListener("statechange", syncWaiting);
    syncWaiting();
};
const checkForUpdate = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
        void registration?.update().catch(() => {
            // Keep the current worker and retry on a later visit/foreground event.
            if (!disposed) console.warn("PWA update check failed.");
        });
    }
};
const dispose = () => {
    disposed = true;
    registration?.removeEventListener("updatefound", observeInstalling);
    installing?.removeEventListener("statechange", syncWaiting);
    container?.removeEventListener("controllerchange", syncWaiting);
    document.removeEventListener("visibilitychange", checkForUpdate);
    window.removeEventListener("vite:preloadError", reportAssetFailure);
    registration = undefined;
    installing = null;
    container = undefined;
};

onMounted(async () => {
    // Failure guidance also works without service-worker support/registration.
    window.addEventListener("vite:preloadError", reportAssetFailure);
    // Development/HMR must not install a production worker or accumulate listeners.
    if (import.meta.dev || !window.isSecureContext || !("serviceWorker" in navigator)) return;

    try {
        // Access can throw when browser privacy/storage policy denies registration.
        container = navigator.serviceWorker;
        container.addEventListener("controllerchange", syncWaiting);
        document.addEventListener("visibilitychange", checkForUpdate);
        const registered = await container.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
        });
        // Registration cannot be cancelled; never attach resources after teardown.
        if (disposed) return;
        registration = registered;
        registration.addEventListener("updatefound", observeInstalling);
        observeInstalling();
    } catch {
        if (!disposed) console.warn("PWA registration failed.");
    }
});

// Template-only HMR preserves this instance; actual unmount/script remount owns cleanup.
onBeforeUnmount(dispose);

// No SKIP_WAITING message or controllerchange reload: another tab may be in a round.
// The generated worker waits for ALL old clients to close before activation/cleanup.
// Teardown removes only this component's listeners, never game/session resources.
</script>
