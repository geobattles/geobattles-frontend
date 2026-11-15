<template>
    <div ref="google_panorama" id="panorama_map" data-testid="street-view" aria-label="Explore the Street View landscape"></div>
</template>

<script lang="ts">
export default {
    setup() {
        const google_panorama = ref<HTMLElement | null>(null);
        const googleStore = useGoogleStore();
        const mode = useGameMode();
        const { lobbySettings } = useLobbyState();
        const owner = useNuxtApp().$gameRuntime.battleRoyale;
        let unmounted = false;
        onBeforeUnmount(() => {
            unmounted = true;
        });

        // Keep the DOM mounted across phases, but only initialize Street View
        // for an active round. Finished reloads restore the scoreboard/map only.
        let initializing = false;
        let attemptedGrant: typeof owner.activeRound.value = null;
        let attemptedRetry = -1;
        const ensurePanorama = () => {
            if (unmounted || !google_panorama.value || initializing || !["PLAYING", "STARTING"].includes(mode.modeLogic.currentState)) return;
            const authorization = owner.activeRound.value;
            if (
                !authorization ||
                authorization.generation !== owner.generation ||
                authorization.lobbyId !== lobbySettings.value?.ID ||
                authorization.round !== mode.modeLogic.currentRound
            )
                return;
            if (googleStore.panoramaStatus === "blocked") return;
            const explicitRetry = attemptedRetry !== googleStore.retryVersion;
            if (googleStore.panoramaStatus === "error" && attemptedGrant === authorization && !explicitRetry) return;
            attemptedGrant = authorization;
            attemptedRetry = googleStore.retryVersion;
            if (googleStore.isPanoramaInitialized) {
                const host = googleStore.getPanoramaHTML;
                // contains includes self: never append a host to itself or to
                // one of its descendants when v-show keeps this DOM mounted.
                if (!host.contains(google_panorama.value) && host.parentElement !== google_panorama.value) google_panorama.value.appendChild(host);
                if (explicitRetry && googleStore.panoramaStatus === "error") googleStore.updatePanoramaView(mode.modeLogic.searchedLocationCoords);
                return;
            }
            initializing = true;
            const isGoogleCurrent = googleStore.captureGeneration();
            const epoch = owner.generation;
            const round = mode.modeLogic.currentRound;
            const lobbyId = lobbySettings.value?.ID;
            const host = google_panorama.value;
            const isCurrent = () =>
                !unmounted &&
                isGoogleCurrent() &&
                authorization === owner.activeRound.value &&
                epoch === owner.generation &&
                host === google_panorama.value &&
                lobbyId === lobbySettings.value?.ID &&
                round === mode.modeLogic.currentRound &&
                ["PLAYING", "STARTING"].includes(mode.modeLogic.currentState);
            googleStore.setPanoramaHTML(google_panorama.value);
            void googleStore
                .initalizePanoramaView(google_panorama.value, mode.modeLogic.searchedLocationCoords, isCurrent)
                // The scoped Maps recovery panel owns this error, not a global toast.
                .catch(() => {})
                .finally(() => {
                    initializing = false;
                    // Only a newly authorized START/restore may resume after
                    // cancellation, even if it uses a new Google owner. A
                    // cleanup-created epoch alone grants no render permission.
                    if (!unmounted && owner.activeRound.value && authorization !== owner.activeRound.value) ensurePanorama();
                });
        };
        onMounted(ensurePanorama);
        watch(() => [mode.modeLogic.currentState, mode.modeLogic.currentRound, owner.activeRound.value, googleStore.retryVersion], ensurePanorama, { flush: "post" });

        return { google_panorama };
    },
};
</script>

<style scoped>
:deep(.gm-style .gm-compass) {
    transform: scale(1.2); /* Make compass larger for better visibility */
}

#panorama-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;

    will-change: transform;
    transform: translateZ(0);
}
</style>
