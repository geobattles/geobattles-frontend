<template>
    <form v-if="draft" class="settings-form" @submit.prevent="save">
        <SocketConnectionBanner :status="connectionStatus" :round-running="false" />
        <p v-if="socket.connectionState === 'disconnected' && socket.connectionError" class="field-error">Connection lost. Close settings to return to recovery options.</p>
        <p v-if="!lobby.isPlayerAdmin()" class="notice notice-warn" role="status">The host has changed. Only the current host can save settings.</p>
        <div v-if="loadingCountries" class="catalog-state" role="status">Loading available regions…</div>
        <div v-else-if="!catalog" class="catalog-state">
            <p class="field-error" role="alert">Region settings could not load. Check the connection and make sure the game server is up to date.</p>
            <button class="btn btn-secondary" type="button" @click="loadCatalog">Try again</button>
        </div>
        <fieldset :disabled="!lobby.isPlayerAdmin() || !socket.isConnected || loadingCountries || !catalog" class="settings-fields">
            <div class="settings-columns">
                <section class="region-section" aria-labelledby="region-heading">
                    <div class="section-heading region-heading">
                        <h3 id="region-heading">Map</h3>
                    </div>
                    <LobbySettingsRegionPicker
                        v-if="catalog && !loadingCountries"
                        :disabled="!lobby.isPlayerAdmin() || !socket.isConnected"
                        :model-value="draft.ccList"
                        :catalog="catalog"
                        @update:model-value="selectRegion"
                    />
                </section>
                <section class="round-section form-stack" aria-labelledby="round-heading">
                    <div class="section-heading">
                        <h3 id="round-heading">Game settings</h3>
                        <span class="field-help">{{ draft.mode === 1 ? "Battle Royale" : "Country Battle" }}</span>
                    </div>
                    <LobbySettingsName v-model="draft.name" />
                    <LobbySettingsTimer v-model="draft.roundTime" @editing="timerEditing = $event" />
                    <div class="settings-numbers"><LobbySettingsRounds v-model="draft.numRounds" /><LobbySettingsAttempts v-model="draft.numAttempt" /></div>
                    <details class="advanced-settings">
                        <summary>Advanced settings</summary>
                        <div class="form-stack advanced-content">
                            <section v-if="draft.mode === 1" class="form-stack scoring-controls" aria-labelledby="scoring-heading">
                                <h4 id="scoring-heading">Scoring</h4>
                                <LobbySettingsToggle label="Automatic scoring" description="Adjust the curve to the selected region. Recommended." v-model="automaticScoring" />
                                <template v-if="!automaticScoring"
                                    ><LobbySettingsScoreFactor v-model="draft.scoreFactor" />
                                    <p class="field-help">Choosing a different region returns to automatic scoring.</p></template
                                >
                                <LobbyScoreVisualizer
                                    v-if="draft.ccList.length && (!automaticScoring || previewScale !== undefined)"
                                    :score-factor="draft.scoreFactor"
                                    :score-scale-km="automaticScoring ? previewScale : undefined"
                                />
                            </section>
                            <LobbySettingsMaxPlayers v-model="draft.maxPlayers" />
                            <LobbySettingsToggle label="Dynamic lives" description="Carry unused guesses into the next round, with a limited refill." v-model="draft.dynLives" />
                            <LobbySettingsToggle label="Placement bonus" description="Rewards the closest players at the end of a round." v-model="draft.placeBonus" />
                            <fieldset class="form-stack">
                                <legend class="field-label">Powerups</legend>
                                <LobbySettingsToggle label="Double score" v-model="doubleScore" /><LobbySettingsToggle label="Duel" v-model="duel" />
                            </fieldset>
                            <LobbySettingsGameMode v-model="draft.mode" />
                        </div>
                    </details>
                </section>
            </div>
        </fieldset>
        <p v-if="error" class="field-error" role="alert">{{ error }}</p>
        <footer class="settings-footer">
            <p v-if="timerEditing" class="field-help" role="status">Save or cancel the time edit first.</p>
            <div class="settings-actions">
                <button class="btn btn-secondary" type="button" @click="emit('close')">Cancel</button
                ><button
                    class="btn"
                    type="submit"
                    :disabled="timerEditing || !lobby.isPlayerAdmin() || !socket.isConnected || loadingCountries || !catalog || !draft.ccList.length"
                >
                    <UiIcon name="check" />Save settings
                </button>
            </div>
        </footer>
    </form>
    <p v-else class="notice">Waiting for the lobby settings.</p>
</template>
<script setup lang="ts">
import type { LobbyInfo } from "~/types/appTypes";
import { regionScoreScale, sameCountries } from "~/utils/regionScoring";
const emit = defineEmits<{ close: [] }>();
const lobby = useLobbyStore();
const socket = useWebSocketStore();
const connectionStatus = computed(() => {
    if (socket.connectionState === "disconnected") return null;
    if (!socket.isOnline) return "offline";
    return socket.connectionState === "reconnecting" ? "reconnecting" : null;
});
const actions = useLobbySocketActions();
const catalog = useCountryCatalog();
const { fetchCountryCatalog } = useRegionActions();
const draft = ref<LobbyInfo["conf"] | null>(lobby.lobbySettings ? JSON.parse(JSON.stringify(lobby.lobbySettings.conf)) : null);
if (draft.value) {
    draft.value.scoringMode ??= "auto";
    draft.value.powerups ??= [false, false];
}
const error = ref("");
const timerEditing = ref(false);
const loadingCountries = ref(true);
let active = true;
const automaticScoring = computed({
    get: () => draft.value?.scoringMode !== "manual",
    set: (automatic: boolean) => {
        if (!draft.value) return;
        draft.value.scoringMode = automatic ? "auto" : "manual";
        if (!Number.isInteger(draft.value.scoreFactor) || draft.value.scoreFactor < 1) draft.value.scoreFactor = 100;
    },
});
const previewScale = computed(() => {
    if (!catalog.value || !draft.value?.ccList.length) return undefined;
    try {
        return regionScoreScale(draft.value.ccList, catalog.value);
    } catch {
        return undefined;
    }
});
const doubleScore = computed({
    get: () => draft.value?.powerups[0] ?? false,
    set: (value: boolean) => {
        if (draft.value) draft.value.powerups[0] = value;
    },
});
const duel = computed({
    get: () => draft.value?.powerups[1] ?? false,
    set: (value: boolean) => {
        if (draft.value) draft.value.powerups[1] = value;
    },
});
function selectRegion(codes: string[]) {
    if (!draft.value) return;
    if (!sameCountries(draft.value.ccList, codes)) draft.value.scoringMode = "auto";
    draft.value.ccList = [...codes];
    error.value = "";
}
async function loadCatalog() {
    loadingCountries.value = true;
    try {
        const data = await fetchCountryCatalog();
        if (active && draft.value && !draft.value.ccList.length) draft.value.ccList = data.countries.map((country) => country.code);
    } catch {
        // The dedicated loading/error state has an explicit retry. Never save an unavailable region as World.
    } finally {
        if (active) loadingCountries.value = false;
    }
}
onMounted(loadCatalog);
onBeforeUnmount(() => {
    active = false;
});
function save() {
    const conf = draft.value;
    const data = catalog.value;
    if (!conf || !data || timerEditing.value || loadingCountries.value || !lobby.isPlayerAdmin() || !socket.isConnected) return;
    const allowed = new Set(data.countries.map((country) => country.code));
    if (!conf.name.trim() || !conf.ccList.length || conf.ccList.some((code) => !allowed.has(code))) {
        error.value = "Choose a lobby name and at least one available country.";
        return;
    }
    const numeric = [conf.roundTime, conf.numRounds, conf.numAttempt, conf.maxPlayers];
    if (conf.mode === 1 && !automaticScoring.value) numeric.push(conf.scoreFactor);
    if (!numeric.every((value) => Number.isInteger(value) && value > 0) || (conf.mode === 1 && !automaticScoring.value && conf.scoreFactor > 500)) {
        error.value = "Use whole positive numbers within the shown limits.";
        return;
    }
    const payload = {
        name: conf.name.trim(),
        mode: conf.mode,
        maxPlayers: conf.maxPlayers,
        numAttempt: conf.numAttempt,
        numRounds: conf.numRounds,
        roundTime: conf.roundTime,
        scoreFactor: conf.mode === 1 ? conf.scoreFactor : 0,
        scoringMode: conf.scoringMode,
        ccList: sameCountries(conf.ccList, [...allowed]) ? [] : [...new Set(conf.ccList)],
        dynLives: conf.dynLives,
        placeBonus: conf.placeBonus,
        powerups: [doubleScore.value, duel.value],
    };
    // scoreScaleKm belongs to the server. Never send a preview as authoritative configuration.
    if (actions.updateSettings(payload)) emit("close");
}
</script>
<style scoped>
.settings-form {
    font-size: 0.85rem;
}

.region-heading {
    margin-bottom: 0.85rem;
}
.settings-fields {
    min-width: 0;
}
.settings-columns {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 1.25rem;
}
.region-section,
.round-section {
    min-width: 0;
}
.round-section {
    align-self: start;
    border: 1px solid var(--gb-line);
    border-radius: 12px;
    padding: 1rem;
    background: #181b1880;
}
.region-section > h3 {
    margin-bottom: 0.75rem;
}
.settings-form h3 {
    font-size: 1rem;
}
.section-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.35rem;
}
h4 {
    font-size: 0.9rem;
    margin: 0;
}
.settings-form :deep(.form-stack) {
    gap: 0.85rem;
}
.settings-form :deep(.field) {
    gap: 0.3rem;
}
.settings-form :deep(.field-help) {
    font-size: 0.75rem;
}
.settings-form :deep(.btn) {
    min-width: 44px;
    font-size: 0.8rem;
    padding: 0.5rem 0.7rem;
}
.settings-form :deep(.input) {
    padding: 0.45rem 0.6rem;
    font-size: 1rem;
    min-height: 44px;
}
.settings-form :deep(.check-row) {
    min-height: 44px;
}
.settings-form :deep(input),
.settings-form :deep(button),
.settings-form :deep(summary) {
    scroll-margin-block: 0.75rem 6.5rem;
}
.settings-numbers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 145px), 1fr));
    gap: 0.65rem;
}

.advanced-settings {
    border-top: 1px solid var(--gb-line);
}
.advanced-settings > summary {
    min-height: 44px;
    padding-block: 0.75rem;
    cursor: pointer;
    font-weight: 700;
    color: var(--gb-muted);
}
.advanced-settings[open] > summary {
    color: var(--gb-accent);
}
.advanced-content {
    padding-bottom: 0.5rem;
}
.scoring-controls {
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--gb-line);
}
.settings-footer {
    position: sticky;
    bottom: -1px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    flex-wrap: wrap;
    background: var(--gb-surface);
    border-top: 1px solid var(--gb-line);
    padding-block: 0.75rem max(0.75rem, env(safe-area-inset-bottom));
    margin-top: 1rem;
}
.settings-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
}
.catalog-state {
    display: grid;
    gap: 0.65rem;
    padding-block: 1rem;
}
.catalog-state button {
    justify-self: start;
}
fieldset:disabled {
    opacity: 0.6;
}
@media (max-width: 760px) {
    .settings-form :deep(.btn) {
        min-height: 44px;
        padding: 0.35rem 0.6rem;
    }
    .settings-columns {
        grid-template-columns: minmax(0, 1fr);
        gap: 1rem;
    }
    .round-section {
        padding: 0.85rem;
    }
    .settings-footer {
        gap: 0.3rem;
        margin-top: 0.5rem;
        padding-block: 0.5rem max(0.5rem, env(safe-area-inset-bottom));
    }
    .settings-footer > p {
        width: 100%;
        font-size: 0.7rem;
    }
    .settings-actions {
        width: 100%;
    }
    .settings-actions > button {
        flex: 1;
    }
    .settings-form :deep(.form-stack) {
        gap: 0.65rem;
    }
    .region-section > h3 {
        margin-bottom: 0.5rem;
    }
}
@media (max-height: 540px) and (min-width: 560px) {
    .settings-columns {
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        gap: 1rem;
    }
    .round-section {
        padding: 0.75rem;
    }
}
</style>
