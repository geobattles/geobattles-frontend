<template>
    <fieldset class="region-picker" :disabled="disabled">
        <legend class="sr-only">Playable region</legend>
        <div class="region-modes" role="group" aria-label="Region type">
            <button
                v-for="option in modes"
                :key="option.id"
                type="button"
                :aria-label="option.label"
                :aria-pressed="mode === option.id"
                :disabled="!catalog.countries.length"
                @click="chooseMode(option.id)"
            >
                <span>{{ option.label }}</span>
            </button>
        </div>

        <div v-if="mode === 'continents'" class="continent-options" role="group" aria-label="Continent">
            <button
                v-for="continent in catalog.continents"
                :key="continent.id"
                type="button"
                :aria-label="continent.name"
                :aria-pressed="matches(continent.codes)"
                :disabled="!continent.codes.length"
                @click="chooseContinent(continent.id)"
            >
                <span>{{ continent.name }}</span
                ><span class="continent-count">{{ continent.codes.length }} countries</span>
            </button>
        </div>
        <div class="region-selection" role="status" aria-live="polite" aria-atomic="true">
            <span class="selection-label"
                >Selected <strong>{{ selectionTitle }}</strong></span
            >
            <span v-if="selectedCount !== 1">{{ selectedCount }} countries</span>
        </div>
        <div class="region-workspace" :class="{ 'has-chooser': mode === 'country' || mode === 'custom' }">
            <RegionMap :catalog="catalog" :selected-codes="model" :mode="mode" :disabled="disabled" @select="chooseOnMap" />
            <div v-if="mode === 'country' || mode === 'custom'" class="country-panel">
                <Countries v-if="mode === 'country'" key="country" v-model="countrySelection" :catalog="catalog" :disabled="disabled" single />
                <Countries v-else key="custom" v-model="customSelection" :catalog="catalog" :disabled="disabled" />
            </div>
        </div>
        <p v-if="mode !== 'custom' && !selectedCount" class="field-error" role="alert">Choose at least one country.</p>
    </fieldset>
</template>

<script setup lang="ts">
import Countries from "./Countries.vue";
import RegionMap from "./RegionMap.vue";
import type { CountryCatalog, RegionPickerMode } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";

const props = withDefaults(defineProps<{ catalog: CountryCatalog; disabled?: boolean }>(), { disabled: false });
// Expanded supported codes only. An empty array is an invalid Custom selection,
// never the backend's legacy World shorthand; serialization belongs to the form.
const model = defineModel<string[]>({ required: true });
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
const singleCountry = computed(() => (selected.value.size === 1 ? props.catalog.countries.find((country) => selected.value.has(country.code)) : undefined));
const selectedContinent = computed(() => props.catalog.continents.find((continent) => matches(continent.codes)));
const isWorld = computed(() => matches(availableCodes.value));
const mode = ref<RegionPickerMode>(inferMode());
const explicitlyEditing = ref(false);

const selectionTitle = computed(() => {
    if (!selectedCount.value) return "No countries selected";
    if (mode.value === "custom") return "Custom selection";
    if (isWorld.value) return "World";
    return selectedContinent.value?.name || (singleCountry.value && countryDisplayName(singleCountry.value.code, singleCountry.value.name)) || "Custom selection";
});
const customSelection = computed({
    get: () => model.value,
    set: (codes: string[]) => {
        if (props.disabled) return;
        explicitlyEditing.value = true;
        // Keep explicit Custom even when its next edit selects one/all countries.
        const next = new Set(codes);
        model.value = availableCodes.value.filter((code) => next.has(code));
    },
});
const countrySelection = computed({
    get: () => model.value,
    set: (codes: string[]) => {
        const code = codes[0];
        if (code) chooseCountry(code);
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
    if (props.disabled || !availableCodes.value.length) return;
    explicitlyEditing.value = true;
    mode.value = next;
    // Opening a chooser does not replace a valid selection with an arbitrary
    // first option. World is the only mode button that immediately chooses.
    if (next === "world") model.value = [...availableCodes.value];
}

function chooseContinent(id: string) {
    if (props.disabled) return;
    const continent = props.catalog.continents.find((item) => item.id === id);
    if (!continent?.codes.length) return;
    explicitlyEditing.value = true;
    mode.value = "continents";
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
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    border: 0;
    container-type: inline-size;
}
.region-modes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--gb-line);
    border-radius: 10px;
    background: var(--gb-bg);
}
.region-modes button {
    min-width: 0;
    min-height: 44px;
    padding: 0.35rem 0.25rem;
    border: 1px solid transparent;
    border-radius: 7px;
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

.continent-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
}
.continent-options button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.3rem;
    min-width: 0;
    min-height: 44px;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
    background: var(--gb-bg);
    color: var(--gb-text);
    text-align: left;
    font-size: 0.85rem;
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
.region-selection {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.2rem 0.75rem;
    padding: 0.1rem 0.15rem;
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
.selection-label strong {
    margin-left: 0.3rem;
}
.region-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 0.85rem;
}
.country-panel {
    min-width: 0;
}
@container (min-width: 780px) {
    .region-workspace.has-chooser {
        grid-template-columns: minmax(0, 1.25fr) minmax(280px, 1fr);
    }
}
@media (max-width: 360px) {
    .region-picker {
        gap: 0.5rem;
    }
}
@container (max-width: 300px) {
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
