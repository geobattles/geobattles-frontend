<template>
    <fieldset class="country-chooser" :disabled="disabled">
        <legend class="sr-only">{{ single ? "Choose one country" : "Choose custom countries" }}</legend>
        <div v-if="single && currentCountry" class="current-country sr-only">
            <span class="country-flag" :style="flagStyle(currentCountry.code)" aria-hidden="true" />
            <span
                ><small>Selected country</small><strong>{{ currentCountry.name }}</strong></span
            >
        </div>

        <div class="field country-search-field">
            <label :for="`${id}-search`" class="sr-only">{{ single ? "Choose a country" : "Find countries" }}</label>
            <div class="country-search">
                <input
                    :id="`${id}-search`"
                    ref="searchInput"
                    v-model="search"
                    type="search"
                    class="input"
                    placeholder="Search by name or code"
                    autocomplete="off"
                    spellcheck="false"
                    :aria-controls="`${id}-results`"
                    :aria-describedby="`${id}-results-status`"
                    @keydown.enter.prevent
                    @keydown.down.prevent="focusFirstResult"
                />
                <button v-if="search" type="button" class="chooser-action search-clear" aria-label="Clear country search" @click="clearSearch">
                    <span>Clear</span>
                    <svg class="search-clear-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
                    </svg>
                </button>
            </div>
        </div>
        <div v-if="!single" class="country-tools">
            <p class="selection-count" role="status">
                <strong>{{ selectedCount }}</strong> of {{ countries.length }} selected
            </p>
            <button type="button" class="chooser-action selected-filter" :aria-pressed="selectedOnly" @click="selectedOnly = !selectedOnly">Selected only</button>
        </div>
        <p :id="`${id}-results-status`" class="sr-only" role="status">{{ resultsStatus }}</p>
        <div :id="`${id}-results`" ref="resultsList" class="country-list" role="group" :aria-label="single ? 'Country search results' : 'Custom country search results'">
            <template v-for="country in filtered" :key="country.code">
                <button v-if="single" type="button" class="country-choice" :aria-pressed="currentCountry?.code === country.code" @click="chooseCountry(country.code)">
                    <span class="country-flag" :style="flagStyle(country.code)" aria-hidden="true" />
                    <span class="country-name">{{ country.name }}</span>
                    <span class="country-code">{{ country.code }}</span>
                    <span class="choice-mark" aria-hidden="true">{{ currentCountry?.code === country.code ? "✓" : "+" }}</span>
                </button>
                <label v-else class="country-choice" :class="{ 'is-selected': selected.has(country.code) }">
                    <input type="checkbox" :value="country.code" :checked="selected.has(country.code)" @change="toggleCountry(country.code)" />
                    <span class="country-flag" :style="flagStyle(country.code)" aria-hidden="true" />
                    <span class="country-name">{{ country.name }}</span>
                    <span class="country-code">{{ country.code }}</span>
                </label>
            </template>
            <div v-if="!filtered.length" class="empty-results">
                <p>
                    {{
                        !countries.length
                            ? "The country list is not available yet."
                            : selectedOnly && !selectedCount
                              ? "No countries selected yet."
                              : "No countries match these filters."
                    }}
                </p>
                <button v-if="search || selectedOnly" type="button" class="chooser-action" @click="resetFilters">Show all countries</button>
            </div>
        </div>
        <div v-if="!single" class="bulk-actions" role="group" aria-label="Bulk country selection">
            <template v-if="search.trim() && !selectedOnly">
                <button type="button" class="chooser-action" :disabled="!unselectedMatches.length" @click="addMatches">Add {{ unselectedMatches.length }} matching</button>
                <button type="button" class="chooser-action" :disabled="!selectedMatches.length" @click="removeMatches">Remove {{ selectedMatches.length }} matching</button>
            </template>
            <button v-else type="button" class="chooser-action" :disabled="selectedCount === countries.length" @click="selectAll">Select all {{ countries.length }}</button>
            <button type="button" class="chooser-action" :disabled="!selectedCount" @click="clearSelection">Clear selection</button>
        </div>
        <p v-if="!single && !selectedCount" class="field-error" role="alert">Choose at least one country.</p>
    </fieldset>
</template>
<script setup lang="ts">
import type { CountryCatalog } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";

const props = withDefaults(defineProps<{ catalog?: CountryCatalog; single?: boolean; disabled?: boolean }>(), { single: false, disabled: false });
const model = defineModel<string[]>({ required: true });
const legacyCountries = useCountryList();
const flags = useCountriesFlagMap();
const id = useId();
const search = ref("");
const selectedOnly = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const resultsList = ref<HTMLDivElement | null>(null);
const countries = computed(() =>
    (props.catalog?.countries ?? legacyCountries.value.map((code) => ({ code, name: flags.value.get(code)?.name || code })))
        .map((country) => ({ ...country, name: countryDisplayName(country.code, country.name), searchName: country.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "en") || a.code.localeCompare(b.code, "en"))
);
const selected = computed(() => new Set(model.value));
const selectedCount = computed(() => countries.value.filter((country) => selected.value.has(country.code)).length);
const currentCountry = computed(() => (selected.value.size === 1 ? countries.value.find((country) => selected.value.has(country.code)) : undefined));
watch(
    [currentCountry, () => props.single, searchInput],
    () => {
        // Preserve native form validation when Country is opened from a multi-
        // country draft, without changing that draft merely by opening/searching.
        searchInput.value?.setCustomValidity(props.single && !currentCountry.value ? "Choose one country from the results or map." : "");
    },
    { immediate: true, flush: "post" }
);
function normalizeSearch(value: string) {
    return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
const filtered = computed(() => {
    const query = normalizeSearch(search.value);
    return countries.value.filter(
        (country) =>
            (!selectedOnly.value || props.single || selected.value.has(country.code)) && normalizeSearch(`${country.name} ${country.searchName} ${country.code}`).includes(query)
    );
});
const selectedMatches = computed(() => filtered.value.filter((country) => selected.value.has(country.code)));
const unselectedMatches = computed(() => filtered.value.filter((country) => !selected.value.has(country.code)));
const resultsStatus = computed(() => {
    if (!filtered.value.length) return "No countries shown.";
    const count = `${filtered.value.length} ${filtered.value.length === 1 ? "country" : "countries"}`;
    return `${count} shown`;
});

function flagStyle(code: string) {
    // Sprite coordinates belong to each code, never its filtered/sorted index.
    const flag = flags.value.get(code);
    return flag ? { backgroundPosition: `${flag.x}px ${flag.y}px` } : { backgroundImage: "none" };
}

function updateSelection(codes: Iterable<string>) {
    if (props.disabled) return;
    const next = new Set(codes);
    model.value = countries.value.filter((country) => next.has(country.code)).map((country) => country.code);
}

function chooseCountry(code: string) {
    updateSelection([code]);
}

async function toggleCountry(code: string) {
    if (props.disabled) return;
    const index = filtered.value.findIndex((country) => country.code === code);
    const next = new Set(model.value);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    updateSelection(next);
    if (selectedOnly.value) {
        // Removing a filtered row must not strand keyboard focus on the body.
        await nextTick();
        const inputs = resultsList.value?.querySelectorAll<HTMLInputElement>("input");
        (inputs?.[index] ?? inputs?.[index - 1] ?? searchInput.value)?.focus();
    }
}

function selectAll() {
    updateSelection(countries.value.map((country) => country.code));
}
function clearSelection() {
    updateSelection([]);
}
function addMatches() {
    updateSelection([...model.value, ...filtered.value.map((country) => country.code)]);
}
function removeMatches() {
    const removed = new Set(filtered.value.map((country) => country.code));
    updateSelection(model.value.filter((code) => !removed.has(code)));
}
function focusFirstResult() {
    resultsList.value?.querySelector<HTMLElement>("button, input")?.focus();
}
function clearSearch() {
    search.value = "";
    searchInput.value?.focus();
}
function resetFilters() {
    selectedOnly.value = false;
    clearSearch();
}
</script>
<style scoped>
.country-chooser {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.current-country {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--gb-accent-end);
    border-radius: 8px;
    background: var(--gb-bg);
}
.current-country small,
.current-country strong {
    display: block;
}
.current-country small {
    color: var(--gb-muted);
    font-size: 0.7rem;
}
.current-country strong {
    color: var(--gb-accent);
    font-size: 0.85rem;
    overflow-wrap: anywhere;
}
.country-search-field {
    margin: 0;
}
.country-search {
    display: flex;
    gap: 0.4rem;
}
.search-clear-icon {
    display: none;
}
.country-search input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    font-size: 16px;
}
.country-tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}
.selection-count,
.results-status {
    margin: 0;
    color: var(--gb-muted);
    font-size: 0.75rem;
    line-height: 1.5;
}
.selection-count strong {
    color: var(--gb-accent);
    font-variant-numeric: tabular-nums;
}
.chooser-action {
    min-width: 44px;
    min-height: 44px;
    padding: 0.4rem 0.65rem;
    border: 1px solid var(--gb-line);
    border-radius: 6px;
    color: var(--gb-text);
    background: var(--gb-bg);
    font-size: 0.75rem;
    font-weight: 600;
}
.chooser-action:enabled:hover,
.selected-filter[aria-pressed="true"] {
    border-color: var(--gb-accent-end);
    color: var(--gb-accent);
    background: var(--gb-raised);
}
.chooser-action:disabled {
    opacity: 0.45;
    cursor: default;
}
.chooser-action:focus-visible,
.country-choice:focus-visible,
.country-choice:focus-within {
    outline: 2px solid var(--gb-accent);
    outline-offset: -2px;
}
.country-list {
    max-height: min(280px, 36dvh);
    overflow-y: auto;
    display: grid;
    gap: 0.15rem;
    overscroll-behavior: contain;
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    background: var(--gb-bg);
    scrollbar-color: var(--gb-accent-end) var(--gb-bg);
}
.country-choice {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    min-height: 44px;
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: var(--gb-text);
    text-align: left;
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1.4;
}
.country-choice:hover,
.country-choice[aria-pressed="true"],
.country-choice.is-selected {
    background: var(--gb-raised);
}
.country-choice[aria-pressed="true"] {
    box-shadow: inset 3px 0 var(--gb-accent);
}
.country-choice input {
    flex: none;
    width: 18px;
    height: 18px;
    accent-color: var(--gb-accent);
}
.country-name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
}
.country-code {
    color: var(--gb-muted);
    font-size: 0.7rem;
}
.choice-mark {
    width: 1em;
    color: var(--gb-accent);
    text-align: center;
}
.country-flag {
    width: 32px;
    height: 24px;
    flex: none;
    background-image: url("/images/flags32.webp");
    border-radius: 3px;
}
.bulk-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
}
.empty-results {
    padding: 1rem;
    color: var(--gb-muted);
    text-align: center;
    font-size: 0.8rem;
}
.empty-results p {
    margin: 0 0 0.5rem;
}
@media (max-width: 760px) {
    .country-search {
        position: relative;
        display: block;
    }
    .country-search .input[type="search"] {
        width: 100%;
        padding-right: 44px;
    }
    .country-search input::-webkit-search-cancel-button {
        -webkit-appearance: none;
        display: none;
    }
    .country-search .search-clear {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 44px;
        padding: 0;
        display: grid;
        place-items: center;
        border: 0;
        background: transparent;
        color: var(--gb-muted);
    }
    .search-clear > span {
        display: none;
    }
    .search-clear-icon {
        display: block;
    }
    .country-search .search-clear:enabled:hover {
        color: var(--gb-accent);
        background: transparent;
    }
}
</style>
