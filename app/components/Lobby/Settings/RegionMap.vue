<template>
    <figure class="region-map">
        <div class="map-stage">
            <svg class="map-canvas" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" role="group" :aria-labelledby="`${id}-title`" :aria-describedby="`${id}-keys`">
                <title :id="`${id}-title`">Choose a playable region</title>
                <desc :id="`${id}-keys`">Arrow keys browse countries; Enter or Space selects. Country and continent controls offer the same choices. Tab leaves the map.</desc>
                <g v-for="offset in wrapOffsets" :key="`land-${offset}`" :transform="`translate(${offset} 0)`" aria-hidden="true" class="map-backdrop">
                    <path v-for="(path, index) in geography.land" :key="index" :d="path" fill-rule="evenodd" />
                </g>
                <g v-for="offset in wrapOffsets" :key="`grid-${offset}`" :transform="`translate(${offset} 0)`" aria-hidden="true" class="map-grid">
                    <path d="M0 256H1024M512 0V512" />
                </g>
                <g
                    v-for="country in mapCountries"
                    :key="country.code"
                    :data-country="country.code"
                    class="map-country"
                    :class="{ 'is-selected': selected.has(country.code), 'is-hovered': hovered === country.code }"
                    role="button"
                    :tabindex="!disabled && activeCode === country.code ? 0 : -1"
                    :aria-label="actionLabel(country.code)"
                    :aria-pressed="selected.has(country.code)"
                    :aria-disabled="disabled || undefined"
                    @pointerenter="hovered = country.code"
                    @pointerleave="hovered = ''"
                    @focus="activeCode = country.code"
                    @click="choose(country.code, $event)"
                    @keydown="navigate(country.code, $event)"
                >
                    <title>{{ actionLabel(country.code) }}</title>
                    <g v-for="offset in wrapOffsets" :key="offset" :transform="`translate(${offset} 0)`">
                        <path v-for="(path, index) in country.paths" :key="index" :d="path.d" fill-rule="evenodd" vector-effect="non-scaling-stroke" />
                    </g>
                </g>
            </svg>
        </div>
        <div class="map-toolbar">
            <span class="map-hover" aria-hidden="true">{{ hoverLabel || "Explore the map" }}</span>
            <div class="map-actions">
                <button type="button" class="map-control map-fit" :disabled="disabled || !selected.size" @click="fitSelection">Fit selection</button>
                <button type="button" class="map-control map-reset" aria-label="Reset map" title="Reset map" :disabled="disabled || !isZoomed" @click="resetMap">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                        <path d="M4 10a8 8 0 1 1 1.8 7M4 4v6h6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
        <figcaption>Country outlines · imagery coverage varies.</figcaption>
    </figure>
</template>

<script setup lang="ts">
import geography from "~/assets/region-map.json";
import type { CountryCatalog, RegionMapBounds, RegionPickerMode } from "~/types/regions";

const props = withDefaults(
    defineProps<{
        catalog: CountryCatalog;
        selectedCodes: string[];
        mode: RegionPickerMode;
        disabled?: boolean;
    }>(),
    { disabled: false }
);
const emit = defineEmits<{ select: [code: string] }>();
const id = useId();
const world = { x: 0, y: 0, width: geography.width, height: geography.height };
const camera = ref<RegionMapBounds>({ ...world });
const hovered = ref("");
const activeCode = ref("");
const shapes = new Map(geography.countries.map((country) => [country.code, country]));
const available = computed(() => new Map(props.catalog.countries.map((country) => [country.code, country])));
const selected = computed(() => new Set(props.selectedCodes.filter((code) => available.value.has(code))));
const mapCountries = computed(() =>
    [...props.catalog.countries]
        .sort((a, b) => a.name.localeCompare(b.name, "en") || a.code.localeCompare(b.code, "en"))
        .flatMap((country) => {
            const shape = shapes.get(country.code);
            return shape ? [shape] : [];
        })
);
const viewBox = computed(() => `${camera.value.x} ${camera.value.y} ${camera.value.width} ${camera.value.height}`);
const isZoomed = computed(() => camera.value.width < world.width);
const wrapOffsets = computed(() => {
    const first = Math.floor(camera.value.x / world.width);
    const last = Math.ceil((camera.value.x + camera.value.width) / world.width) - 1;
    return Array.from({ length: last - first + 1 }, (_, index) => (first + index) * world.width);
});
const hoverLabel = computed(() => available.value.get(hovered.value)?.name);

function actionLabel(code: string) {
    const country = available.value.get(code);
    if (!country) return code;
    if (props.mode === "world" || props.mode === "continents") {
        const continent = props.catalog.continents.find((item) => item.id === country.continent);
        return `Select ${continent?.name || country.name} via ${country.name}`;
    }
    return `${props.mode === "custom" ? "Toggle" : "Select"} ${country.name}`;
}

function isDisabled(event: Event) {
    // Native fieldsets disable the equivalent buttons/selects, but not SVG nodes.
    return props.disabled || !!(event.currentTarget as Element | null)?.closest("fieldset:disabled, [inert]");
}

function choose(code: string, event: Event) {
    if (isDisabled(event)) return;
    activeCode.value = code;
    emit("select", code);
}

async function navigate(code: string, event: KeyboardEvent) {
    if (isDisabled(event)) return;
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(code, event);
        return;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const countries = mapCountries.value;
    const index = countries.findIndex((country) => country.code === code);
    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? countries.length - 1 : (index + direction + countries.length) % countries.length;
    const next = countries[nextIndex];
    if (!next) return;
    const canvas = (event.currentTarget as SVGElement).ownerSVGElement;
    activeCode.value = next.code;
    if (isZoomed.value) frameBounds(next.bounds);
    await nextTick();
    const target = Array.from(canvas?.querySelectorAll<SVGGElement>("[data-country]") || []).find((element) => element.dataset.country === next.code);
    target?.focus({ preventScroll: true });
}

function resetMap() {
    camera.value = { ...world };
}

function frameBounds(bounds: RegionMapBounds) {
    // Fixed projection math, independent of viewport/DOM, also runs during SSR.
    const width = Math.min(world.width, Math.max(32, bounds.width * 1.3, bounds.height * 2 * 1.3));
    const height = width / 2;
    camera.value = {
        x: width === world.width ? 0 : bounds.x + bounds.width / 2 - width / 2,
        y: Math.max(0, Math.min(world.height - height, bounds.y + bounds.height / 2 - height / 2)),
        width,
        height,
    };
}

function fitSelection() {
    const countries = mapCountries.value.filter((country) => selected.value.has(country.code));
    const firstSelected = countries[0];
    if (!firstSelected) return;
    // Keep the single Tab entry inside the fitted selection without moving focus.
    if (!countries.some((country) => country.code === activeCode.value)) activeCode.value = firstSelected.code;
    if (selected.value.size === available.value.size) {
        resetMap();
        return;
    }
    const bounds = countries.map((country) => country.bounds);
    // Merge wrapped x intervals, then exclude the largest empty longitude gap.
    // This keeps a Pacific selection together instead of fitting the whole world.
    const intervals: Array<[number, number]> = [];
    let top = world.height;
    let bottom = 0;
    for (const box of bounds) {
        const end = box.x + box.width;
        intervals.push([box.x, Math.min(world.width, end)]);
        if (end > world.width) intervals.push([0, end - world.width]);
        top = Math.min(top, box.y);
        bottom = Math.max(bottom, box.y + box.height);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const interval of intervals) {
        const previous = merged.at(-1);
        if (previous && interval[0] <= previous[1]) previous[1] = Math.max(previous[1], interval[1]);
        else merged.push([...interval]);
    }
    let largestGap = -1;
    let left = 0;
    merged.forEach((interval, index) => {
        const nextStart = merged[index + 1]?.[0] ?? (merged[0]?.[0] ?? 0) + world.width;
        const gap = nextStart - interval[1];
        if (gap > largestGap) {
            largestGap = gap;
            left = nextStart % world.width;
        }
    });
    frameBounds({ x: left, y: top, width: world.width - largestGap, height: bottom - top });
}

watch(
    [() => props.mode, () => props.selectedCodes.join(","), mapCountries],
    () => {
        const firstSelected = mapCountries.value.find((country) => selected.value.has(country.code));
        const currentStillAvailable = mapCountries.value.some((country) => country.code === activeCode.value);
        if (!currentStillAvailable) {
            activeCode.value = firstSelected?.code || mapCountries.value[0]?.code || "";
        }
        if (props.mode === "world") resetMap();
        else if (props.mode === "continents" || (props.mode === "country" && selected.value.size === 1)) fitSelection();
    },
    { immediate: true }
);
</script>

<style scoped>
.region-map {
    margin: 0;
    min-width: 0;
}
.map-stage {
    height: clamp(210px, 24vw, 280px);
    overflow: hidden;
    border: 1px solid var(--gb-line);
    border-radius: 8px;
    background: var(--gb-bg);
}
.map-canvas {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
.map-backdrop {
    fill: #303530;
    pointer-events: none;
}
.map-grid {
    fill: none;
    stroke: var(--gb-line);
    stroke-width: 0.5;
    opacity: 0.45;
    pointer-events: none;
}
.map-country {
    cursor: pointer;
    outline: none;
}
.map-country path {
    fill: #596350;
    stroke: var(--gb-bg);
    stroke-width: 0.55;
    stroke-linejoin: round;
}
.map-country.is-selected path {
    fill: var(--gb-accent);
    stroke: #526344;
}
.map-country.is-hovered path {
    fill: var(--gb-accent-end);
    stroke: var(--gb-text);
    stroke-width: 1;
}
.map-country.is-selected.is-hovered path {
    fill: var(--gb-accent-hover);
}
.map-country:focus-visible path {
    fill: var(--gb-accent-end);
    stroke: var(--gb-text);
    stroke-width: 2;
}
.map-country.is-selected:focus-visible path {
    fill: var(--gb-accent-hover);
}
.map-country[aria-disabled="true"] {
    cursor: default;
}
.map-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
    margin-top: 0.15rem;
}
.map-hover {
    min-width: 0;
    color: var(--gb-muted);
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.map-actions {
    display: flex;
    flex: none;
    gap: 0.15rem;
}
.map-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0.35rem 0.5rem;
    border: 1px solid transparent;
    border-radius: var(--gb-radius);
    background: transparent;
    color: var(--gb-text);
    font-size: 0.75rem;
    font-weight: 600;
}
.map-control:enabled:hover {
    border-color: var(--gb-line);
    background: var(--gb-raised);
}
.map-control:disabled {
    color: var(--gb-muted);
    opacity: 0.5;
}
.map-control:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 1px;
}
figcaption {
    color: var(--gb-muted);
    font-size: 0.7rem;
    line-height: 1.45;
    text-wrap: pretty;
}
@media (max-width: 760px) {
    .map-stage {
        height: 172px;
    }
}
@media (max-width: 360px) {
    .map-stage {
        height: 156px;
    }
    .map-hover {
        font-size: 0.7rem;
    }
}
</style>
