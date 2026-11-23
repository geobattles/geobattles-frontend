<template>
    <Teleport :to="target || 'body'" :disabled="!target">
        <div v-if="assetLoadFailed" role="status" class="notice fixed bottom-3 left-1/2 -translate-x-1/2 z-[1900] max-w-lg w-[90%] shadow-lg">
            <p>Part of GeoBattles couldn’t load. When you’re ready, refresh the page or reopen the app.</p>
            <button type="button" class="text-link mt-2" @click="assetLoadFailed = false">Dismiss</button>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
defineProps<{ target: Element | null }>();

const assetLoadFailed = ref(false);
let disposed = false;
let registration: ServiceWorkerRegistration | undefined;

const reportAssetFailure = () => {
    assetLoadFailed.value = true;
    // Do NOT preventDefault: Vite must reject JS/CSS imports so failed route
    // loads are cancelled, not treated as successful/partially styled navigation.
    // No router push/retry here: the original leave/cancellation guards still own it.
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
    document.removeEventListener("visibilitychange", checkForUpdate);
    window.removeEventListener("online", checkForUpdate);
    window.removeEventListener("vite:preloadError", reportAssetFailure);
    registration = undefined;
};

onMounted(async () => {
    // Failure guidance also works without service-worker support/registration.
    window.addEventListener("vite:preloadError", reportAssetFailure);
    // Development/HMR must not install a production worker or accumulate listeners.
    if (import.meta.dev || !window.isSecureContext || !("serviceWorker" in navigator)) return;

    try {
        // Access can throw when browser privacy/storage policy denies registration.
        const registered = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
        });
        // Registration cannot be cancelled; never attach resources after teardown.
        if (disposed) return;
        registration = registered;
        document.addEventListener("visibilitychange", checkForUpdate);
        window.addEventListener("online", checkForUpdate);
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
