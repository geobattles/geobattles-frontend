<template>
    <section v-if="visible" class="maps-recovery" data-testid="maps-recovery" aria-label="Map loading and recovery">
        <div class="recovery-line">
            <p role="status"><span v-if="loading && !failed" class="spinner" />{{ message }}</p>
            <button
                v-if="failed && !blocked"
                class="btn btn-secondary"
                type="button"
                :disabled="loading || owner.retryingMaps.value || !socket.isOnline"
                :aria-busy="owner.retryingMaps.value"
                @click="battle.retryMapRendering()"
            >
                {{ owner.retryingMaps.value ? "Retrying…" : "Retry map" }}
            </button>
        </div>
        <details v-if="failed || blocked">
            <summary>Details</summary>
            <GameDiagnostics compact />
        </details>
    </section>
</template>
<script setup lang="ts">
const props = defineProps<{ panorama?: boolean; active?: boolean }>();
const google = useGoogleStore();
const battle = useBattleRoyaleStore();
const owner = useNuxtApp().$gameRuntime.battleRoyale;
const socket = useWebSocketStore();
const states = computed(() => (props.panorama ? [google.mapStatus, google.panoramaStatus] : [google.mapStatus]));
const failed = computed(() => states.value.includes("error") || owner.renderError.value);
const blocked = computed(() => states.value.includes("blocked"));
const loading = computed(() => states.value.some((state) => state === "loading" || state === "idle"));
const visible = computed(
    () => props.active !== false && !!owner.mapView.value && socket.isConnected && (failed.value || blocked.value || loading.value || owner.retryingMaps.value)
);
const message = computed(() => {
    if (blocked.value) return "Maps access is unavailable. Contact the game operator.";
    if (failed.value) return props.panorama ? "Map unavailable. Your round continues." : "The result map could not load.";
    return props.panorama ? "Loading the landscape. The clock continues." : "Loading the result map…";
});
</script>
<style scoped>
.maps-recovery {
    position: absolute;
    z-index: 45;
    inset-inline: 12px;
    bottom: calc(82px + env(safe-area-inset-bottom));
    width: min(440px, calc(100% - 24px));
    margin-inline: auto;
    padding: 0.5rem 0.65rem;
    background: var(--gb-bg);
    color: var(--gb-text);
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    box-shadow: 0 6px 24px #0005;
    font-size: 0.8rem;
    max-height: calc(100dvh - 160px);
    overflow-y: auto;
}
.recovery-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}
p {
    display: flex;
    gap: 0.4rem;
    align-items: center;
}
.btn {
    flex-shrink: 0;
    font-size: 0.8rem;
}
summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--gb-muted);
    font-size: 0.75rem;
}
summary::after {
    content: "+";
    margin-left: auto;
}
details[open] > summary::after {
    content: "−";
}
@media (max-height: 440px) and (orientation: landscape) {
    .maps-recovery {
        bottom: calc(74px + env(safe-area-inset-bottom));
        max-height: calc(100dvh - 130px);
    }
}
</style>
