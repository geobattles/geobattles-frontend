<template>
    <div v-if="conf" class="settings-display">
        <div class="configuration-header">
            <h2><UiIcon name="globe" /> Game settings</h2>
            <div class="configuration-views" role="group" aria-label="Game configuration view">
                <button type="button" :aria-pressed="!mapPreview" @click="mapPreview = false"><UiIcon name="globe" /> Game Settings</button>
                <button type="button" :aria-pressed="mapPreview" @click="mapPreview = true"><UiIcon name="map" /> Map Preview</button>
            </div>
            <div class="configuration-tools">
                <button class="btn btn-secondary map-button" type="button" aria-label="Map &amp; rules" @click="mapOpen = true">
                    <UiIcon name="map" /> <span>Map<span class="map-suffix"> &amp; rules</span></span>
                </button>
                <slot name="edit" />
            </div>
        </div>
        <div class="configuration-summary" :class="{ 'preview-selected': mapPreview }">
            <div class="region-summary" :class="{ 'region-scenic': scenicArtwork }" :style="scenicArtwork ? { '--region-art': `url(${scenicArtwork})` } : undefined">
                <span class="region-emblem" :class="{ 'flag-emblem': selectedCodes.length === 1 }" aria-hidden="true">
                    <span v-if="selectedCodes.length === 1" class="flag" :style="{ backgroundPosition: getFlagBackgroundPosition(selectedCodes[0]!) }" />
                    <img v-else-if="overviewMode === 'world'" src="/images/emerald-world.webp" alt="" width="160" height="160" />
                    <UiIcon v-else :name="scenicArtwork ? 'map' : 'globe'" />
                </span>
                <div class="region-copy">
                    <strong :title="selectedRegion">{{ selectedRegion }}</strong>
                    <p v-if="overviewMode === 'world'" class="region-tagline">Explore any location on Earth.</p>
                    <p>{{ conf.mode === 1 ? "Battle Royale" : "Country Battle (unfinished)" }}</p>
                </div>
            </div>
            <dl class="settings-summary">
                <div>
                    <dt><UiIcon name="clock" /> Round time</dt>
                    <dd>{{ conf.roundTime }} <small>s</small></dd>
                </div>
                <div>
                    <dt><UiIcon name="compass" /> Rounds</dt>
                    <dd>{{ conf.numRounds }}</dd>
                </div>
                <div>
                    <dt><UiIcon name="pin" /> Guesses <span class="per-round">/ round</span></dt>
                    <dd>{{ conf.numAttempt }}</dd>
                </div>
            </dl>
        </div>
        <div v-if="mapPreview" class="configuration-map">
            <RegionMap v-if="catalog && !mapOpen" class="compact-map" :catalog="catalog" :selected-codes="selectedCodes" :mode="overviewMode" readonly />
            <p v-else-if="!catalog" class="field-help">Map preview is unavailable.</p>
            <button class="btn btn-secondary" type="button" @click="mapOpen = true">Map and rules</button>
        </div>
        <UiDialog v-model:open="mapOpen" title="Map and rules" wide class="lobby-map-dialog">
            <template v-if="mapOpen">
                <RegionMap v-if="catalog" class="region-overview" :catalog="catalog" :selected-codes="selectedCodes" :mode="overviewMode" readonly />
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
                    <p class="field-help">
                        Each enabled powerup is available once per game, between rounds for the next round. One-round games have no activation window. Double Score doubles base
                        points only; Duel transfers 1,000 points, with no opponent response needed.
                    </p>
                </details>
            </template>
        </UiDialog>
    </div>
    <p v-else class="muted">Waiting for the server’s lobby settings.</p>
</template>
<script setup lang="ts">
import RegionMap from "./Settings/RegionMap.vue";
import { regionLabel, sameCountries } from "~/utils/regionScoring";
import type { RegionPickerMode } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";
import { continentArtwork } from "~/utils/regionArtwork";
const mapOpen = ref(false);
const mapPreview = ref(false);
const lobby = useLobbyStore();
const conf = computed(() => lobby.lobbySettings?.conf);
const countries = useCountryList();
const catalog = useCountryCatalog();
const flags = useCountriesFlagMap();
const { getFlagBackgroundPosition } = useCountryActions();
const { fetchCountryCatalog } = useRegionActions();
const selectedCodes = computed(() => [...new Set(conf.value?.ccList.length ? conf.value.ccList : (catalog.value?.countries.map((country) => country.code) ?? countries.value))]);
const scenicArtwork = computed(() => {
    if (overviewMode.value !== "custom") return undefined;
    const continent = catalog.value?.continents.find((region) => sameCountries(selectedCodes.value, region.codes));
    return continent ? continentArtwork[continent.id] : undefined;
});
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
    min-width: 0;
    container-type: inline-size;
}
.configuration-header,
.configuration-tools {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
}
.configuration-header {
    justify-content: space-between;
    margin-bottom: 0.7rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid #a3f66b4d;
}
.configuration-header h2 {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 1.03rem;
}
.configuration-views {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    min-width: 0;
}
.configuration-views button {
    display: inline-flex;
    min-height: 44px;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding-inline: 0.4rem;
    border: 0;
    border-bottom: 2px solid transparent;
    color: #d6eee5;
    background: transparent;
    font-size: 0.8rem;
    white-space: nowrap;
}
.configuration-views button[aria-pressed="true"] {
    border-bottom-color: #cbff9a;
    color: #f8fafc;
    font-weight: 800;
}
.configuration-views svg {
    color: #92e4c4;
}
.configuration-map :deep(.map-stage) {
    height: clamp(100px, 23dvh, 180px);
}
.configuration-map > button {
    margin-top: 0.35rem;
}
.configuration-header h2,
.configuration-tools .map-button,
.configuration-summary.preview-selected {
    display: none;
}
.configuration-header h2 svg,
.settings-summary dt svg {
    color: #b8f695;
}
.configuration-tools .btn {
    min-height: 44px;
}
.region-summary {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 0.75rem;
    margin-bottom: 0.6rem;
    padding: 0.65rem;
    border: 1px solid #7bd3a766;
    border-radius: 10px;
    background:
        linear-gradient(95deg, #05352ee8 30%, #124c3cb3 78%, #295e4994),
        var(--lobby-image) 70% 52% / cover;
}
.region-summary.region-scenic {
    background:
        linear-gradient(90deg, #042a27 8%, #06352ee8 34%, #062d2950 78%, #041d1d38),
        var(--region-art) right 47% / cover;
}
.region-emblem {
    display: grid;
    width: clamp(2.1rem, 5vw, 3.6rem);
    aspect-ratio: 1;
    flex: none;
    place-items: center;
    border: 1px solid #a2f0c89e;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #348f68, #052e28 75%);
}
.region-emblem svg {
    width: 68%;
    height: 68%;
    color: #d3ffc0;
}
.region-emblem:has(img) {
    border: 0;
    background: transparent;
}
.region-emblem img {
    display: block;
    width: 118%;
    max-width: none;
    height: auto;
}
.flag-emblem {
    border: 1px solid #b5efd08c;
    background: linear-gradient(145deg, #3b8b69, #103f39 62%, #052723);
    box-shadow:
        inset 0 1px #e0ffe64d,
        0 3px 9px #031d1c88;
}
.flag-emblem .flag {
    border-radius: 5px;
    box-shadow:
        0 0 0 1px #e6fff766,
        0 3px 6px #001f1eaa,
        inset 0 1px #ffffff66;
}
.region-copy {
    min-width: 0;
}
.region-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: clamp(1rem, 2vw, 1.38rem);
    text-overflow: ellipsis;
    white-space: nowrap;
}
.region-copy p {
    color: #d1efe2;
    font-size: 0.75rem;
}
.region-copy .region-tagline {
    color: #f0fbf6;
}
.settings-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
    margin: 0;
}
.settings-summary > div {
    min-width: 0;
    padding: 0.5rem 0.55rem;
    border-radius: 7px;
    background: #022322;
}
.settings-summary dt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.15rem 0.3rem;
    color: #d1efe2;
    font-size: 0.71rem;
    line-height: 1.25;
}
.settings-summary dd {
    margin: 0.15rem 0 0;
    color: #f8fafc;
    font: 700 1.1rem/1.2 var(--gb-font-mono);
}
.settings-summary dd small {
    font-size: 0.7em;
}
.region-overview {
    margin-bottom: 0.55rem;
}
.settings-disclosure {
    border-top: 1px solid var(--gb-line);
}
.settings-disclosure > summary {
    min-height: 44px;
    padding-block: 0.65rem;
    color: var(--gb-accent);
    cursor: pointer;
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
    color: var(--gb-success);
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

@media (max-width: 760px), (orientation: landscape) and (max-height: 540px) {
    .configuration-header h2,
    .configuration-tools .map-button {
        display: inline-flex;
    }
    .configuration-views,
    .configuration-map,
    .region-copy .region-tagline {
        display: none;
    }
    .configuration-summary.preview-selected {
        display: block;
    }
    .configuration-header {
        margin-bottom: 0.35rem;
        padding-bottom: 0;
    }
    .configuration-header h2 {
        font-size: 0.87rem;
    }
    .configuration-header h2 svg,
    .per-round {
        display: none;
    }
    .region-summary {
        gap: 0.4rem;
        margin-bottom: 0.35rem;
        padding: 0.25rem 0.45rem;
    }
    .region-emblem {
        width: 1.8rem;
    }
    .region-emblem .flag {
        transform: scale(0.7);
    }
    .region-copy p {
        font-size: 0.68rem;
    }
    .settings-summary > div {
        padding: 0.25rem 0.35rem;
    }
    .settings-summary dd {
        margin-top: 0.05rem;
        font-size: 0.96rem;
    }
}
@container (max-width: 290px) {
    .settings-summary dt svg {
        display: none;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .map-suffix {
        display: none;
    }
}
</style>
