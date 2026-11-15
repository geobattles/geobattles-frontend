<template>
    <div class="app-root">
        <VitePwaManifest />
        <NuxtLoadingIndicator color="#b6e388" />
        <a class="skip-link" href="#main-content">Skip to content</a>
        <NuxtLayout><NuxtPage /></NuxtLayout>
        <UiToastViewport :target="alertTarget" />
        <PwaUpdateNotice :target="alertTarget" />
        <Teleport :to="alertTarget || 'body'" :disabled="!alertTarget">
            <div v-if="mounted && showRequestError" class="request-alert notice notice-error" role="alert">
                <div>
                    <strong>That action could not be completed</strong>
                    <p>{{ request.requestError?.message }}</p>
                </div>
                <button type="button" class="btn btn-icon btn-quiet" aria-label="Dismiss error" @click="request.clearError()"><UiIcon name="close" /></button>
            </div>
        </Teleport>
        <p v-if="!config.public.GMAPS_API.trim() && !isGameRoute" class="build-notice" role="status">
            Maps is not configured in this build. You can explore the interface and prepare a lobby; starting a game needs an operator-configured browser Maps key.
        </p>
    </div>
</template>
<script setup lang="ts">
const app = useNuxtApp();
const config = useRuntimeConfig();
const router = useRouter();
const auth = useAuthStore();
const request = useRequestState();
const { connectionError } = useSocketState();
// Lobby recovery owns its connection message, including the dismissed pill.
// Other action/auth errors must still reach the global alert.
const showRequestError = computed(() => {
    const error = request.requestError;
    if (!error) return false;
    const recoveryError = connectionError.value;
    return !(routeLobbyId(router.currentRoute.value) && recoveryError && error.code === recoveryError.code && error.command === recoveryError.command);
});
const mounted = ref(false);
const alertTarget = shallowRef<Element | null>(null);
const isGameRoute = computed(() => router.currentRoute.value.name === "gameplay-id");
const updateAlertTarget = () => {
    alertTarget.value = document.fullscreenElement || document.body;
};
const { isMobile, isVertical } = useUIState();
const updateViewport = () => {
    isMobile.value = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    isVertical.value = window.innerWidth < window.innerHeight;
};
useHead({
    titleTemplate: (title) => (title && title !== "GeoBattles" ? `${title} · GeoBattles` : "GeoBattles — Follow your instinct"),
    htmlAttrs: { lang: "en" },
    meta: [
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
        { name: "description", content: "Read the landscape. Place your pin. Explore the world with friends in GeoBattles, an open-source multiplayer geography game." },
        { name: "theme-color", content: "#181818" },
    ],
});
const beforeUnload = (event: BeforeUnloadEvent) => {
    if (routeLobbyId(router.currentRoute.value)) {
        event.preventDefault();
        event.returnValue = "";
    }
};
onMounted(() => {
    mounted.value = true;
    document.addEventListener("fullscreenchange", updateAlertTarget);
    updateAlertTarget();
    app.$gameRuntime.google.installLoader(config.public.GMAPS_API);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("beforeunload", beforeUnload);
    void auth.initializeAuth().catch(() => console.warn("Authentication initialization failed."));
});
onBeforeUnmount(() => {
    document.removeEventListener("fullscreenchange", updateAlertTarget);
    window.removeEventListener("resize", updateViewport);
    window.removeEventListener("beforeunload", beforeUnload);
    app.$gameRuntime?.leave();
});
</script>
<style scoped>
.app-root {
    min-height: 100dvh;
}
.request-alert {
    position: fixed;
    z-index: 4500;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: min(640px, calc(100% - 2rem));
    display: flex;
    gap: 1rem;
    align-items: start;
    box-shadow: 0 12px 40px #0005;
}
.build-notice {
    max-width: 1120px;
    margin: 1rem auto;
    padding: 0.75rem 1.5rem;
    color: var(--gb-muted);
    font-size: 0.75rem;
}
</style>
