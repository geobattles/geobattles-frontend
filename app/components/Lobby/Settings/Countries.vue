<template>
    <fieldset class="country-chooser" :disabled="disabled">
        <legend class="sr-only">{{ single ? "Choose one country" : "Choose custom countries" }}</legend>
        <div class="country-toolbar">
            <label class="country-search" data-viewport-field>
                <span class="sr-only">{{ single ? "Choose a country" : "Find countries" }}</span>
                <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="10.5" cy="10.5" r="5.75" />
                    <path d="m15 15 5 5" stroke-linecap="round" />
                </svg>
                <input
                    ref="searchInput"
                    :value="search"
                    type="search"
                    class="input"
                    placeholder="Search countries"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    enterkeyhint="search"
                    :aria-controls="id + '-results'"
                    :aria-describedby="id + '-results-status'"
                    @input="search = ($event.target as HTMLInputElement).value"
                    @keydown.enter.prevent="finishSearch"
                    @keydown.down.prevent="focusFirstResult"
                />
            </label>
            <button v-if="search" type="button" class="picker-tool search-clear" aria-label="Clear country search" @click="clearSearch">
                <UiIcon name="close" />
            </button>
            <CountryFilters v-model:selected-only="selectedOnly" v-model:sort-by="sortBy" :single="single" :disabled="disabled" :has-region="!!continent" @opening="finishSearch">
                <label v-if="regions.length" class="filter-region">
                    <span>Region</span>
                    <select v-model="continent" class="input" aria-label="Region">
                        <option value="">All regions</option>
                        <option v-for="region in regions" :key="region.id" :value="region.id">{{ region.name }}</option>
                    </select>
                </label>
                <button
                    v-if="!single && (search.trim() || continent) && !selectedOnly"
                    class="picker-tool"
                    type="button"
                    :disabled="!selectedMatches.length"
                    @click="removeMatches"
                >
                    Remove {{ selectedMatches.length }} shown
                </button>
            </CountryFilters>
            <slot name="actions" />
        </div>

        <div v-if="regions.length" class="country-regions" role="group" aria-label="Filter by continent">
            <button type="button" :aria-pressed="!continent" @click="continent = ''">All regions</button>
            <button v-for="region in regions" :key="region.id" type="button" :aria-pressed="continent === region.id" @click="continent = region.id">
                {{ region.name }}
            </button>
        </div>

        <p :id="id + '-results-status'" class="sr-only" role="status">{{ filtered.length }} {{ filtered.length === 1 ? "country" : "countries" }} shown</p>
        <div
            :id="id + '-results'"
            ref="resultsList"
            class="country-list"
            :role="single ? 'radiogroup' : 'group'"
            :aria-label="single ? 'Country search results' : 'Custom country search results'"
        >
            <label v-for="country in filtered" :key="country.code" class="country-choice" :class="{ 'is-selected': isSelected(country.code) }">
                <input
                    :type="single ? 'radio' : 'checkbox'"
                    :name="id + '-country'"
                    :value="country.code"
                    :checked="isSelected(country.code)"
                    @change="choose(country.code)"
                    @keydown.enter.prevent="single && choose(country.code)"
                />
                <span v-if="country.flag" class="country-flag" :style="country.flag" aria-hidden="true" />
                <span v-else class="country-flag flag-fallback" aria-hidden="true"><UiIcon name="globe" /></span>
                <span class="country-name">{{ country.name }}</span>
                <span class="country-code">{{ country.code }}</span>
                <span class="choice-mark" aria-hidden="true"><UiIcon v-if="isSelected(country.code)" name="check" /></span>
            </label>
            <div v-if="!filtered.length" class="empty-results">
                <p>{{ selectedOnly && !selectedCount ? "No countries selected yet." : "No countries match these filters." }}</p>
                <button v-if="search || selectedOnly || continent" type="button" class="picker-tool" @click="resetFilters">Show all countries</button>
            </div>
        </div>

        <div v-if="!single" class="country-footer">
            <span class="selected-count" role="status">
                <template v-if="selectedCount"
                    ><strong>{{ selectedCount }}</strong> selected</template
                >
                <template v-else>Choose at least one country</template>
            </span>
            <div class="bulk-actions" role="group" aria-label="Bulk country selection">
                <button type="button" class="picker-tool select-shown" :disabled="!canSelectShown" @click="selectShown">
                    {{ filtered.length === countries.length ? "Select all " + filtered.length : "Select " + filtered.length + " shown" }}
                </button>
                <button
                    type="button"
                    class="picker-tool clear-selection"
                    aria-label="Clear selection"
                    title="Clear all selected countries"
                    :disabled="!selectedCount"
                    @click="updateSelection([])"
                >
                    Clear
                </button>
            </div>
        </div>
    </fieldset>
</template>

<script setup lang="ts">
import type { CountryCatalog } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";
import CountryFilters from "./CountryFilters.vue";

const props = withDefaults(defineProps<{ catalog: CountryCatalog; single?: boolean; disabled?: boolean }>(), { single: false, disabled: false });
const model = defineModel<string[]>({ required: true });
const id = useId();
const flags = useCountriesFlagMap();
const search = ref("");
const selectedOnly = ref(false);
const continent = ref("");
const sortBy = ref<"name" | "code">("name");
const searchInput = useTemplateRef("searchInput");
const resultsList = useTemplateRef("resultsList");
const regions = computed(() => props.catalog.continents.filter((region) => region.codes.length));

function normalize(value: string) {
    return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

const countries = computed(() =>
    props.catalog.countries
        .map((country) => {
            const name = countryDisplayName(country.code, country.name);
            const sprite = flags.value.get(country.code);
            return {
                ...country,
                name,
                searchText: normalize([name, country.name, country.code].join(" ")),
                flag: sprite ? { backgroundPosition: [sprite.x + "px", sprite.y + "px"].join(" ") } : undefined,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "en") || a.code.localeCompare(b.code))
);
const selected = computed(() => new Set(model.value));
const selectedCount = computed(() => countries.value.filter((country) => selected.value.has(country.code)).length);
const current = computed(() => (selected.value.size === 1 ? countries.value.find((country) => selected.value.has(country.code))?.code : undefined));
const filtered = computed(() => {
    const query = normalize(search.value);
    const results = countries.value.filter(
        (country) =>
            (!continent.value || country.continent === continent.value) &&
            (props.single || !selectedOnly.value || selected.value.has(country.code)) &&
            country.searchText.includes(query)
    );
    if (sortBy.value === "code") return results.sort((a, b) => a.code.localeCompare(b.code));
    const exactCode = query.length === 2 ? results.findIndex((country) => country.code.toLowerCase() === query) : -1;
    if (exactCode > 0) results.unshift(...results.splice(exactCode, 1));
    return results;
});
const selectedMatches = computed(() => filtered.value.filter((country) => selected.value.has(country.code)));
const canSelectShown = computed(() => filtered.value.length > selectedMatches.value.length);

function isSelected(code: string) {
    return props.single ? current.value === code : selected.value.has(code);
}

watch(
    [current, searchInput],
    () => {
        searchInput.value?.setCustomValidity(props.single && !current.value ? "Choose one country from the results or map." : "");
    },
    { immediate: true, flush: "post" }
);
watch([search, continent, selectedOnly, sortBy], () => {
    if (resultsList.value) resultsList.value.scrollTop = 0;
});
watch(
    [resultsList, current],
    () => {
        if (!props.single || !current.value || search.value || continent.value) return;
        const list = resultsList.value;
        const row = list?.querySelector("label.is-selected");
        if (!list || !row) return;
        const bounds = list.getBoundingClientRect();
        const choice = row.getBoundingClientRect();
        if (choice.top < bounds.top) list.scrollTop -= bounds.top - choice.top;
        else if (choice.bottom > bounds.bottom) list.scrollTop += choice.bottom - bounds.bottom;
    },
    { flush: "post" }
);

function updateSelection(codes: Iterable<string>) {
    if (props.disabled) return;
    const next = new Set(codes);
    model.value = countries.value.filter((country) => next.has(country.code)).map((country) => country.code);
}

async function choose(code: string) {
    if (props.disabled) return;
    if (props.single) {
        if (current.value !== code) updateSelection([code]);
        return;
    }
    const index = filtered.value.findIndex((country) => country.code === code);
    const next = new Set(selected.value);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    updateSelection(next);
    if (selectedOnly.value) {
        await nextTick();
        const inputs = resultsList.value?.querySelectorAll<HTMLInputElement>("input");
        (inputs?.[index] ?? inputs?.[index - 1] ?? resultsList.value?.querySelector("button"))?.focus();
    }
}

function selectShown() {
    updateSelection([...model.value, ...filtered.value.map((country) => country.code)]);
}

function removeMatches() {
    const shown = new Set(filtered.value.map((country) => country.code));
    updateSelection(model.value.filter((code) => !shown.has(code)));
}

function focusFirstResult() {
    resultsList.value?.querySelector<HTMLElement>("input, button")?.focus();
}

function finishSearch() {
    searchInput.value?.blur();
}

function clearSearch() {
    search.value = "";
    searchInput.value?.focus();
}

function resetFilters() {
    selectedOnly.value = false;
    continent.value = "";
    clearSearch();
}
</script>

<style scoped>
.country-chooser {
    --picker-line: #9be0a538;
    display: flex;
    flex-direction: column;
    gap: 0.32rem;
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    container-type: inline-size;
}
.country-toolbar {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.28rem;
}
.country-search {
    position: relative;
    display: block;
    min-width: 0;
    grid-column: 1;
    grid-row: 1;
}
.country-search .input {
    width: 100%;
    height: 34px;
    min-height: 34px;
    padding: 0.18rem 1.95rem 0.18rem 1.85rem;
    border: 1px solid var(--picker-line);
    border-radius: 999px;
    background: #051e1c;
    color: #eefbf4;
    font-size: 0.8rem;
}
.country-search .input:focus {
    border-color: #b7f98699;
    outline: 2px solid #9be7c43a;
    outline-offset: -2px;
}
.country-search input::-webkit-search-cancel-button {
    display: none;
}
.search-icon {
    position: absolute;
    top: 50%;
    left: 0.62rem;
    width: 15px;
    height: 15px;
    transform: translateY(-50%);
    color: #9dd4be;
    pointer-events: none;
}
.country-chooser .search-clear {
    grid-column: 1;
    grid-row: 1;
    justify-self: end;
    z-index: 1;
    min-width: 30px;
    min-height: 30px;
    width: 30px;
    height: 30px;
    margin-inline-end: 0.15rem;
    padding: 0;
    border-color: transparent;
    border-radius: 50%;
    background: transparent;
}
.picker-tool,
.country-regions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    min-width: 34px;
    min-height: 34px;
    padding: 0.16rem 0.58rem;
    border: 1px solid var(--picker-line);
    border-radius: 999px;
    background: #10372e;
    color: #e9faf4;
    font-weight: 740;
    font-size: 0.72rem;
    white-space: nowrap;
}
.picker-tool:enabled:hover,
.country-regions button:enabled:hover {
    border-color: #bee8a382;
    background: #1f4f3d;
}
.picker-tool:disabled {
    opacity: 0.45;
}
.country-regions {
    display: flex;
    flex: none;
    gap: 0.26rem;
    min-width: 0;
    overflow-x: auto;
    padding: 1px 1px 0.12rem;
    overscroll-behavior-inline: contain;
    scrollbar-width: thin;
}
.country-regions button {
    flex: none;
    min-width: 0;
    min-height: 28px;
    padding: 0.12rem 0.56rem;
    border-radius: 999px;
    background: #092923;
    font-size: 0.69rem;
    white-space: nowrap;
}
.country-regions button[aria-pressed="true"] {
    border-color: #bcea9485;
    background: #214c37;
    color: #dcffb5;
}
.filter-region {
    display: none;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.5rem;
    padding-inline-start: 0.15rem;
    color: #c7ddd5;
    font-size: 0.74rem;
}
.filter-region select {
    width: 100%;
    height: 34px;
    min-height: 34px;
    padding: 0.15rem 0.45rem;
    border-radius: 0.55rem;
    font-size: 0.78rem;
}
.country-list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    flex: 1 1 0;
    gap: 0.22rem;
    min-height: 0;
    min-width: 0;
    padding: 0.26rem;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    container: country-results / inline-size;
    scrollbar-color: #75a995 #082421;
    border: 1px solid var(--picker-line);
    border-radius: 0.78rem;
    background: #041e1cbb;
}
.country-choice {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.42rem;
    min-height: 32px;
    padding: 0.2rem 0.46rem;
    border: 1px solid #b2e4d016;
    border-radius: 0.54rem;
    background: #0d3029a8;
    color: #effcf7;
    cursor: pointer;
    line-height: 1.15;
}
.country-choice:hover {
    background: #174437;
}
.country-choice.is-selected {
    border-color: #aade8980;
    background: linear-gradient(115deg, #24523dd8, #11382ed8);
}
.country-choice:has(input:focus-visible),
.country-regions button:focus-visible,
.picker-tool:focus-visible {
    outline: 2px solid #d6ff99;
    outline-offset: -2px;
}
.country-choice input {
    position: absolute;
    inset-inline-end: 0.45rem;
    top: 50%;
    margin: 0;
    transform: translateY(-50%);
    opacity: 0;
}
.country-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.76rem;
    font-weight: 680;
}
.country-code {
    padding: 0.1rem 0.28rem;
    border-radius: 999px;
    background: #08221f;
    color: #b4d4cb;
    font: 600 0.62rem/1.1 var(--gb-font-mono);
}
.choice-mark {
    display: grid;
    place-items: center;
    width: 17px;
    height: 17px;
    border: 1px solid #9cc8ba9c;
    border-radius: 5px;
    pointer-events: none;
}
.country-choice:has(input[type="radio"]) .choice-mark {
    border-radius: 50%;
}
.is-selected .choice-mark {
    border-color: #c5f295;
    background: #c5f295;
    color: #103724;
}
.choice-mark .ui-icon {
    width: 0.78rem;
    height: 0.78rem;
    animation: check-in 150ms ease-out;
}
@keyframes check-in {
    from {
        opacity: 0.25;
        transform: scale(0.7);
    }
}
.country-flag {
    display: grid;
    width: 32px;
    height: 24px;
    margin: -3.75px -5px;
    border-radius: 4px;
    transform: scale(0.6875);
    transform-origin: center;
    background-image: url("/images/flags32.webp");
    box-shadow:
        0 1px 3px #0006,
        inset 0 0 0 1px #fff2;
}
.flag-fallback {
    place-items: center;
    background: #204e41;
    color: #b5decd;
}
.flag-fallback .ui-icon {
    width: 1rem;
}
.country-footer {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
    min-width: 0;
    padding: 0.24rem 0.42rem;
    border: 1px solid var(--picker-line);
    border-radius: 0.72rem;
    background: #07241fe0;
}
.selected-count {
    flex: 1;
    padding-inline-start: 0.16rem;
    color: #c8e3d8;
    font-size: 0.71rem;
    line-height: 1.2;
    white-space: nowrap;
}
.selected-count strong {
    color: #d6ff9d;
    font-size: 0.84rem;
    font-variant-numeric: tabular-nums;
}
.bulk-actions {
    display: flex;
    gap: 0.26rem;
    flex: none;
}
.bulk-actions .picker-tool {
    min-height: 28px;
    min-width: 0;
    padding: 0.12rem 0.56rem;
    font-size: 0.69rem;
}
.select-shown {
    color: #d8ffc0;
}
.clear-selection {
    background: #0c2b27;
}
.empty-results {
    grid-column: 1 / -1;
    align-content: center;
    padding: 0.5rem;
    color: #c4d9d1;
    text-align: center;
    font-size: 0.76rem;
}
.empty-results p {
    margin: 0 0 0.4rem;
}
@container country-results (min-width: 420px) {
    .country-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@container country-results (max-width: 235px) {
    .country-choice {
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 0.36rem;
    }
    .country-code {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .country-choice,
    .picker-tool,
    .country-regions button {
        transition:
            background-color 140ms,
            border-color 140ms,
            color 140ms;
    }
}
@media (orientation: landscape) and (max-height: 440px) {
    .country-regions {
        display: none;
    }
    .filter-region {
        display: grid;
    }
}
.settings-searching .country-regions,
.settings-searching .country-footer {
    display: none;
}
.settings-searching .filter-region {
    display: grid;
}
@container (max-width: 340px) {
    .country-footer {
        padding: 0.2rem 0.3rem;
    }
    .bulk-actions .picker-tool {
        padding-inline: 0.42rem;
        font-size: 0.66rem;
    }
}
</style>
