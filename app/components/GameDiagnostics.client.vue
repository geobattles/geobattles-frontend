<template>
    <section class="diagnostics" aria-label="Game diagnostics">
        <dl>
            <div>
                <dt>Build</dt>
                <dd>{{ config.public.VERSION }}</dd>
            </div>
            <div>
                <dt>Connection</dt>
                <dd>{{ connectionState }} · {{ isOnline ? "online" : "offline" }}</dd>
            </div>
            <div>
                <dt>Map</dt>
                <dd>
                    {{ mapLabel }}<span v-if="google.mapLoadMs !== null"> · {{ google.mapLoadMs }} ms</span>
                </dd>
            </div>
            <div>
                <dt>Street View</dt>
                <dd>
                    {{ google.panoramaStatus }}<span v-if="google.panoramaLoadMs !== null"> · {{ google.panoramaLoadMs }} ms</span>
                </dd>
            </div>
            <template v-if="!compact">
                <div>
                    <dt>API</dt>
                    <dd>{{ backendStatus }}</dd>
                </div>
                <div>
                    <dt>API build</dt>
                    <dd>{{ backendVersion }}</dd>
                </div>
            </template>
        </dl>
        <div class="diagnostic-actions">
            <button v-if="!compact" type="button" class="btn btn-secondary" :disabled="checking" :aria-busy="checking" @click="checkBackend">
                {{ checking ? "Checking…" : "Check server" }}
            </button>
            <button type="button" class="btn btn-secondary" @click="copy">{{ copied ? "Copied" : "Copy diagnostics" }}</button>
        </div>
        <p class="diagnostic-note">Device-only details. No names, lobby codes, locations or credentials.</p>
        <label v-if="manualCopy" class="diagnostic-copy">Select and copy<textarea :value="report" readonly rows="8" @focus="selectText" /></label>
        <p class="sr-only" role="status">{{ copied ? "Diagnostics copied." : manualCopy ? "Copy the diagnostic text below." : "" }}</p>
    </section>
</template>
<script setup lang="ts">
defineProps<{ compact?: boolean }>();
const config = useRuntimeConfig();
const google = useGoogleStore();
const { connectionState, isOnline, retryAttempt } = useSocketState();
const { currentState, currentRound } = useBattleRoyaleState();
const owner = useNuxtApp().$gameRuntime.battleRoyale;
const checking = ref(false);
const backendStatus = ref("Not checked");
const backendVersion = ref("Not checked");
const copied = ref(false);
const manualCopy = ref(false);
let controller: AbortController | null = null;
let copyTimer: ReturnType<typeof setTimeout> | undefined;
const mapLabel = computed(() => (google.mapStatus === "ready" ? "Initialized" : google.mapStatus));
const safeVersion = (value: unknown) => (typeof value === "string" && /^[a-zA-Z0-9._+-]{1,80}$/.test(value) ? value : "Unavailable");
const checkBackend = async () => {
    if (checking.value) return;
    checking.value = true;
    const active = new AbortController();
    controller = active;
    const timeout = setTimeout(() => active.abort(), 4_000);
    try {
        const base = config.public.BACKEND_HOST.replace(/\/$/, "");
        const options: RequestInit = { signal: active.signal, cache: "no-store", credentials: "omit", redirect: "error" };
        const [ready, version] = await Promise.all([fetch(`${base}/readyz`, options), fetch(`${base}/version`, options)]);
        const data: unknown = version.ok ? await version.json() : null;
        if (active.signal.aborted) return;
        backendStatus.value = ready.ok ? "Ready" : "Unavailable";
        backendVersion.value = safeVersion(data && typeof data === "object" && "version" in data ? data.version : null);
    } catch {
        if (controller === active) {
            backendStatus.value = "Unreachable";
            backendVersion.value = "Unavailable";
        }
    } finally {
        clearTimeout(timeout);
        if (controller === active) {
            controller = null;
            checking.value = false;
        }
    }
};
const report = computed(() =>
    JSON.stringify(
        {
            format: "geobattles-diagnostics-v1",
            frontend: safeVersion(config.public.VERSION),
            backend: backendVersion.value,
            api: backendStatus.value,
            network: isOnline.value ? "online" : "offline",
            socket: connectionState.value,
            socketRetries: retryAttempt.value,
            phase: currentState.value,
            round: currentRound.value,
            map: google.mapStatus,
            panorama: google.panoramaStatus,
            mapInitMs: google.mapLoadMs,
            panoramaStatusMs: google.panoramaLoadMs,
            mapsRetries: google.recoveryAttempts,
            nativeMapCreations: google.mapCreations,
            nativePanoramaCreations: google.panoramaCreations,
            render: owner.renderError.value ? "failed" : owner.isRestoring.value ? "restoring" : "settled",
        },
        null,
        2
    )
);
const copy = async () => {
    try {
        await navigator.clipboard.writeText(report.value);
        copied.value = true;
        manualCopy.value = false;
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => (copied.value = false), 2500);
    } catch {
        manualCopy.value = true;
    }
};
const selectText = (event: FocusEvent) => (event.target as HTMLTextAreaElement).select();
onBeforeUnmount(() => {
    controller?.abort();
    controller = null;
    clearTimeout(copyTimer);
});
</script>
<style scoped>
.diagnostics {
    font-size: 0.8rem;
}
dl {
    margin: 0;
    display: grid;
    gap: 0.3rem;
}
dl > div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
}
dt,
.diagnostic-note {
    color: var(--gb-muted);
}
dd {
    margin: 0;
    text-align: right;
    overflow-wrap: anywhere;
    font-variant-numeric: tabular-nums;
}
.diagnostic-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
}
.diagnostic-note {
    margin-top: 0.5rem;
    font-size: 0.75rem;
}
.diagnostic-copy {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.5rem;
}
textarea {
    width: 100%;
    font-size: 16px;
    background: var(--gb-bg);
    color: var(--gb-text);
}
</style>
