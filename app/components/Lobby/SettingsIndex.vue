<template>
    <div ref="root" class="folio" :class="{ 'folio-reading': reading, 'folio-reverse': reverse }">
        <nav class="folio-index" aria-label="Settings sections">
            <button
                v-for="(section, i) in sections"
                :key="section.id"
                type="button"
                class="index-entry"
                :data-entry="section.id"
                :aria-label="section.label"
                :aria-describedby="`${uid}-hint-${section.id}`"
                :aria-current="reading && current === section.id ? 'page' : undefined"
                :aria-controls="`${uid}-${section.id}`"
                @click="open(section.id)"
            >
                <span class="index-mark" aria-hidden="true"><UiIcon :name="section.icon" /></span>
                <span class="index-copy"
                    ><strong>{{ section.label }}</strong
                    ><small :id="`${uid}-hint-${section.id}`">{{ section.summary }}</small></span
                >
                <span class="index-number" aria-hidden="true">0{{ i + 1 }}</span>
                <svg class="index-chevron" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.5" />
                </svg>
            </button>
        </nav>
        <div v-show="reading" class="folio-page">
            <div class="page-heading">
                <button v-show="narrow" ref="backButton" class="folio-back" type="button" aria-label="All settings" @click="back">
                    <UiIcon name="arrow" /><span>All settings</span>
                </button>
                <h3 ref="heading" tabindex="-1">{{ activeSection.id === "map" ? "Map Selection" : activeSection.label }}</h3>
                <span class="page-count" aria-hidden="true"
                    ><b>0{{ sectionNumber }}</b> / 04</span
                >
            </div>
            <section
                v-for="section in sections"
                :id="`${uid}-${section.id}`"
                :key="section.id"
                v-show="reading && current === section.id"
                class="folio-leaf"
                data-viewport-scroll
                :inert="!reading || current !== section.id"
                :aria-label="section.label"
                :data-section="section.id"
            >
                <slot v-if="visited.has(section.id)" :name="section.id" />
            </section>
        </div>
    </div>
</template>
<script setup lang="ts">
export type SettingsChapter = "lobby" | "rounds" | "map" | "scoring";
const props = defineProps<{ sections: { id: SettingsChapter; label: string; summary: string; icon: string }[] }>();
const uid = useId();
const root = ref<HTMLElement | null>(null),
    heading = ref<HTMLElement | null>(null),
    backButton = ref<HTMLButtonElement | null>(null);
const query = import.meta.client ? window.matchMedia("(max-width: 559px), (max-width: 760px) and (orientation: portrait)") : null;
const narrow = ref(Boolean(query?.matches)),
    detail = ref(!narrow.value),
    current = ref<SettingsChapter>("lobby");
const reading = computed(() => !narrow.value || detail.value);
// Keep required native fields (including the bounded round/guess steppers) in
// the form from the start, even when only the index is visible. The atlas and
// score preview can still wait until first use. Hidden chapters stay inert.
const visited = reactive(new Set<SettingsChapter>(["lobby", "rounds"]));
const sectionNumber = computed(() => props.sections.findIndex((s) => s.id === current.value) + 1);
const activeSection = computed(() => props.sections[sectionNumber.value - 1]!);
const reverse = ref(false);
function focusEntry(id: SettingsChapter) {
    const row = root.value?.querySelector<HTMLButtonElement>(`[data-entry="${id}"]`);
    row?.focus({ preventScroll: true });
    row?.scrollIntoView({ block: "nearest", inline: "nearest" });
}
async function open(id: SettingsChapter) {
    reverse.value = !narrow.value && props.sections.findIndex((s) => s.id === id) + 1 < sectionNumber.value;
    visited.add(id);
    current.value = id;
    detail.value = true;
    await nextTick();
    heading.value?.focus({ preventScroll: true });
}
async function back() {
    reverse.value = true;
    detail.value = false;
    await nextTick();
    focusEntry(current.value);
}
async function resize(e: MediaQueryListEvent) {
    const focused = document.activeElement;
    const inIndex = focused instanceof HTMLElement && root.value?.querySelector("nav")?.contains(focused);
    const onBack = focused === backButton.value;
    detail.value = !e.matches || !inIndex;
    narrow.value = e.matches;
    await nextTick();
    if (!e.matches && onBack) focusEntry(current.value);
}
onMounted(() => query?.addEventListener("change", resize));
onBeforeUnmount(() => query?.removeEventListener("change", resize));
defineExpose({ open, current });
</script>
<style scoped>
.folio {
    --folio-line: color-mix(in srgb, var(--gb-line) 46%, transparent);
    display: grid;
    grid-template-columns: minmax(10.75rem, 30%) minmax(0, 1fr);
    overflow: hidden;
    border-block: 1px solid var(--folio-line);
    height: min(36rem, calc(100dvh - 8rem));
    min-height: 0;
}
.folio-index,
.folio-leaf {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--gb-line) transparent;
}
.folio-index {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border-right: 1px solid #9be0a526;
    background:
        linear-gradient(180deg, #07312df0 54%, #041e1bd8),
        url("/images/emerald-horizon-portrait.webp") center bottom / cover,
        var(--gb-bg);
}
.page-count,
.index-number {
    font: 0.64rem/1.2 var(--gb-font-mono);
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
}
.index-entry {
    position: relative;
    width: 100%;
    min-height: 2.9rem;
    padding: 0.36rem 0.52rem;
    display: grid;
    grid-template-columns: 1.65rem minmax(0, 1fr) auto;
    align-items: center;
    text-align: start;
    gap: 0.48rem;
    background: transparent;
    color: var(--gb-text);
    border: 1px solid transparent;
    border-radius: 0.74rem;
    transition:
        background-color 140ms ease,
        border-color 140ms ease,
        box-shadow 140ms ease;
}
.index-entry:hover {
    background: #1a4134a6;
}
.index-entry[aria-current] {
    border-color: #b7f98699;
    background: linear-gradient(110deg, #2b5438e6, #14362be6);
    box-shadow: inset 0 0 18px #a8e75c24;
}
.index-mark {
    color: #b8f695;
    width: 1.65rem;
    height: 1.65rem;
    border-radius: 50%;
    background: #b6efa318;
    border: 1px solid #9be0a52e;
    display: flex;
    align-items: center;
    justify-content: center;
}
.index-mark .ui-icon {
    width: 0.92rem;
    height: 0.92rem;
}
.index-copy {
    min-width: 0;
    display: grid;
    gap: 0.08rem;
}
.index-copy strong {
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 760;
}
.index-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #aac9ba;
    font-size: 0.69rem;
    line-height: 1.25;
}
.index-number {
    color: #8fb2a3;
    font-size: 0.6rem;
}
.index-chevron {
    display: none;
    color: #b8f695;
}
.index-entry:focus-visible,
.folio-back:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: -2px;
}
.folio-page {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: linear-gradient(140deg, #0d362fed, #051e1bf5 82%);
}
.page-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: none;
    min-height: 2.55rem;
    margin: 0 0.95rem;
    border-bottom: 1px solid #9be0a528;
}
.page-heading h3 {
    font: italic 850 1.08rem / 1.15 var(--gb-font-display);
    letter-spacing: -0.03em;
    margin: 0;
}
.page-heading h3:focus {
    outline: none;
}
.page-heading h3:focus-visible {
    text-decoration: underline;
    text-decoration-color: var(--gb-accent);
    text-underline-offset: 4px;
}
.page-count {
    color: var(--gb-muted);
    margin-left: auto;
    white-space: nowrap;
}
.page-count b {
    color: var(--gb-accent);
    font-weight: 500;
}
.folio-leaf {
    padding: 0.55rem 1.05rem 0.8rem;
    flex: 1;
}
.folio-leaf[data-section="map"] {
    container-type: size;
}
.folio-leaf[data-section="map"]:has(.has-country-picker) {
    overflow: hidden;
}
/* Frame the whole atlas on entry, not just its northern edge. Keep a usable
   minimum for exceptional heights; the leaf itself remains scrollable. */
.folio-leaf[data-section="map"] :deep(.map-stage) {
    height: clamp(100px, calc(100cqh - 5.6rem), 215px);
}
.folio-back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0 0.35rem 0 0;
    background: none;
    border: 0;
    color: var(--gb-accent);
    font-size: 0.76rem;
}
.folio-back svg {
    transform: rotate(180deg);
    width: 0.95rem;
}
@media (prefers-reduced-motion: no-preference) {
    .folio-leaf {
        --folio-shift: 12px;
        animation: turn-page 180ms cubic-bezier(0.2, 0.76, 0.2, 1) both;
    }
    .folio-reverse .folio-leaf {
        --folio-shift: -12px;
    }
    @keyframes turn-page {
        from {
            opacity: 0.24;
            transform: translateX(var(--folio-shift));
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
}
@media (max-width: 559px), (max-width: 760px) and (orientation: portrait) {
    .folio {
        display: flex;
        flex-direction: column;
        /* Fixed book edges: the title stays in place during a page turn. */
        height: min(15.75rem, calc(100dvh - 7rem));
    }
    .folio-index {
        border: 0;
        flex: 1;
        gap: 0.34rem;
        padding: 0.55rem 0.65rem 0.65rem;
    }
    .index-entry {
        grid-template-columns: 1.85rem minmax(0, 1fr) 13px;
        min-height: 3.1rem;
        padding: 0.44rem 0.62rem;
        border: 1px solid #9be0a52c;
        border-radius: 0.8rem;
        background: #06241ecc;
        gap: 0.55rem;
    }
    .index-chevron {
        display: block;
    }
    .index-number,
    .page-count {
        display: none;
    }
    .folio-page {
        flex: 1;
    }
    .folio-reading .folio-index {
        display: grid;
        flex: none;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.28rem;
        padding: 0.38rem 0.58rem;
        border-bottom: 1px solid #9be0a524;
    }
    .folio-reading .index-entry {
        display: flex;
        min-height: 36px;
        justify-content: center;
        padding: 0.22rem;
        border: 1px solid #9be0a52e;
        border-radius: 999px;
        background: #06241ec8;
    }
    .folio-reading .index-mark {
        width: auto;
        height: auto;
        border: 0;
        background: transparent;
    }
    .folio-reading .index-copy,
    .folio-reading .index-number,
    .folio-reading .index-chevron {
        display: none;
    }
    .page-heading {
        min-height: 2.35rem;
        margin: 0 0.65rem;
        gap: 0.5rem;
    }
    .folio-back {
        min-height: 34px;
        min-width: 0;
        padding: 0.14rem 0.52rem 0.14rem 0.38rem;
        border: 1px solid #9be0a538;
        border-radius: 999px;
        background: #082d24d8;
        font-size: 0.72rem;
        font-weight: 720;
    }
    .page-heading h3 {
        font-size: 0.96rem;
    }
    .folio-leaf {
        padding: 0.45rem 0.65rem 0.65rem;
    }
    @media (prefers-reduced-motion: no-preference) {
        .folio-reverse .folio-index {
            --folio-shift: -12px;
            animation: turn-page 180ms ease-out both;
        }
    }
}
@media (min-width: 560px) and (max-height: 540px) and (orientation: landscape) {
    .folio-page:has(.folio-leaf:not([inert]) .has-country-picker) > .page-heading {
        display: none;
    }
    .folio {
        height: min(15rem, calc(100dvh - 7rem));
        grid-template-columns: minmax(9.5rem, 27%) minmax(0, 1fr);
    }
    .folio-index {
        gap: 0.22rem;
        padding: 0.36rem 0.4rem;
    }
    .index-entry {
        grid-template-columns: 1.5rem minmax(0, 1fr);
        min-height: 38px;
        padding: 0.26rem 0.44rem;
        gap: 0.42rem;
        border-radius: 0.68rem;
    }
    .index-mark {
        width: 1.5rem;
        height: 1.5rem;
    }
    .index-mark .ui-icon {
        width: 0.84rem;
        height: 0.84rem;
    }
    .index-number,
    .page-count {
        display: none;
    }
    .index-copy strong {
        font-size: 0.76rem;
    }
    .index-copy small {
        font-size: 0.65rem;
    }
    .page-heading {
        min-height: 2.05rem;
        margin: 0 0.72rem;
    }
    .page-heading h3 {
        font-size: 0.96rem;
    }
    .folio-leaf {
        padding: 0.38rem 0.72rem 0.5rem;
    }
}
@media (max-width: 760px), (orientation: landscape) and (max-height: 540px), (orientation: landscape) and (pointer: coarse) and (max-width: 1100px) {
    .folio {
        flex: 1;
        height: auto;
        width: 100%;
    }
    .folio-leaf[data-section="map"] :deep(.map-stage) {
        height: clamp(120px, calc(100cqh - 6.5rem), 420px);
    }
    .folio-leaf[data-section="map"]:has(.has-chooser) :deep(.map-stage) {
        height: clamp(115px, 45cqh, 280px);
    }
}
</style>
