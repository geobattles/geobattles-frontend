<template>
    <div>
        <div class="field">
            <label for="country-search">Find a country</label
            ><input id="country-search" v-model="search" type="search" class="input" placeholder="Search by name or code" autocomplete="off" />
        </div>
        <div class="country-tools">
            <p class="field-help" role="status">{{ model.length }} of {{ countries.length }} selected</p>
            <div class="btn-row">
                <button class="btn btn-quiet" type="button" @click="model = [...countries]">Select all</button
                ><button class="btn btn-quiet" type="button" @click="model = []">Clear</button>
            </div>
        </div>
        <div v-if="filtered.length" class="country-list" role="group" aria-label="Available countries" tabindex="0">
            <label v-for="code in filtered" :key="code" class="country-choice"
                ><input type="checkbox" :value="code" v-model="model" /><span
                    class="country-flag"
                    :style="{ backgroundPosition: getFlagBackgroundPosition(code) }"
                    aria-hidden="true"
                /><span>{{ flags.get(code)?.name || code }}</span></label
            >
        </div>
        <p v-else class="notice">{{ countries.length ? "No countries match your search." : "The country list is not available yet." }}</p>
        <p v-if="!model.length" class="field-error mt-3">Choose at least one country.</p>
    </div>
</template>
<script setup lang="ts">
const model = defineModel<string[]>({ required: true });
const countries = useCountryList();
const flags = useCountriesFlagMap();
const { getFlagBackgroundPosition } = useCountryActions();
const search = ref("");
const filtered = computed(() => {
    const query = search.value.trim().toLocaleLowerCase();
    return countries.value.filter((code) => !query || `${code} ${flags.value.get(code)?.name || ""}`.toLocaleLowerCase().includes(query));
});
</script>
<style scoped>
.country-tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-block: 0.35rem;
}
.country-list {
    max-height: min(400px, 45dvh);
    overflow-y: auto;
    display: grid;
    gap: 0.15rem;
    overscroll-behavior: contain;
}
.country-choice {
    display: flex;
    gap: 0.7rem;
    align-items: center;
    min-height: 44px;
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
}
.country-choice:hover,
.country-choice:focus-within,
.country-choice:has(input:checked) {
    background: var(--gb-raised);
}
.country-flag {
    width: 32px;
    height: 24px;
    flex: none;
    background-image: url("/images/flags32.webp");
    border-radius: 3px;
}
</style>
