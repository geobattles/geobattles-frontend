<template>
    <form
        v-if="draft"
        ref="form"
        novalidate
        class="settings-form"
        :data-edit-layout="editingLayout"
        :class="{ 'settings-searching': editingLayout === 'map', 'settings-edit-landscape': landscape && editingLayout }"
        @submit.prevent="save()"
    >
        <div v-if="editingLayout" class="settings-edit-toolbar">
            <span>{{ editingLayout === "map" ? "Map selection" : sections.find((section) => section.id === index?.current)?.label }}</span>
            <UiKeyboardDone @click="finishEditing" />
        </div>
        <SocketConnectionBanner :status="connectionStatus" :round-running="false" />
        <p v-if="socket.connectionState === 'disconnected' && socket.connectionError" class="field-error">Connection lost. Close settings to return to recovery options.</p>
        <p v-if="!lobby.isPlayerAdmin()" class="notice notice-warn" role="status">The host has changed. Only the current host can save settings.</p>
        <div v-if="loadingCountries" class="catalog-state" role="status">Loading available regions…</div>
        <div v-else-if="!catalog" class="catalog-state">
            <p class="field-error" role="alert">Region settings could not load. Check the connection and make sure the game server is up to date.</p>
            <button class="btn btn-secondary" type="button" @click="loadCatalog">Try again</button>
        </div>
        <fieldset :disabled="editorLocked" class="settings-fields">
            <LobbySettingsIndex ref="index" :sections="sections">
                <template #lobby
                    ><div class="chapter-controls">
                        <LobbySettingsName v-model="draft.name" />
                        <LobbySettingsMaxPlayers v-model="draft.maxPlayers" />
                        <LobbySettingsGameMode v-model="draft.mode" /></div
                ></template>
                <template #rounds
                    ><div class="chapter-controls">
                        <LobbySettingsTimer v-model="draft.roundTime" />
                        <LobbySettingsRounds v-model="draft.numRounds" /><LobbySettingsAttempts v-model="draft.numAttempt" />
                        <LobbySettingsToggle label="Dynamic lives" description="Carry unused guesses into the next round, with a limited refill." v-model="draft.dynLives" /></div
                ></template>
                <template #map
                    ><LobbySettingsRegionPicker
                        v-if="catalog && !loadingCountries"
                        :disabled="!lobby.isPlayerAdmin() || !socket.isConnected"
                        :model-value="draft.ccList"
                        :catalog="catalog"
                        @update:model-value="selectRegion"
                /></template>
                <template #scoring
                    ><div class="chapter-controls">
                        <template v-if="draft.mode === 1">
                            <LobbySettingsToggle label="Automatic scoring" description="Match the distance curve to the selected region." v-model="automaticScoring" />
                            <template v-if="!automaticScoring"
                                ><LobbySettingsScoreFactor v-model="draft.scoreFactor" />
                                <p class="field-help">Changing the region returns to automatic scoring.</p></template
                            >
                            <details v-if="draft.ccList.length && (!automaticScoring || previewScale !== undefined)" class="score-preview">
                                <summary>Preview base points</summary>
                                <LobbyScoreVisualizer :score-factor="draft.scoreFactor" :score-scale-km="automaticScoring ? previewScale : undefined" />
                            </details>
                        </template>
                        <LobbySettingsToggle label="Placement bonus" description="Reward the closest players at the end of each round." v-model="draft.placeBonus" />
                        <fieldset class="boost-controls">
                            <legend class="field-label">Powerups</legend>
                            <LobbySettingsToggle label="Double score" v-model="doubleScore" /><LobbySettingsToggle label="Duel" v-model="duel" />
                        </fieldset></div
                ></template>
            </LobbySettingsIndex>
        </fieldset>
        <p v-if="error" class="field-error" role="alert">{{ error }}</p>
        <footer class="settings-footer">
            <button v-if="catalog && !loadingCountries && !draft.ccList.length" :disabled="editorLocked" type="button" class="draft-link" @click="index?.open('map')">
                Choose a country <UiIcon name="arrow" />
            </button>
            <span v-else class="draft-status" role="status">
                <span v-if="saved && !dirty" :key="saved" class="settings-saved"><UiIcon name="check" /> {{ savedMessage }}</span>
                <span v-else>{{
                    pending ? "Saving…" : dirty ? "Unsaved changes" : index?.current === "map" && confirmed ? "Saved · " + regionLabel(confirmed.ccList, catalog) : "Saved setup"
                }}</span>
            </span>
            <button v-if="error && dirty" class="draft-link settings-retry" type="button" :disabled="editorLocked" @click="save()">Retry save</button>
            <button v-if="canDiscard" class="btn btn-quiet" type="button" aria-label="Discard unsaved settings" @click="emit('close')">Discard</button>
            <button v-else class="btn settings-done" type="button" @click="requestClose">Done</button>
        </footer>
    </form>
    <p v-else class="notice">Waiting for the lobby settings.</p>
</template>
<script setup lang="ts">
import type { LobbyInfo } from "~/types/appTypes";
import type { SettingsChapter } from "./SettingsIndex.vue";
import { regionLabel, regionScoreScale, sameCountries } from "~/utils/regionScoring";
const emit = defineEmits<{ close: [] }>();
const form = ref<HTMLFormElement | null>(null);
const index = ref<{ open: (id: SettingsChapter) => Promise<void>; current: SettingsChapter } | null>(null);
const { field, visibleHeight, editingHeightLoss, landscape, finishEditing } = useViewportForm(form);
const editingLayout = computed(() => {
    if (editingHeightLoss.value < 64) return undefined;
    const shortLandscape = landscape.value && visibleHeight.value < 250;
    if (field.value?.closest('[data-section="map"]') && (shortLandscape || visibleHeight.value < 340)) return "map";
    return shortLandscape || visibleHeight.value < 190 ? "field" : undefined;
});
let editingScroll: { element: HTMLElement; top: number } | undefined;
watch(editingLayout, async (layout, previous) => {
    if (layout && !previous) {
        const element = field.value?.closest<HTMLElement>("[data-viewport-scroll]");
        if (element) editingScroll = { element, top: element.scrollTop };
    } else if (!layout && editingScroll) {
        const { element, top } = editingScroll;
        editingScroll = undefined;
        await nextTick();
        if (element.isConnected && !editingLayout.value) element.scrollTop = top;
    }
});
const lobby = useLobbyStore();
const socket = useWebSocketStore();
const connectionStatus = useConnectionNotice();
const actions = useLobbySocketActions();
const catalog = useCountryCatalog();
const { fetchCountryCatalog } = useRegionActions();
const draft = ref<LobbyInfo["conf"] | null>(lobby.lobbySettings ? JSON.parse(JSON.stringify(lobby.lobbySettings.conf)) : null);
if (draft.value) {
    draft.value.scoringMode ??= "auto";
    draft.value.powerups ??= [false, false];
}
// Compare the wire shorthand for World and its expanded draft as the same selection.
const confirmed = computed(() => lobby.lobbySettings?.conf);
type Settings = LobbyInfo["conf"];
function sameSettings(a: Omit<Settings, "scoreScaleKm">, b: Omit<Settings, "scoreScaleKm">) {
    const world = catalog.value?.countries.map((country) => country.code) ?? [];
    return (
        sameCountries(a.ccList.length ? a.ccList : world, b.ccList.length ? b.ccList : world) &&
        [0, 1].every((i) => Boolean(a.powerups?.[i]) === Boolean(b.powerups?.[i])) &&
        a.name.trim() === b.name.trim() &&
        (a.scoringMode ?? "auto") === (b.scoringMode ?? "auto") &&
        (["mode", "maxPlayers", "numRounds", "roundTime", "numAttempt", "scoreFactor", "dynLives", "placeBonus"] as const).every((key) => a[key] === b[key])
    );
}
const dirty = computed(() => !!draft.value && !!confirmed.value && !sameSettings(draft.value, confirmed.value));
const pending = shallowRef<Omit<Settings, "scoreScaleKm">>();
const saved = ref(0);
const savedMessage = ref("");
const closeAfterSave = ref(false);
let debounce: ReturnType<typeof setTimeout> | undefined;
let acknowledgement: ReturnType<typeof setTimeout> | undefined;
let feedback: ReturnType<typeof setTimeout> | undefined;
const sections = computed<{ id: SettingsChapter; label: string; summary: string; icon: string }[]>(() => {
    const conf = draft.value;
    if (!conf) return [];
    const boosts = conf.powerups.filter(Boolean).length;
    return [
        { id: "lobby", label: "Lobby", icon: "users", summary: conf.name.trim() || "Name your lobby" },
        { id: "rounds", label: "Rounds", icon: "clock", summary: `${conf.numRounds || "—"} rounds · ${conf.roundTime} s` },
        {
            id: "map",
            label: "Map",
            icon: "globe",
            summary: loadingCountries.value
                ? "Loading regions…"
                : !catalog.value
                  ? "Regions unavailable"
                  : !conf.ccList.length
                    ? "Choose a country"
                    : regionLabel(conf.ccList, catalog.value),
        },
        {
            id: "scoring",
            label: "Scoring & powerups",
            icon: "trophy",
            summary: `${conf.scoringMode === "manual" ? "Manual" : "Auto"} · ${boosts} ${boosts === 1 ? "powerup" : "powerups"}`,
        },
    ];
});
const error = ref("");
const loadingCountries = ref(true);
const editorLocked = computed(() => !lobby.isPlayerAdmin() || !socket.isConnected || loadingCountries.value || !catalog.value);
const canDiscard = computed(() => dirty.value && !pending.value && (closeAfterSave.value || !!error.value));
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
onMounted(() => {
    void loadCatalog();
});
onBeforeUnmount(() => {
    active = false;
    clearTimeout(debounce);
    clearTimeout(acknowledgement);
    clearTimeout(feedback);
});
function requestClose() {
    clearTimeout(debounce);
    if (!dirty.value && !pending.value) {
        emit("close");
        return;
    }
    closeAfterSave.value = true;
    if (!pending.value && !error.value) save();
}
defineExpose({ requestClose });
function save() {
    const conf = draft.value;
    const data = catalog.value;
    if (!conf || !data || !conf.ccList.length || !dirty.value || pending.value || editorLocked.value) return false;
    if (form.value?.querySelector("input:invalid")) return false;
    const allowed = new Set(data.countries.map((country) => country.code));
    if (!conf.name.trim() || conf.ccList.some((code) => !allowed.has(code))) {
        error.value = "Choose a lobby name and at least one available country.";
        return false;
    }
    const numeric = [conf.roundTime, conf.numRounds, conf.numAttempt, conf.maxPlayers];
    if (conf.mode === 1 && !automaticScoring.value) numeric.push(conf.scoreFactor);
    if (!numeric.every((value) => Number.isInteger(value) && value > 0) || (conf.mode === 1 && !automaticScoring.value && conf.scoreFactor > 500)) {
        error.value = "Use whole positive numbers within the shown limits.";
        return false;
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
    error.value = "";
    if (!actions.updateSettings(payload)) {
        error.value = "Could not send settings. Retry when connected.";
        return false;
    }
    pending.value = payload;
    acknowledgement = setTimeout(() => {
        error.value = "The server hasn’t confirmed your settings.";
        pending.value = undefined;
    }, 5000);
    return true;
}
watch(confirmed, (conf, previous) => {
    if (!conf || !pending.value || !sameSettings(pending.value, conf)) return;
    clearTimeout(acknowledgement);
    pending.value = undefined;
    savedMessage.value = conf.roundTime === previous?.roundTime ? "Settings updated" : `Round time updated to ${conf.roundTime} s`;
    saved.value += 1;
    clearTimeout(feedback);
    feedback = setTimeout(() => (saved.value = 0), 1800);
    if (closeAfterSave.value) requestClose();
});
watch(
    [draft, editorLocked, pending],
    () => {
        clearTimeout(debounce);
        if (!dirty.value || editorLocked.value || pending.value || error.value) return;
        debounce = setTimeout(save, 350);
    },
    { deep: true }
);
watch(
    draft,
    () => {
        error.value = "";
    },
    { deep: true, flush: "sync" }
);
</script>
<style scoped>
.settings-form {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    font-size: 0.85rem;
    scrollbar-width: thin;
}
.settings-fields,
.boost-controls {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}
.chapter-controls {
    display: grid;
    gap: 0.38rem;
    align-content: start;
    min-width: 0;
}
.boost-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
    gap: 0.35rem;
}
.boost-controls legend {
    margin: 0.25rem 0 0;
}
.settings-form :deep(.field-help) {
    font-size: 0.76rem;
}
.score-preview summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
    font-weight: 700;
    color: var(--gb-accent);
    font-size: 0.8rem;
}
.score-preview summary::after {
    content: "+";
    margin-left: auto;
    font-family: var(--gb-font-mono);
}
.score-preview[open] summary::after {
    content: "−";
}
.settings-footer {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    justify-content: space-between;
    min-width: 0;
    min-height: 3rem;
    padding: 0.1rem 0.65rem max(0.1rem, env(safe-area-inset-bottom));
    background: var(--gb-surface);
}
.settings-retry {
    margin-left: auto;
}
.settings-done {
    min-width: 5.5rem;
    min-height: 44px;
    flex: none;
    margin-inline-start: auto;
    border-color: #c9fa95;
    border-radius: 9px;
    background: linear-gradient(150deg, #dbffa2, #7ae764);
    color: #06291d;
}
.settings-saved {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--gb-accent);
}
@media (prefers-reduced-motion: no-preference) {
    .settings-saved {
        animation: settings-confirmed 230ms ease-out;
    }
    @keyframes settings-confirmed {
        from {
            opacity: 0.35;
            translate: 0 3px;
        }
    }
}
.draft-link {
    display: inline-flex;
    min-width: 44px;
    min-height: 44px;
    gap: 0.25rem;
    align-items: center;
    background: none;
    color: var(--gb-accent);
    padding: 0;
    text-align: start;
    line-height: 1.15;
}
.draft-link:disabled {
    color: var(--gb-muted);
    opacity: 0.6;
}
.draft-status {
    color: var(--gb-muted);
    font-size: 0.71rem;
    line-height: 1.2;
    display: flex;
    gap: 0.4rem;
    align-items: center;
}
.catalog-state,
.settings-form > .field-error,
.settings-form > .notice {
    margin: 0.35rem 0.8rem;
}
@media (orientation: landscape) and (max-height: 540px) {
    .settings-form {
        font-size: 0.78rem;
    }
    .chapter-controls,
    .boost-controls {
        gap: 0.15rem;
    }
    .settings-form :deep(.field-label),
    .settings-form :deep(.region-modes button),
    .settings-form :deep(.continent-options button),
    .score-preview summary,
    .draft-link {
        font-size: 0.75rem;
    }
    .settings-form :deep(.field-help) {
        font-size: 0.7rem;
    }
    .settings-form :deep(.number-setting),
    .settings-form :deep(.timer-setting),
    .settings-form :deep(.check-row) {
        padding-block: 0;
    }
    .settings-form :deep(.number-input),
    .settings-form :deep(.timer-value),
    .settings-form :deep(.name-setting input) {
        font-size: 1rem;
    }
    .settings-footer {
        min-height: 44px;
        padding-block: 0 env(safe-area-inset-bottom);
    }
}
@media (min-width: 560px) and (orientation: landscape) and (max-height: 540px) {
    .settings-form :deep(.name-setting) {
        grid-template-columns: auto minmax(0, 1fr) 44px;
        column-gap: 0.65rem;
    }
    .settings-form :deep(.name-setting input) {
        grid-column: 2;
    }
    .settings-form :deep(.name-pencil) {
        grid-column: 3;
        grid-row: 1;
    }
}
@media (max-width: 760px), (orientation: landscape) and (max-height: 540px), (orientation: landscape) and (pointer: coarse) and (max-width: 1100px) {
    .settings-form {
        display: flex;
        flex: 1;
        flex-direction: column;
        overflow: hidden;
    }
    .settings-fields {
        display: flex;
        flex: 1;
        min-height: 0;
    }
    .settings-footer {
        flex: none;
        min-height: 44px;
        border-top: 1px solid var(--gb-line);
    }
}
.settings-form[data-edit-layout] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    padding: 0.25rem;
    overflow: hidden;
}
.settings-form.settings-edit-landscape {
    grid-template: minmax(0, 1fr) / minmax(0, 1fr) auto;
}
.settings-edit-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.35rem;
    padding: 0.1rem 0.45rem;
    font-size: 0.8rem;
    font-weight: 700;
}
.settings-edit-landscape .settings-edit-toolbar {
    grid-column: 2;
    grid-row: 1;
    align-self: start;
    flex-direction: column-reverse;
}
.settings-form[data-edit-layout] > :not(.settings-edit-toolbar, .settings-fields),
.settings-form[data-edit-layout] :deep(.folio-index),
.settings-form[data-edit-layout] :deep(.folio-page > .page-heading),
.settings-form[data-edit-layout="field"] .chapter-controls > :not(:focus-within),
.settings-form[data-edit-layout="field"] :deep(.timer-setting :is(.timer-presets, .timer-range-label, #round-timer)) {
    display: none;
}
.settings-form[data-edit-layout] .settings-fields,
.settings-form[data-edit-layout] :deep(.folio) {
    display: flex;
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
}
.settings-form[data-edit-layout] :deep(.folio) {
    flex-direction: column;
    height: auto;
    border: 0;
}
.settings-form[data-edit-layout] :deep(.folio-page) {
    flex: 1 1 0;
}
.settings-form[data-edit-layout] :deep(.folio-leaf) {
    padding: 0.3rem 0.6rem;
}
</style>
