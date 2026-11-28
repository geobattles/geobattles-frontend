<template>
    <div v-if="conf && compact" class="settings-compact">
        <div class="compact-settings-head">
            <span class="compact-region">
                <span class="compact-emblem" :class="{ 'flag-emblem': selectedCodes.length === 1 }" aria-hidden="true">
                    <span v-if="selectedCodes.length === 1" class="flag" :style="{ backgroundPosition: getFlagBackgroundPosition(selectedCodes[0]!) }" />
                    <img v-else-if="overviewMode === 'world'" src="/images/emerald-world.webp" alt="" width="48" height="48" />
                    <UiIcon v-else name="globe" />
                </span>
                <span class="compact-region-text">
                    <strong :title="selectedRegion">{{ selectedRegion }}</strong>
                    <span class="compact-meta">{{ conf.mode === 1 ? "Battle Royale" : "Country Battle" }}</span>
                </span>
            </span>
            <div class="compact-settings-tools">
                <button class="compact-tool-btn" type="button" aria-label="Map and rules" title="Map and rules" @click="mapOpen = true">
                    <UiIcon name="map" /><span class="compact-tool-label">Rules</span>
                </button>
                <slot name="edit" />
            </div>
        </div>
        <div v-if="catalog && !mapOpen" class="compact-map-preview" aria-hidden="true">
            <RegionMap class="compact-region-map" :catalog="catalog" :selected-codes="selectedCodes" :mode="overviewMode" readonly />
        </div>
        <dl class="compact-stats" aria-label="Next match settings">
            <div>
                <dt><UiIcon name="compass" />Rounds</dt>
                <dd>{{ conf.numRounds }}</dd>
            </div>
            <div>
                <dt><UiIcon name="clock" />Time</dt>
                <dd>{{ conf.roundTime }}<small>s</small></dd>
            </div>
            <div>
                <dt><UiIcon name="pin" />Guesses</dt>
                <dd>{{ conf.numAttempt }}</dd>
            </div>
        </dl>
        <div v-if="activeRules.length" class="compact-rules" aria-label="Active game rules">
            <span v-for="rule in activeRules" :key="rule" class="compact-rule-chip">{{ rule }}</span>
        </div>
    </div>
    <div v-else-if="conf" class="settings-display">
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
            <div v-if="catalog && !mapOpen" class="display-landscape-map" aria-hidden="true">
                <RegionMap class="compact-region-map" :catalog="catalog" :selected-codes="selectedCodes" :mode="overviewMode" readonly />
            </div>
            <dl class="settings-summary">
                <div>
                    <dt><UiIcon name="clock" /> Round time</dt>
                    <dd>{{ conf.roundTime }}<small>s</small></dd>
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
            <div v-if="activeRules.length" class="display-mobile-rules" aria-label="Active game rules">
                <span v-for="rule in activeRules" :key="rule" class="compact-rule-chip">{{ rule }}</span>
            </div>
        </div>
        <div v-if="mapPreview" class="configuration-map">
            <RegionMap v-if="catalog && !mapOpen" class="compact-map" :catalog="catalog" :selected-codes="selectedCodes" :mode="overviewMode" readonly />
            <p v-else-if="!catalog" class="field-help">Map preview is unavailable.</p>
            <button class="btn btn-secondary" type="button" @click="mapOpen = true">Map and rules</button>
        </div>
    </div>
    <p v-else class="muted">Waiting for the server’s lobby settings.</p>

    <UiDialog
        v-if="conf"
        v-model:open="mapOpen"
        title="Map & Rules"
        :eyebrow="`${selectedRegion} · ${conf.mode === 1 ? 'Battle Royale' : 'Country Battle'}`"
        class="lobby-map-dialog"
    >
        <div v-if="mapOpen" class="rules-dialog-body">
            <div class="rules-map-col">
                <RegionMap v-if="catalog" class="region-overview" :catalog="catalog" :selected-codes="selectedCodes" :mode="overviewMode" readonly />
                <dl class="rules-quick-stats" aria-label="Match setup">
                    <div>
                        <dt><UiIcon name="compass" />Rounds</dt>
                        <dd>{{ conf.numRounds }}</dd>
                    </div>
                    <div>
                        <dt><UiIcon name="clock" />Time</dt>
                        <dd>{{ conf.roundTime }}<small>s</small></dd>
                    </div>
                    <div>
                        <dt><UiIcon name="pin" />Guesses</dt>
                        <dd>{{ conf.numAttempt }}</dd>
                    </div>
                </dl>
            </div>

            <div class="rules-details-col">
                <dl class="rule-grid" aria-label="Game rules">
                    <div>
                        <dt>Max players</dt>
                        <dd class="rule-value">{{ conf.maxPlayers }}</dd>
                    </div>
                    <div v-if="conf.mode === 1">
                        <dt>Scoring</dt>
                        <dd class="rule-value">{{ conf.scoringMode === "auto" ? "Adaptive" : `Manual · ${conf.scoreFactor}` }}</dd>
                    </div>
                    <div>
                        <dt>Dynamic lives</dt>
                        <dd>
                            <span class="rule-pill" :class="{ 'is-on': conf.dynLives }">{{ conf.dynLives ? "On" : "Off" }}</span>
                        </dd>
                    </div>
                    <div>
                        <dt>Placement bonus</dt>
                        <dd>
                            <span class="rule-pill" :class="{ 'is-on': conf.placeBonus }">{{ conf.placeBonus ? "On" : "Off" }}</span>
                        </dd>
                    </div>
                    <div>
                        <dt>Double score</dt>
                        <dd>
                            <span class="rule-pill" :class="{ 'is-on': conf.powerups?.[0] }">{{ conf.powerups?.[0] ? "On" : "Off" }}</span>
                        </dd>
                    </div>
                    <div>
                        <dt>Duel</dt>
                        <dd>
                            <span class="rule-pill" :class="{ 'is-on': conf.powerups?.[1] }">{{ conf.powerups?.[1] ? "On" : "Off" }}</span>
                        </dd>
                    </div>
                </dl>

                <p v-if="conf.powerups?.[0] || conf.powerups?.[1]" class="rules-note">
                    Each enabled powerup is usable once per match between rounds. Double Score doubles base points; Duel stakes 1,000 points.
                </p>

                <details v-if="selectedCodes.length > 1" class="rules-accordion">
                    <summary>
                        <span class="accordion-title"><UiIcon name="globe" />Included countries</span>
                        <span class="accordion-meta">
                            <span class="accordion-count">{{ selectedCodes.length }}</span>
                            <UiIcon name="chevron-up" class="accordion-chevron" />
                        </span>
                    </summary>
                    <div class="country-preview" tabindex="0" role="region" aria-label="Selected countries">
                        <span v-for="code in selectedCodes" :key="code" class="country-chip"
                            ><span class="flag" :style="{ backgroundPosition: getFlagBackgroundPosition(code) }" aria-hidden="true" />{{
                                countryDisplayName(code, flags.get(code)?.name)
                            }}</span
                        >
                    </div>
                </details>
            </div>
        </div>
    </UiDialog>
</template>
<script setup lang="ts">
import RegionMap from "./Settings/RegionMap.vue";
import { regionLabel, sameCountries } from "~/utils/regionScoring";
import type { RegionPickerMode } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";
import { continentArtwork } from "~/utils/regionArtwork";
const props = defineProps<{ compact?: boolean }>();
const mapOpen = ref(false);
const mapPreview = ref(false);
const lobby = useLobbyStore();
const conf = computed(() => lobby.lobbySettings?.conf);
const activeRules = computed(() => {
    const c = conf.value;
    if (!c) return [];
    const rules: string[] = [];
    if (c.dynLives) rules.push("Dyn. lives");
    if (c.placeBonus) rules.push("Bonus");
    if (c.powerups?.[0]) rules.push("×2");
    if (c.powerups?.[1]) rules.push("Duel");
    return rules;
});
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
.settings-compact {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 0.4rem;
    min-width: 0;
    min-height: 0;
    height: 100%;
}
.compact-settings-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    min-width: 0;
    flex: none;
}
.compact-region {
    display: flex;
    align-items: center;
    gap: 0.48rem;
    min-width: 0;
    flex: 1;
}
.compact-emblem {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: 2rem;
    block-size: 2rem;
    overflow: hidden;
    border: 1px solid #9be0a54a;
    border-radius: 0.55rem;
    background: #072620;
    color: #b4e587;
}
.compact-emblem.flag-emblem {
    border-radius: 0.4rem;
}
.compact-emblem img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
}
.compact-region-text {
    display: grid;
    min-width: 0;
    line-height: 1.18;
}
.compact-region-text strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #f3fbf3;
    font-size: 0.84rem;
    font-weight: 800;
}
.compact-meta {
    color: #bad6c6;
    font-size: 0.69rem;
    font-weight: 640;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.compact-settings-tools {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    flex: none;
}
.compact-tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-inline-size: 34px;
    min-block-size: 34px;
    padding: 0.2rem 0.56rem;
    border: 1px solid #96d6af55;
    border-radius: 999px;
    background: #0d362ce0;
    color: #e6f7ea;
    font-size: 0.73rem;
    font-weight: 740;
}
.compact-tool-btn:hover {
    border-color: #d0f6a2;
    background: #17493a;
}
.compact-map-preview {
    display: none;
    flex: 1 1 0;
    min-height: 76px;
}
.compact-region-map {
    height: 100%;
    margin: 0;
}
.compact-region-map :deep(.map-stage) {
    height: 100%;
    min-height: 76px;
    border: 1px solid #8ddbaf44;
    border-radius: 0.76rem;
    overflow: hidden;
    box-shadow: inset 0 1px #e2ffd018;
}
.compact-region-map :deep(.map-stage::before),
.compact-region-map :deep(.map-stage::after) {
    display: none;
}
@media (orientation: landscape) and (max-height: 540px) {
    .compact-map-preview {
        display: block;
    }
}
.compact-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.34rem;
    margin: 0;
    flex: none;
}
.compact-stats > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    min-width: 0;
    padding: 0.3rem 0.5rem;
    border: 1px solid #9be0a52e;
    border-radius: 0.65rem;
    background: #06241ed4;
}
.compact-stats dt {
    display: inline-flex;
    align-items: center;
    gap: 0.22rem;
    min-width: 0;
    color: #b4d1c1;
    font-size: 0.65rem;
    font-weight: 680;
    white-space: nowrap;
}
.compact-stats dt .ui-icon {
    flex: none;
    width: 0.8rem;
    height: 0.8rem;
    color: #b8f695;
}
.compact-stats dd {
    margin: 0;
    flex: none;
    color: #f4fbf3;
    font: italic 850 0.88rem / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
.compact-stats dd small {
    font-size: 0.75em;
    font-style: normal;
    opacity: 0.82;
}
@media (max-width: 440px) {
    .compact-stats > div {
        flex-direction: column;
        justify-content: center;
        gap: 0.08rem;
        padding: 0.28rem 0.36rem;
        text-align: center;
    }
    .compact-stats dd {
        font-size: 0.92rem;
    }
}
.compact-rules {
    display: flex;
    flex-wrap: wrap;
    gap: 0.26rem;
    flex: none;
}
.compact-rule-chip {
    padding: 0.1rem 0.44rem;
    border: 1px solid #9be0a538;
    border-radius: 999px;
    background: #0a3027cc;
    color: #cde8d5;
    font-size: 0.66rem;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
}
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
.lobby-map-dialog[open] {
    width: min(36rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    border-color: #6fb6949c;
    border-radius: 1.35rem;
    background:
        url("/images/atlas-relief.svg") center bottom / 30rem auto no-repeat,
        linear-gradient(155deg, #0b332af5, #05201bf8);
    box-shadow:
        0 1.4rem 4.2rem #00130fc7,
        inset 0 1px #e2ffd024;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}
.lobby-map-dialog::backdrop {
    background: #021714b8;
    backdrop-filter: blur(3px);
}
.lobby-map-dialog :deep(.ui-dialog-inner) {
    padding: clamp(0.95rem, 3.5vw, 1.4rem);
}
.lobby-map-dialog :deep(.ui-dialog-header) {
    align-items: center;
    margin-bottom: 0.85rem;
}
.lobby-map-dialog :deep(.ui-dialog-header .eyebrow) {
    margin-block-end: 0.22rem;
    color: #d8fda8;
}
.lobby-map-dialog :deep(.ui-dialog-header h2) {
    font: italic 900 clamp(1.35rem, 4.8vw, 1.85rem) / 1.08 var(--gb-font-display);
    letter-spacing: -0.035em;
}
.lobby-map-dialog :deep(.ui-dialog-header button) {
    border-radius: 50%;
    background: #a4ecd316;
}
.lobby-map-dialog :deep(.ui-dialog-header button:hover) {
    background: #a4ecd328;
}
.rules-dialog-body {
    display: grid;
    gap: 0.8rem;
}
.rules-map-col,
.rules-details-col {
    display: grid;
    gap: 0.65rem;
    min-width: 0;
    align-content: start;
}
.region-overview {
    margin: 0;
}
.region-overview :deep(.map-stage) {
    height: clamp(132px, 24dvh, 210px);
    border: 1px solid #8ddbaf4a;
    border-radius: 0.9rem;
    overflow: hidden;
    box-shadow:
        inset 0 1px #e2ffd01a,
        0 6px 18px #00140f55;
}
.region-overview :deep(.map-stage::before),
.region-overview :deep(.map-stage::after) {
    display: none;
}
.rules-quick-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.42rem;
    margin: 0;
}
.rules-quick-stats > div {
    padding: 0.46rem 0.6rem;
    border: 1px solid #9be0a532;
    border-radius: 0.78rem;
    background: #06241ed4;
    text-align: center;
}
.rules-quick-stats dt {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    color: #b5d2c2;
    font-size: 0.68rem;
    font-weight: 680;
}
.rules-quick-stats dt .ui-icon {
    color: #b8f695;
    width: 0.88rem;
    height: 0.88rem;
}
.rules-quick-stats dd {
    margin: 0.14rem 0 0;
    color: #f4fbf3;
    font: italic 850 1.08rem / 1.1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
.rules-quick-stats dd small {
    font-size: 0.72em;
    font-style: normal;
    opacity: 0.8;
}
.rule-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.38rem;
    margin: 0;
}
.rule-grid > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    min-width: 0;
    padding: 0.44rem 0.62rem;
    border: 1px solid #9be0a52b;
    border-radius: 0.72rem;
    background: #06241ecc;
}
.rule-grid dt {
    color: #c2dccd;
    font-size: 0.74rem;
    font-weight: 650;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.rule-grid dd {
    margin: 0;
    flex: none;
}
.rule-value {
    color: #f1faf2;
    font-size: 0.76rem;
    font-weight: 780;
    font-variant-numeric: tabular-nums;
}
.rule-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.46rem;
    border: 1px solid #8fb6a236;
    border-radius: 999px;
    background: #14332a88;
    color: #9bb8aa;
    font-size: 0.68rem;
    font-weight: 760;
    line-height: 1.3;
}
.rule-pill.is-on {
    border-color: #70d9af66;
    background: #70d9af24;
    color: #a4f5cf;
}
.rules-note {
    color: #a9c7b7;
    font-size: 0.74rem;
    line-height: 1.42;
}
.rules-accordion {
    border: 1px solid #9be0a538;
    border-radius: 0.85rem;
    background: #06241ecc;
    overflow: hidden;
}
.rules-accordion > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0.45rem 0.72rem;
    color: #e6f6e9;
    font-size: 0.8rem;
    font-weight: 750;
    cursor: pointer;
    list-style: none;
}
.rules-accordion > summary::-webkit-details-marker {
    display: none;
}
.rules-accordion > summary:hover {
    background: #ffffff0a;
}
.accordion-title {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}
.accordion-title .ui-icon {
    color: #b8f695;
}
.accordion-meta {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
}
.accordion-count {
    padding: 0.1rem 0.48rem;
    border-radius: 999px;
    background: #b6efa320;
    color: #d8fda8;
    font: 760 0.7rem / 1.3 var(--gb-font-mono);
    font-variant-numeric: tabular-nums;
}
.accordion-chevron {
    width: 0.82rem;
    height: 0.82rem;
    color: #b6efa3;
    transition: rotate 160ms ease;
}
.rules-accordion:not([open]) .accordion-chevron {
    rotate: 180deg;
}
.country-preview {
    display: flex;
    gap: 0.34rem;
    flex-wrap: wrap;
    max-height: 155px;
    overflow: auto;
    padding: 0.45rem 0.65rem 0.65rem;
    border-top: 1px solid #9be0a524;
    scrollbar-width: thin;
}
.country-chip {
    display: inline-flex;
    gap: 0.34rem;
    align-items: center;
    font-size: 0.7rem;
    font-weight: 640;
    padding: 0.18rem 0.5rem 0.18rem 0.28rem;
    border: 1px solid #8ddbaf38;
    border-radius: 999px;
    background: #0b3128d8;
    color: #e3f4e8;
}
.country-chip .flag {
    margin: -4.5px -6px;
    border-radius: 3px;
    transform: scale(0.625);
    transform-origin: center;
}
.flag {
    width: 32px;
    height: 24px;
    display: inline-block;
    background-image: url("/images/flags32.webp");
    flex: none;
}
@media (orientation: landscape) and (max-height: 520px) and (min-width: 560px) {
    .lobby-map-dialog[open] {
        width: min(46rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    }
    .rules-dialog-body {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        align-items: start;
    }
}
@media (max-width: 340px) {
    .rule-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}

.display-landscape-map,
.display-mobile-rules {
    display: none;
}

@media (max-width: 760px), (orientation: landscape) and (max-height: 540px) {
    .settings-display {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
    }
    .configuration-header h2,
    .configuration-tools .map-button {
        display: inline-flex;
    }
    .configuration-views,
    .configuration-map,
    .region-copy .region-tagline,
    .map-suffix,
    .per-round {
        display: none;
    }
    .configuration-summary,
    .configuration-summary.preview-selected {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        gap: 0.36rem;
    }
    .configuration-header {
        flex-wrap: nowrap;
        gap: 0.35rem;
        margin-bottom: 0.38rem;
        padding-bottom: 0.3rem;
        border-bottom-color: #9be0a52e;
    }
    .configuration-header h2 {
        min-width: 0;
        gap: 0.36rem;
        font: italic 850 0.9rem / 1.1 var(--gb-font-display);
        white-space: nowrap;
    }
    .configuration-header h2 svg {
        width: 0.95rem;
        height: 0.95rem;
    }
    .configuration-tools {
        flex-wrap: nowrap;
        flex: none;
        gap: 0.28rem;
    }
    .settings-display .configuration-tools :deep(.btn) {
        min-height: 32px;
        min-width: 0;
        padding: 0.16rem 0.56rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 740;
        gap: 0.28rem;
    }
    .settings-display .configuration-tools :deep(.btn .ui-icon) {
        width: 0.84rem;
        height: 0.84rem;
    }
    .region-summary {
        flex: none;
        gap: 0.48rem;
        margin-bottom: 0;
        padding: 0.32rem 0.5rem;
        border: 1px solid #9be0a52e;
        border-radius: 0.72rem;
        background: #06241ed4;
    }
    .region-emblem {
        width: 1.9rem;
        height: 1.9rem;
    }
    .region-emblem .flag {
        transform: scale(0.7);
    }
    .region-copy strong {
        font-size: 0.84rem;
        font-weight: 800;
    }
    .region-copy p {
        font-size: 0.68rem;
        color: #b5d2c2;
    }
    .settings-summary {
        flex: none;
        gap: 0.34rem;
    }
    .settings-summary > div {
        padding: 0.3rem 0.42rem;
        border: 1px solid #9be0a52e;
        border-radius: 0.65rem;
        background: #06241ed4;
    }
    .settings-summary dt {
        gap: 0.22rem;
        font-size: 0.64rem;
        font-weight: 680;
        color: #b4d1c1;
    }
    .settings-summary dt .ui-icon {
        width: 0.78rem;
        height: 0.78rem;
    }
    .settings-summary dd {
        margin-top: 0.1rem;
        font: italic 850 0.94rem / 1.1 var(--gb-font-display);
        font-variant-numeric: tabular-nums;
    }
    .settings-summary dd small {
        font-style: normal;
        font-size: 0.74em;
        opacity: 0.82;
    }
    .display-mobile-rules {
        display: flex;
        flex: none;
        flex-wrap: wrap;
        gap: 0.26rem;
    }
}
@container (max-width: 290px) {
    .settings-summary dt svg {
        display: none;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .display-landscape-map {
        display: block;
        flex: 1 1 0;
        min-height: 62px;
    }
}
</style>
