<template>
    <div ref="google_map" id="google_map" class="game-map-host" :class="props.default_class" data-testid="guess-map" aria-label="Guess map"></div>
</template>

<script lang="ts">
export default {
    props: {
        default_class: String,
    },
    setup(props) {
        const google_map = useTemplateRef<HTMLElement>("google_map");
        const googleStore = useGoogleStore();
        const mode = useGameMode();
        const { lobbySettings } = useLobbyState();
        const owner = useNuxtApp().$gameRuntime.battleRoyale;
        let unmounted = false;
        onBeforeUnmount(() => {
            unmounted = true;
        });

        let initializing = false;
        let attemptedGrant: typeof owner.mapView.value = null;
        let attemptedRetry = -1;
        const ensureMap = () => {
            if (unmounted || !google_map.value || initializing) return;
            const battle = mode.currentMode === "BattleRoyale";
            const authorization = owner.mapView.value;
            const isViewCurrent = () =>
                (!battle && mode.currentMode === "CountryBattle") ||
                (battle &&
                    mode.currentMode === "BattleRoyale" &&
                    !!authorization &&
                    authorization === owner.mapView.value &&
                    authorization.generation === owner.generation &&
                    authorization.lobbyId === lobbySettings.value?.ID &&
                    authorization.round === mode.modeLogic.currentRound &&
                    ["STARTING", "PLAYING", "MID-ROUND", "FINISHED"].includes(mode.modeLogic.currentState));
            if (!isViewCurrent()) return;
            if (googleStore.mapStatus === "blocked") return;
            if (googleStore.mapStatus === "error" && attemptedGrant === authorization && attemptedRetry === googleStore.retryVersion) return;
            // Keep the unfinished Country Battle mount path unchanged. Only
            // Battle Royale observes authoritative view grants for recreation.
            if (googleStore.isMapInitialized) {
                const host = googleStore.getMapHTML;
                if (!host.contains(google_map.value) && host.parentElement !== google_map.value) google_map.value.appendChild(host);
                return;
            }
            initializing = true;
            attemptedGrant = authorization;
            attemptedRetry = googleStore.retryVersion;
            const host = google_map.value;
            const isGoogleCurrent = googleStore.captureGeneration();
            const isCurrent = () => !unmounted && isGoogleCurrent() && host === google_map.value && isViewCurrent();
            googleStore.setMapHTML(host);
            void googleStore
                .initializeGoogleMap(host, isCurrent)
                // The scoped Maps recovery panel owns this error, not a global toast.
                .catch(() => {})
                .finally(() => {
                    initializing = false;
                    // Disposal/epoch changes alone cannot recreate anything.
                    // A real newer grant can resume an older cancelled import.
                    if (!unmounted && battle && owner.mapView.value && authorization !== owner.mapView.value) ensureMap();
                });
        };
        onMounted(ensureMap);
        watch(
            () => [owner.mapView.value, mode.modeLogic.currentState, mode.modeLogic.currentRound, googleStore.retryVersion],
            () => {
                if (mode.currentMode === "BattleRoyale") ensureMap();
            },
            { flush: "post" }
        );

        return { google_map, props };
    },
};
</script>

<style scoped></style>
