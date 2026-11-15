<template>
    <fieldset class="region-picker" :disabled="disabled">
        <legend class="sr-only">Playable region</legend>
        <div class="region-modes" role="group" aria-label="Region type">
            <button v-for="option in modes" :key="option.id" type="button" :aria-pressed="mode === option.id" :disabled="!catalog.countries.length" @click="chooseMode(option.id)">
                {{ option.label }}
            </button>
        </div>

        <div v-if="mode === 'continents'" class="continent-options" role="group" aria-label="Continent">
            <button
                v-for="continent in catalog.continents"
                :key="continent.id"
                type="button"
                :aria-pressed="matches(continent.codes)"
                :disabled="!continent.codes.length"
                @click="chooseContinent(continent.id)"
            >
                <span>{{ continent.name }}</span
                ><span class="continent-count" aria-hidden="true">{{ continent.codes.length }}</span>
            </button>
        </div>
        <div v-else-if="mode === 'country'" class="field country-select">
            <label :for="`${id}-country-search`">Search countries</label>
            <div class="country-search">
                <input
                    :id="`${id}-country-search`"
                    v-model="countrySearch"
                    type="search"
                    class="input"
                    placeholder="Name or code"
                    autocomplete="off"
                    :aria-controls="`${id}-country`"
                    :aria-describedby="`${id}-search-status`"
                    @keydown.enter.prevent
                />
                <button v-if="countrySearch" type="button" class="btn btn-secondary" aria-label="Clear country search" @click="countrySearch = ''">Clear</button>
            </div>
            <label :for="`${id}-country`">Country</label>
            <select
                :id="`${id}-country`"
                class="input"
                :value="singleCountry?.code || ''"
                required
                :aria-describedby="`${id}-hint ${id}-search-status`"
                @change="chooseCountryFromSelect"
            >
                <option value="" disabled>Choose a country…</option>
                <option v-if="selectedOutsideSearch && singleCountry" :value="singleCountry.code">{{ singleCountry.name }} (selected)</option>
                <option v-for="country in filteredCountries" :key="country.code" :value="country.code">{{ country.name }}</option>
            </select>
            <p :id="`${id}-search-status`" class="region-hint" role="status">{{ filteredCountries.length ? "" : "No countries match your search." }}</p>
        </div>
        <p :id="`${id}-hint`" class="region-hint">{{ modeHint }}</p>

        <RegionMap :catalog="catalog" :selected-codes="model" :mode="mode" :disabled="disabled" @select="chooseOnMap" />
        <div class="region-selection" role="status" aria-live="polite" aria-atomic="true">
            <strong>{{ selectionTitle }}</strong
            ><span>{{ selectedCount }} of {{ catalog.countries.length }} countries</span>
        </div>

        <div v-if="mode === 'custom'" class="custom-countries">
            <Countries v-model="customSelection" />
        </div>
        <p v-else-if="!selectedCount" class="field-error" role="alert">Choose at least one country.</p>
    </fieldset>
</template>

<script setup lang="ts">
import Countries from "./Countries.vue";
import RegionMap from "./RegionMap.vue";
import type { CountryCatalog, RegionPickerMode } from "~/types/regions";

const props = withDefaults(defineProps<{ catalog: CountryCatalog; disabled?: boolean }>(), { disabled: false });
// Expanded supported codes only. An empty array is an invalid Custom selection,
// never the backend's legacy World shorthand; serialization belongs to the form.
const model = defineModel<string[]>({ required: true });
const id = useId();
const modes: Array<{ id: RegionPickerMode; label: string }> = [
    { id: "world", label: "World" },
    { id: "continents", label: "Continents" },
    { id: "country", label: "Country" },
    { id: "custom", label: "Custom" },
];
const availableCodes = computed(() => props.catalog.countries.map((country) => country.code));
const available = computed(() => new Set(availableCodes.value));
const selected = computed(() => new Set(model.value));
const selectedCount = computed(() => availableCodes.value.filter((code) => selected.value.has(code)).length);
const orderedCountries = computed(() => [...props.catalog.countries].sort((a, b) => a.name.localeCompare(b.name, "en") || a.code.localeCompare(b.code, "en")));
const singleCountry = computed(() => (selected.value.size === 1 ? props.catalog.countries.find((country) => selected.value.has(country.code)) : undefined));
const countrySearch = ref("");
function normalizeSearch(value: string) {
    return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
const filteredCountries = computed(() => {
    const query = normalizeSearch(countrySearch.value);
    return orderedCountries.value.filter((country) => normalizeSearch(country.name).includes(query) || country.code.toLowerCase().includes(query));
});
// Keep the native selected option present: filtering must never choose another
// country or conceal the draft's selection when it does not match the query.
const selectedOutsideSearch = computed(() => singleCountry.value && !filteredCountries.value.some((country) => country.code === singleCountry.value?.code));
const selectedContinent = computed(() => props.catalog.continents.find((continent) => matches(continent.codes)));
const isWorld = computed(() => matches(availableCodes.value));
const mode = ref<RegionPickerMode>(inferMode());
watch(mode, () => (countrySearch.value = ""));
const explicitlyEditing = ref(false);
const modeHint = computed(() => {
    if (mode.value === "world") return "Every available country. Pick a continent on the map.";
    if (mode.value === "continents") return "Choose one continent above or on the map.";
    if (mode.value === "country") return "Choose one country. The map zooms to your selection.";
    return "Mix countries on the map or use the checklist below.";
});
const selectionTitle = computed(() => {
    if (!selectedCount.value) return "No countries selected";
    if (mode.value === "custom") return "Custom selection";
    if (isWorld.value) return "World";
    return selectedContinent.value?.name || singleCountry.value?.name || "Custom selection";
});
const customSelection = computed({
    get: () => model.value,
    set: (codes: string[]) => {
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

function chooseMode(next: RegionPickerMode) {
    explicitlyEditing.value = true;
    mode.value = next;
    // Opening a chooser does not replace a valid selection with an arbitrary
    // first option. World is the only mode button that immediately chooses.
    if (next === "world") model.value = [...availableCodes.value];
}

function chooseContinent(id: string) {
    const continent = props.catalog.continents.find((item) => item.id === id);
    if (!continent) return;
    explicitlyEditing.value = true;
    mode.value = "continents";
    model.value = continent.codes.filter((code) => available.value.has(code));
}

function chooseCountryFromSelect(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    if (!available.value.has(code)) return;
    explicitlyEditing.value = true;
    model.value = [code];
}

function chooseOnMap(code: string) {
    const country = props.catalog.countries.find((item) => item.code === code);
    if (!country) return;
    explicitlyEditing.value = true;
    if (mode.value === "world" || mode.value === "continents") {
        chooseContinent(country.continent);
    } else if (mode.value === "country") {
        model.value = [code];
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
    gap: 0.65rem;
    margin: 0;
    padding: 0;
    border: 0;
}
.region-modes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.2rem;
    padding: 0.2rem;
    border: 1px solid var(--gb-line);
    border-radius: 7px;
    background: var(--gb-bg);
}
.region-modes button {
    min-width: 0;
    min-height: 44px;
    padding: 0.35rem 0.2rem;
    border: 1px solid transparent;
    border-radius: var(--gb-radius);
    background: transparent;
    color: var(--gb-muted);
    font-size: 0.8rem;
    font-weight: 600;
}
.region-modes button[aria-pressed="true"] {
    border-color: var(--gb-accent-end);
    background: var(--gb-accent);
    color: var(--gb-on-accent);
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
.region-hint {
    color: var(--gb-muted);
    font-size: 0.75rem;
    line-height: 1.4;
}
.continent-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
}
.continent-options button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    min-width: 0;
    min-height: 44px;
    padding: 0.4rem 0.55rem;
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
    background: var(--gb-bg);
    color: var(--gb-text);
    text-align: left;
    font-size: 0.75rem;
    line-height: 1.2;
}
.continent-options button[aria-pressed="true"] {
    border-color: var(--gb-accent-end);
    background: var(--gb-raised);
    color: var(--gb-accent);
    box-shadow: inset 0 -2px var(--gb-accent);
}
.continent-count {
    color: var(--gb-muted);
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
}
.country-select select,
.country-search input {
    min-width: 0;
    max-width: 100%;
    min-height: 44px;
    font-size: 1rem;
    text-overflow: ellipsis;
}
.country-search {
    display: flex;
    gap: 0.4rem;
}
.country-search input {
    flex: 1;
}
.country-search button {
    min-width: 44px;
    min-height: 44px;
}
.country-select [role="status"]:empty {
    display: none;
}
.region-selection {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.2rem 0.75rem;
    padding-bottom: 0.55rem;
    border-bottom: 1px solid var(--gb-line);
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
.custom-countries {
    min-width: 0;
}
.custom-countries :deep(.country-list) {
    max-height: min(280px, 36dvh);
}
@media (max-width: 360px) {
    .region-picker {
        gap: 0.5rem;
    }
    .region-modes {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0;
        padding: 0.15rem;
    }
    .region-modes button {
        font-size: 0.75rem;
    }
    .continent-options {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
