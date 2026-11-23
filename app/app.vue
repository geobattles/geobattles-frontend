<template>
    <div class="app-root">
        <VitePwaManifest />
        <NuxtLoadingIndicator color="var(--gb-accent)" />
        <a class="skip-link" href="#main-content">Skip to content</a>
        <NuxtLayout><NuxtPage /></NuxtLayout>
        <UiToastViewport :target="alertTarget" />
        <PwaUpdateNotice :target="alertTarget" />
        <PwaInstallGuide />
        <ViewportDiagnostics v-if="showViewportDiagnostics" />
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
const { currentState: battlePhase } = useBattleRoyaleState();
// The connection surface owns its failure message, including the dismissed pill.
// Other action/auth errors must still reach the global alert.
const showRequestError = computed(() => {
    const error = request.requestError;
    if (!error) return false;
    if (error.command === "submit_location" && isGameRoute.value && battlePhase.value === "PLAYING") return false;
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
const viewport = provideMobileViewport();
providePwaInstall(viewport);
const showViewportDiagnostics = import.meta.dev;
watch(viewport, (view) => {
    if (!view) return;
    isMobile.value = view.mobile;
    isVertical.value = view.orientation === "portrait";
});
useHead({
    titleTemplate: (title) => (title && title !== "GeoBattles" ? `${title} · GeoBattles` : "GeoBattles — Follow your instinct"),
    htmlAttrs: { lang: "en" },
    meta: [
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=contain" },
        { name: "description", content: "Read the landscape. Place your pin. Explore the world with friends in GeoBattles, an open-source multiplayer geography game." },
        { name: "theme-color", content: "#0c1916" },
    ],
});
onMounted(() => {
    mounted.value = true;
    document.addEventListener("fullscreenchange", updateAlertTarget);
    updateAlertTarget();
    app.$gameRuntime.google.installLoader(config.public.GMAPS_API);
    if (import.meta.dev && router.currentRoute.value.name === "dev-ui") return;
    void auth.initializeAuth().catch(() => console.warn("Authentication initialization failed."));
});
onBeforeUnmount(() => {
    document.removeEventListener("fullscreenchange", updateAlertTarget);
    app.$gameRuntime?.leave();
});
</script>
<style scoped>
.app-root {
    min-height: calc(var(--gb-viewport-height) + var(--gb-screen-top, 0px));
    padding-block-start: var(--gb-screen-top, 0px);
}
.request-alert {
    position: fixed;
    z-index: 4500;
    top: max(1rem, var(--gb-safe-top));
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
