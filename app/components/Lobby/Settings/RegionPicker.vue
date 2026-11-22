<template>
    <fieldset class="region-picker" :class="{ 'has-country-picker': hasChooser }" :disabled="disabled">
        <legend class="sr-only">Playable region</legend>
        <div
            v-if="!hasChooser || mode === 'country'"
            class="region-selection"
            :class="{ 'world-selection': isWorld && !hasChooser, 'current-country': hasChooser && singleCountry }"
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <span v-if="hasChooser && singleFlag" class="summary-flag" :style="singleFlag" aria-hidden="true" />
            <img v-else-if="isWorld && !hasChooser" src="/images/emerald-world.webp" alt="" width="160" height="160" />
            <UiIcon v-else name="map" />
            <span class="selection-label"
                ><span v-if="!hasChooser || singleCountry">Current selection</span><strong>{{ hasChooser && !singleCountry ? "Choose one country" : selectionTitle }}</strong></span
            >
            <span v-if="!hasChooser" class="country-total">{{ selectedCount }} {{ selectedCount === 1 ? "country" : "countries" }}</span>
        </div>
        <div class="region-modes" role="group" aria-label="Region type">
            <button type="button" :aria-pressed="browseAll" @click="browseAll = true">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">
                    <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" />
                </svg>
                <span>All</span>
            </button>
            <button
                v-for="option in modes"
                :key="option.id"
                type="button"
                :aria-label="option.label"
                :aria-pressed="!browseAll && mode === option.id"
                :disabled="!catalog.countries.length"
                @click="chooseMode(option.id)"
            >
                <UiIcon :name="option.icon" /><span>{{ option.label }}</span>
            </button>
        </div>

        <div v-if="browseAll" class="map-catalog-tools">
            <input
                v-model="presetQuery"
                type="search"
                class="input"
                aria-label="Search maps or regions"
                placeholder="Search maps or regions…"
                autocomplete="off"
                enterkeyhint="search"
                @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            />
            <select v-model="presetSort" class="input" aria-label="Sort maps">
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="countries">Country count</option>
            </select>
        </div>
        <div v-if="browseAll || mode === 'continents'" class="continent-options" role="group" :aria-label="browseAll ? 'Map presets' : 'Continent'">
            <button
                v-for="preset in visiblePresets"
                :key="preset.id"
                type="button"
                :aria-label="preset.id === 'world' || preset.id === 'custom' ? preset.name + ' map' : preset.name"
                :aria-pressed="isPresetSelected(preset.id, preset.codes)"
                :disabled="preset.id !== 'custom' && !preset.codes.length"
                @click="choosePreset(preset.id)"
            >
                <img v-if="scenicThumbs[preset.id]" class="continent-art" :src="scenicThumbs[preset.id]" alt="" width="320" height="180" loading="lazy" decoding="async" />
                <span v-else class="continent-art preset-emblem" :class="'preset-' + preset.id" aria-hidden="true">
                    <img v-if="preset.id === 'world'" src="/images/emerald-world.webp" alt="" width="160" height="160" />
                    <UiIcon v-else :name="preset.id === 'custom' ? 'plus' : 'globe'" />
                </span>
                <span class="continent-info"
                    ><strong>{{ preset.name }}</strong
                    ><span class="continent-count">{{ preset.id === "custom" ? "Select specific countries" : preset.codes.length + " countries" }}</span></span
                >
                <UiIcon v-if="isPresetSelected(preset.id, preset.codes)" class="continent-check" name="check" />
            </button>
            <p v-if="!visiblePresets.length" class="preset-empty">No maps match your search.</p>
        </div>
        <div v-if="!browseAll" class="region-workspace" :class="{ 'has-chooser': hasChooser, 'map-overlay-open': mapOpen }">
            <div v-if="hasChooser" class="country-panel">
                <Countries :key="mode" v-model="pickerSelection" :catalog="catalog" :disabled="disabled" :single="mode === 'country'">
                    <template #actions>
                        <button ref="mapTrigger" type="button" class="map-toggle" :aria-controls="mapId" :aria-expanded="mapOpen" aria-label="Show map" @click="openMap">
                            <UiIcon name="map" /><span>Map</span>
                        </button>
                    </template>
                </Countries>
            </div>
            <div :id="mapId" class="region-map-panel" @keydown.esc="onMapEscape">
                <div v-if="hasChooser" class="map-overlay-header">
                    <strong>Map preview</strong>
                    <button ref="mapClose" type="button" class="map-toggle" aria-label="Back to countries" @click="closeMap"><UiIcon name="close" /></button>
                </div>
                <RegionMap :catalog="catalog" :selected-codes="model" :mode="mode" :disabled="disabled" @select="chooseOnMap" />
            </div>
        </div>
        <p v-if="!hasChooser && !selectedCount" class="field-error" role="alert">Choose at least one country.</p>
    </fieldset>
</template>

<script setup lang="ts">
import Countries from "./Countries.vue";
import RegionMap from "./RegionMap.vue";
import type { CountryCatalog, RegionPickerMode } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";
import { continentArtwork as scenicThumbs } from "~/utils/regionArtwork";

const props = withDefaults(defineProps<{ catalog: CountryCatalog; disabled?: boolean }>(), { disabled: false });
// Expanded supported codes only. An empty array is an invalid Custom selection,
// never the backend's legacy World shorthand; serialization belongs to the form.
const model = defineModel<string[]>({ required: true });
const modes: Array<{ id: RegionPickerMode; label: string; icon: string }> = [
    { id: "world", label: "World", icon: "globe" },
    { id: "continents", label: "Continents", icon: "map" },
    { id: "country", label: "Country", icon: "pin" },
    { id: "custom", label: "Custom", icon: "fullscreen" },
];
const availableCodes = computed(() => props.catalog.countries.map((country) => country.code));
const available = computed(() => new Set(availableCodes.value));
const selected = computed(() => new Set(model.value));
const selectedCount = computed(() => availableCodes.value.filter((code) => selected.value.has(code)).length);
const singleCountry = computed(() => (selected.value.size === 1 ? props.catalog.countries.find((country) => selected.value.has(country.code)) : undefined));
const flags = useCountriesFlagMap();
const singleFlag = computed(() => {
    const flag = singleCountry.value && flags.value.get(singleCountry.value.code);
    return flag ? { backgroundPosition: flag.x + "px " + flag.y + "px" } : undefined;
});
const selectedContinent = computed(() => props.catalog.continents.find((continent) => matches(continent.codes)));
const isWorld = computed(() => matches(availableCodes.value));
const mode = ref<RegionPickerMode>(inferMode());
const browseAll = ref(mode.value === "world" || mode.value === "continents");
const hasChooser = computed(() => !browseAll.value && (mode.value === "country" || mode.value === "custom"));
const mapId = useId();
const mapOpen = ref(false);
const mapTrigger = useTemplateRef("mapTrigger");
const mapClose = useTemplateRef("mapClose");
watch([mode, browseAll], () => (mapOpen.value = false));

async function openMap() {
    mapOpen.value = true;
    await nextTick();
    mapClose.value?.focus();
}

async function closeMap() {
    mapOpen.value = false;
    await nextTick();
    mapTrigger.value?.focus({ preventScroll: true });
}

function onMapEscape(event: KeyboardEvent) {
    if (!mapOpen.value || !mapClose.value?.offsetWidth) return;
    event.preventDefault();
    event.stopPropagation();
    void closeMap();
}
const presetQuery = ref("");
const presetSort = ref<"featured" | "name" | "countries">("featured");
const visiblePresets = computed(() => {
    const featured = Object.keys(scenicThumbs);
    const continents = [...props.catalog.continents].sort((a, b) => {
        const index = (id: string) => (featured.includes(id) ? featured.indexOf(id) : featured.length);
        return index(a.id) - index(b.id) || a.name.localeCompare(b.name);
    });
    if (!browseAll.value) return continents;
    const query = presetQuery.value.trim().toLowerCase();
    const presets = [{ id: "world", name: "World", codes: availableCodes.value }, ...continents, { id: "custom", name: "Custom", codes: [] }].filter((preset) =>
        preset.name.toLowerCase().includes(query)
    );
    if (presetSort.value === "name") presets.sort((a, b) => a.name.localeCompare(b.name));
    if (presetSort.value === "countries") presets.sort((a, b) => b.codes.length - a.codes.length || a.name.localeCompare(b.name));
    return presets;
});
const explicitlyEditing = ref(false);
let customDraft: string[] | undefined;

const selectionTitle = computed(() => {
    if (!selectedCount.value) return "No countries selected";
    if (mode.value === "custom") return "Custom selection";
    if (isWorld.value) return "World";
    return selectedContinent.value?.name || (singleCountry.value && countryDisplayName(singleCountry.value.code, singleCountry.value.name)) || "Custom selection";
});
const pickerSelection = computed({
    get: () => model.value,
    set: (codes: string[]) => {
        if (props.disabled) return;
        if (mode.value === "country") {
            if (codes[0]) chooseCountry(codes[0]);
            return;
        }
        explicitlyEditing.value = true;
        // Keep explicit Custom even when its next edit selects one/all countries.
        const next = new Set(codes);
        model.value = availableCodes.value.filter((code) => next.has(code));
    },
});

function matches(codes: string[]) {
    return codes.length > 0 && selected.value.size === codes.length && codes.every((code) => selected.value.has(code));
}

function inferMode(): RegionPickerMode {
    if (isWorld.value) return "world";
    if (selectedContinent.value) return "continents";
    if (singleCountry.value) return "country";
    return "custom";
}

function isPresetSelected(id: string, codes: string[]) {
    return id === "custom" ? mode.value === "custom" && selectedCount.value > 0 && !isWorld.value && !selectedContinent.value : matches(codes);
}

function choosePreset(id: string) {
    if (id === "world") chooseMode("world", true);
    else if (id === "custom") chooseMode("custom");
    else chooseContinent(id);
}

function chooseMode(next: RegionPickerMode, keepGallery = false) {
    if (props.disabled || !availableCodes.value.length) return;
    browseAll.value = keepGallery;
    if (next === mode.value) return;
    if (mode.value === "custom") customDraft = [...model.value];
    explicitlyEditing.value = true;
    mode.value = next;
    // Opening a chooser does not replace a valid selection with an arbitrary
    // first option. World is the only mode button that immediately chooses.
    if (next === "world") model.value = [...availableCodes.value];
    if (next === "custom" && customDraft) model.value = customDraft.filter((code) => available.value.has(code));
}

function chooseContinent(id: string) {
    if (props.disabled) return;
    const continent = props.catalog.continents.find((item) => item.id === id);
    if (!continent?.codes.length) return;
    chooseMode("continents", browseAll.value);
    model.value = continent.codes.filter((code) => available.value.has(code));
}

function chooseCountry(code: string) {
    if (props.disabled || !available.value.has(code)) return;
    explicitlyEditing.value = true;
    mode.value = "country";
    model.value = [code];
}

function chooseOnMap(code: string) {
    if (props.disabled) return;
    const country = props.catalog.countries.find((item) => item.code === code);
    if (!country) return;
    explicitlyEditing.value = true;
    if (mode.value === "continents") {
        chooseContinent(country.continent);
    } else if (mode.value === "world" || mode.value === "country") {
        chooseCountry(code);
    } else {
        const next = new Set(model.value);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        model.value = availableCodes.value.filter((item) => next.has(item));
    }
}

watch(
    [() => props.catalog, () => model.value],
    () => {
        // Initial/external hydration may arrive after setup. Never re-infer an
        // in-progress explicit Custom (or an opened Country/Continent chooser).
        if (!explicitlyEditing.value) mode.value = inferMode();
    },
    { deep: true }
);
</script>

<style scoped>
.region-picker {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    container-type: inline-size;
    container-name: region-picker;
}
.region-modes {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    width: 100%;
    gap: 0.35rem;
}
.region-modes button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-width: 0;
    min-height: 44px;
    padding: 0.35rem 0.25rem;
    border: 1px solid #a6eedb38;
    border-radius: 9px;
    background: linear-gradient(145deg, #397c6a28, #062c2794);
    color: #e3faf2;
    font-size: 0.8rem;
    font-weight: 600;
}

.region-modes button[aria-pressed="true"] {
    border-color: #cafd90;
    box-shadow:
        inset 0 0 16px #99ef6554,
        0 0 12px #99ef6530;
    background: linear-gradient(145deg, #306b4c, #0a3f30);
    color: #eaffc4;
}
.region-modes button > svg {
    width: 1rem;
    height: 1rem;
    flex: none;
}
.region-modes button:not([aria-pressed="true"]):enabled:hover,
.continent-options button:not([aria-pressed="true"]):enabled:hover {
    background: var(--gb-raised);
    color: var(--gb-text);
}
.region-modes button:focus-visible,
.continent-options button:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 2px;
}

.continent-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
}
.continent-options button {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.1rem;
    min-width: 0;
    min-height: 44px;
    padding: 0;
    overflow: hidden;
    border: 1px solid #92d7ba55;
    border-radius: 10px;
    background: #082e2c;
    color: var(--gb-text);
    text-align: left;
    font-size: 0.85rem;
    line-height: 1.2;
}
.continent-art {
    display: block;
    width: 100%;
    height: clamp(3rem, 10dvh, 6.25rem);
    object-fit: cover;
}
.preset-emblem {
    display: grid;
    place-items: center;
    background: radial-gradient(ellipse at 65% 65%, #1b665b, #08241f 75%);
}
.preset-emblem img {
    width: clamp(2.4rem, 9dvh, 5.3rem);
    max-width: 100%;
    height: auto;
}
.preset-custom .ui-icon {
    width: 2rem;
    height: 2rem;
    padding: 0.3rem;
    border: 1px dashed #baf89488;
    border-radius: 9px;
    color: #d9ffa0;
}
.map-catalog-tools {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(6.5rem, 10rem);
    gap: 0.45rem;
}
.map-catalog-tools > * {
    min-width: 0;
    font-size: 1rem;
}
.preset-empty {
    grid-column: 1 / -1;
    color: var(--gb-muted);
}
.continent-info {
    display: grid;
    gap: 0.2rem;
    padding: 0.38rem 0.5rem;
}
.continent-check {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
    padding: 2px;
    border-radius: 50%;
    background: #b8f978;
    color: #082e2c;
}
.continent-options button[aria-pressed="true"] {
    border-color: var(--gb-accent-end);
    background: var(--gb-raised);
    color: var(--gb-accent);
    box-shadow:
        inset 0 0 0 1px #cbff96,
        0 0 9px #a3f66b4c;
}
.continent-count {
    color: var(--gb-muted);
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
}
.region-selection {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.2rem 0.75rem;
    min-height: 50px;
    padding: 0.35rem 0.6rem;
    border: 1px solid #a4ecd35c;
    border-radius: 10px;
    background: linear-gradient(120deg, #174c3c, #072d29);
}
.region-selection img {
    width: clamp(2rem, 8vw, 4.2rem);
    height: auto;
}
.region-selection > svg {
    color: #c9f797;
}
.region-selection.world-selection {
    background: radial-gradient(ellipse at 72% 20%, #176b5c8a, transparent 66%), linear-gradient(125deg, #031c20, #0d4238);
}
.selection-label {
    display: grid;
    min-width: 0;
    flex: 1 1 6rem;
    gap: 0.1rem;
}
.country-total {
    padding: 0.2rem 0.45rem;
    border: 1px solid #a4ecd33d;
    border-radius: 999px;
    background: #072a26;
}
.region-selection strong {
    color: var(--gb-accent);
    font-size: 0.9rem;
    overflow-wrap: anywhere;
}
.region-selection > span {
    color: var(--gb-muted);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
}
.region-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 0.5rem;
}
.country-panel {
    min-width: 0;
}
.region-picker.has-country-picker {
    min-height: 0;
    height: 100%;
}
.has-country-picker .region-selection {
    flex: none;
    min-height: 38px;
    padding-block: 0.3rem;
}
.summary-flag {
    flex: none;
    width: 32px;
    height: 24px;
    border-radius: 4px;
    background-image: url("/images/flags32.webp");
    box-shadow:
        0 1px 5px #0006,
        inset 0 0 0 1px #fff2;
}
.has-chooser {
    position: relative;
    flex: 1 1 0;
    grid-template-rows: minmax(0, 1fr);
    align-items: stretch;
    min-height: 0;
}
.has-chooser .country-panel {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
}
.has-chooser .region-map-panel {
    display: none;
    min-width: 0;
    min-height: 0;
    padding: 0.45rem;
    overflow: hidden;
    border: 1px solid #a2dfc841;
    border-radius: 0.8rem;
    background: #0a2826;
}
.has-chooser.map-overlay-open .country-panel {
    visibility: hidden;
}
.has-chooser.map-overlay-open .region-map-panel {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}
.map-overlay-header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-inline-start: 0.25rem;
    color: #e7f6f0;
    font-size: 0.8rem;
}
.map-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-width: 44px;
    min-height: 44px;
    padding: 0.2rem 0.5rem;
    border: 1px solid #a2dfc841;
    border-radius: 0.65rem;
    background: #143a31;
    color: #e9faf4;
    font-size: 0.75rem;
    font-weight: 700;
}
.map-toggle:enabled:hover {
    border-color: #bee8a382;
    background: #23523f;
}
.map-toggle .ui-icon {
    width: 1.05rem;
}
.has-chooser .region-map-panel :deep(.region-map) {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
}
.has-chooser .region-map-panel :deep(.map-stage) {
    flex: 1 1 0;
    height: auto;
    min-height: 0;
}
.has-chooser .region-map-panel :deep(.map-toolbar) {
    flex: none;
}
@media (min-height: 541px) {
    @container region-picker (min-width: 600px) {
        .region-workspace.has-chooser {
            grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
        }
        .has-chooser.map-overlay-open .country-panel {
            visibility: visible;
        }
        .has-chooser .region-map-panel,
        .has-chooser.map-overlay-open .region-map-panel {
            position: static;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
        }
        .map-toggle {
            display: none;
        }
    }
}
@container (max-width: 385px) {
    .map-toggle {
        padding: 0;
    }
    .map-toggle span {
        display: none;
    }
}
@container (min-width: 630px) {
    .continent-options {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}
@container (max-width: 450px) {
    .region-modes button {
        flex-direction: column;
        gap: 0.1rem;
        padding-inline: 0;
        font-size: 0.72rem;
        overflow-wrap: anywhere;
    }
    .map-catalog-tools {
        grid-template-columns: minmax(0, 1fr) 6.75rem;
    }
}
@media (max-width: 760px) and (orientation: portrait) {
    .continent-options {
        grid-template-columns: minmax(0, 1fr);
    }
    .continent-options button {
        min-height: 58px;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 0.35rem;
        padding: 0.25rem 1.65rem 0.25rem 0.3rem;
    }
    .continent-art {
        width: 4.4rem;
        height: 2.75rem;
        flex: none;
        border-radius: 6px;
    }
    .preset-emblem img {
        width: 2.45rem;
    }
    .continent-check {
        top: 50%;
        transform: translateY(-50%);
    }
}
@media (max-height: 540px) and (orientation: landscape) {
    .region-picker {
        gap: 0.35rem;
    }
    .region-selection img {
        width: 2.1rem;
    }
    .continent-options {
        grid-template-columns: none;
        grid-auto-flow: column;
        grid-auto-columns: clamp(7rem, 24%, 10rem);
        overflow-x: auto;
        padding: 2px 1px 0.3rem;
        scroll-snap-type: x proximity;
        scrollbar-width: thin;
    }
    .continent-options button {
        scroll-snap-align: start;
    }
    .continent-art {
        height: clamp(2.25rem, 13dvh, 4.5rem);
    }
    .preset-emblem img {
        width: 2.25rem;
    }
    .preset-empty {
        grid-column: auto;
    }
    .has-chooser .region-map-panel :deep(.map-hint) {
        display: none;
    }
}
@media (min-width: 560px) and (max-height: 420px) and (orientation: landscape) {
    .region-picker.has-country-picker:has(.region-selection) {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(5.75rem, 23%);
        grid-template-rows: auto minmax(0, 1fr);
    }
    .has-country-picker .region-selection {
        grid-area: 1 / 2;
        flex-wrap: nowrap;
        padding: 0.25rem 0.4rem;
    }
    .has-country-picker .region-selection .selection-label > span {
        display: none;
    }
    .has-country-picker .region-selection strong {
        font-size: 0.78rem;
    }
    .has-country-picker:has(.region-selection) .region-modes {
        grid-area: 1 / 1;
    }
    .has-country-picker:has(.region-selection) .region-workspace {
        grid-column: 1 / -1;
    }
}
.settings-searching .region-picker.has-country-picker:has(.region-selection) {
    display: flex;
}
.settings-searching .region-selection,
.settings-searching .region-modes,
.settings-searching .has-chooser .map-toggle,
.settings-searching .has-chooser .region-map-panel,
.settings-searching .map-catalog-tools select {
    display: none;
}
.settings-searching .has-chooser.map-overlay-open .country-panel {
    visibility: visible;
}
.settings-searching .map-catalog-tools {
    grid-template-columns: minmax(0, 1fr);
}
.map-catalog-tools input {
    font-size: max(16px, 1rem);
}
</style>
