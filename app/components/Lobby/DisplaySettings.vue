<template>
    <div v-if="conf" class="settings-display">
        <div class="region-summary">
            <div class="region-title">
                <span v-if="selectedCodes.length === 1" class="flag" :style="{ backgroundPosition: getFlagBackgroundPosition(selectedCodes[0]!) }" aria-hidden="true" /><strong>{{
                    selectedRegion
                }}</strong>
            </div>
            <p>
                {{ conf.mode === 1 ? "Battle Royale" : "Country Battle (unfinished)" }}
            </p>
        </div>
        <RegionMap v-if="catalog" class="region-overview" :catalog="catalog" :selected-codes="selectedCodes" :mode="overviewMode" readonly />

        <dl class="settings-summary">
            <div>
                <dt>Round time</dt>
                <dd>{{ conf.roundTime }} <small>sec</small></dd>
            </div>
            <div>
                <dt>Rounds</dt>
                <dd>{{ conf.numRounds }}</dd>
            </div>
            <div>
                <dt>Guesses / round</dt>
                <dd>{{ conf.numAttempt }}</dd>
            </div>
        </dl>
        <details v-if="selectedCodes.length > 1" class="settings-disclosure">
            <summary>
                Included countries <span>{{ selectedCodes.length }}</span>
            </summary>
            <div class="country-preview" tabindex="0" role="region" aria-label="Selected countries">
                <span v-for="code in selectedCodes" :key="code" class="country-chip"
                    ><span class="flag" :style="{ backgroundPosition: getFlagBackgroundPosition(code) }" aria-hidden="true" />{{
                        countryDisplayName(code, flags.get(code)?.name)
                    }}</span
                >
            </div>
        </details>
        <details class="settings-disclosure">
            <summary>Advanced rules</summary>
            <dl class="rule-list">
                <div>
                    <dt>Max players</dt>
                    <dd>{{ conf.maxPlayers }}</dd>
                </div>
                <div v-if="conf.mode === 1">
                    <dt>Scoring</dt>
                    <dd>{{ conf.scoringMode === "auto" ? "Region-adaptive" : `Manual · ${conf.scoreFactor}` }}</dd>
                </div>
                <div>
                    <dt>Dynamic lives</dt>
                    <dd class="rule-state" :class="{ 'rule-on': conf.dynLives }">{{ conf.dynLives ? "On" : "Off" }}</dd>
                </div>
                <div>
                    <dt>Placement bonus</dt>
                    <dd class="rule-state" :class="{ 'rule-on': conf.placeBonus }">{{ conf.placeBonus ? "On" : "Off" }}</dd>
                </div>
                <div>
                    <dt>Double score</dt>
                    <dd class="rule-state" :class="{ 'rule-on': conf.powerups?.[0] }">{{ conf.powerups?.[0] ? "On" : "Off" }}</dd>
                </div>
                <div>
                    <dt>Duel</dt>
                    <dd class="rule-state" :class="{ 'rule-on': conf.powerups?.[1] }">{{ conf.powerups?.[1] ? "On" : "Off" }}</dd>
                </div>
            </dl>
        </details>
    </div>
    <p v-else class="muted">Waiting for the server’s lobby settings.</p>
</template>
<script setup lang="ts">
import RegionMap from "./Settings/RegionMap.vue";
import { regionLabel, sameCountries } from "~/utils/regionScoring";
import type { RegionPickerMode } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";
const lobby = useLobbyStore();
const conf = computed(() => lobby.lobbySettings?.conf);
const countries = useCountryList();
const catalog = useCountryCatalog();
const flags = useCountriesFlagMap();
const { getFlagBackgroundPosition } = useCountryActions();
const { fetchCountryCatalog } = useRegionActions();
const selectedCodes = computed(() => [...new Set(conf.value?.ccList.length ? conf.value.ccList : (catalog.value?.countries.map((country) => country.code) ?? countries.value))]);
const overviewMode = computed<RegionPickerMode>(() => {
    if (
        !conf.value?.ccList.length ||
        (catalog.value &&
            sameCountries(
                selectedCodes.value,
                catalog.value.countries.map((country) => country.code)
            ))
    )
        return "world";
    return selectedCodes.value.length === 1 ? "country" : "custom";
});
const selectedRegion = computed(() => {
    const codes = conf.value?.ccList ?? [];
    if (codes.length === 1) return countryDisplayName(codes[0]!, flags.value.get(codes[0]!)?.name);
    return regionLabel(codes, catalog.value);
});
onMounted(() => {
    void fetchCountryCatalog().catch(() => {
        /* Existing settings remain readable while the catalog is unavailable. */
    });
});
</script>
<style scoped>
.settings-display {
    container-type: inline-size;
}
.region-summary {
    display: grid;
    gap: 0.25rem;
    margin-bottom: 0.85rem;
}
.region-summary strong {
    font-size: 1.15rem;
    line-height: 1.3;
    color: var(--gb-accent);
    overflow-wrap: anywhere;
}
.region-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}
.region-overview {
    margin-bottom: 0.6rem;
}

.region-summary p {
    font-size: 0.72rem;
    color: var(--gb-muted);
}
.settings-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.65rem;
    margin: 0 0 0.75rem;
}
.settings-summary > div {
    padding: 0.65rem;
    background: #18181880;
    border: 1px solid var(--gb-line);
    border-radius: 8px;
}
.settings-summary dt,
.rule-list dt {
    font-size: 0.72rem;
    color: var(--gb-muted);
}
.settings-summary dd {
    font: 700 1rem / 1.5 var(--gb-font-mono);
    margin: 0.15rem 0 0;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}
.settings-summary small {
    font: 400 0.7rem var(--gb-font-display);
    color: var(--gb-muted);
}
.settings-disclosure {
    border-top: 1px solid var(--gb-line);
}
.settings-disclosure > summary {
    min-height: 44px;
    padding-block: 0.75rem;
    font-size: 0.75rem;
    color: var(--gb-muted);
    cursor: pointer;
}
.settings-disclosure > summary > span {
    color: var(--gb-accent);
    margin-left: 0.3rem;
}
.rule-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem 0.75rem;
    margin: 0;
    padding-bottom: 0.75rem;
}
.rule-list > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
}
.rule-list dd {
    margin: 0;
    font-size: 0.72rem;
}
.rule-state {
    color: var(--gb-muted);
}
.rule-on {
    color: var(--gb-accent);
}
.country-preview {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    max-height: 160px;
    overflow: auto;
    padding: 0.25rem 0.2rem 0.6rem;
}
.country-chip {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
    border: 1px solid var(--gb-line);
    border-radius: 3px;
    background: var(--gb-bg);
}
.flag {
    width: 32px;
    height: 24px;
    display: inline-block;
    background-image: url("/images/flags32.webp");
    flex: none;
}
@container (max-width: 360px) {
    .rule-list {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
