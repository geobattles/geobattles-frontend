<template>
    <figure class="region-map" :class="{ 'is-readonly': readonly, 'is-dragging': dragging, 'is-disabled': disabled }">
        <div class="map-stage">
            <svg
                ref="canvas"
                class="map-canvas"
                :viewBox="viewBox"
                preserveAspectRatio="xMidYMid meet"
                :role="readonly ? 'img' : 'group'"
                :aria-labelledby="`${id}-title`"
                :aria-describedby="`${id}-keys`"
                @pointerdown="startPointer"
                @pointermove="movePointer"
                @pointerup="endPointer"
                @pointercancel="cancelPointer"
                @lostpointercapture="cancelPointer"
                @touchstart="guardTouch"
                @touchmove="guardTouch"
                @wheel="wheelZoom"
                @click.capture="guardClick"
            >
                <title :id="`${id}-title`">{{ readonly ? "Selected playable region" : "Choose a playable region" }}</title>
                <desc :id="`${id}-keys`">
                    {{
                        readonly
                            ? "Selected countries are highlighted. Country outlines are illustrative."
                            : "Drag to pan; scroll, pinch or use the zoom buttons to zoom. On touch screens, swipe vertically to scroll the page. Arrow keys browse countries; Enter or Space selects. Native country and continent controls offer the same choices. Tab leaves the map."
                    }}
                </desc>
                <g v-for="offset in wrapOffsets" :key="`land-${offset}`" :transform="`translate(${offset} 0)`" aria-hidden="true" class="map-backdrop">
                    <path v-for="(path, index) in geography.land" :key="index" :d="path" fill-rule="evenodd" />
                </g>
                <g v-for="offset in wrapOffsets" :key="`grid-${offset}`" :transform="`translate(${offset} 0)`" aria-hidden="true" class="map-grid">
                    <path d="M0 128H1024M0 256H1024M0 384H1024M256 0V512M512 0V512M768 0V512" vector-effect="non-scaling-stroke" />
                </g>
                <g
                    v-for="country in mapCountries"
                    :key="country.code"
                    :data-country="country.code"
                    class="map-country"
                    :class="{ 'is-selected': selected.has(country.code), 'is-hovered': !readonly && !disabled && !dragging && hovered === country.code }"
                    :role="readonly ? undefined : 'button'"
                    :tabindex="readonly ? undefined : !disabled && activeCode === country.code ? 0 : -1"
                    :aria-label="readonly ? undefined : actionLabel(country.code)"
                    :aria-pressed="readonly ? undefined : selected.has(country.code)"
                    :aria-disabled="disabled || undefined"
                    :aria-hidden="readonly || undefined"
                    @pointerenter="hovered = country.code"
                    @pointerleave="hovered = ''"
                    @focus="focusCountry(country.code, $event)"
                    @click="choose(country.code, $event)"
                    @keydown="navigate(country.code, $event)"
                >
                    <title>{{ readonly ? available.get(country.code)?.name : actionLabel(country.code) }}</title>
                    <g v-for="offset in wrapOffsets" :key="offset" :transform="`translate(${offset} 0)`">
                        <path v-for="(path, index) in country.paths" :key="index" :d="path.d" fill-rule="evenodd" vector-effect="non-scaling-stroke" />
                    </g>
                </g>
            </svg>
        </div>
        <div v-if="!readonly" class="map-toolbar">
            <span class="map-hover" aria-hidden="true">{{ hoverLabel }}</span>
            <div class="map-actions">
                <button type="button" class="map-control map-zoom" aria-label="Zoom out" title="Zoom out" :disabled="disabled || !isZoomed" @click="control($event, 'out')">
                    −
                </button>
                <button
                    type="button"
                    class="map-control map-zoom"
                    aria-label="Zoom in"
                    title="Zoom in"
                    :disabled="disabled || camera.width <= minWidth"
                    @click="control($event, 'in')"
                >
                    +
                </button>
                <button type="button" class="map-control map-fit" aria-label="Fit selection" :disabled="disabled || !selected.size" @click="control($event, 'fit')">Fit</button>
                <button type="button" class="map-control map-reset" aria-label="Reset map" title="Reset map" :disabled="disabled || !isMoved" @click="control($event, 'reset')">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                        <path d="M4 10a8 8 0 1 1 1.8 7M4 4v6h6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
        <p v-if="!readonly" class="map-hint"><span class="map-desktop-hint">Drag to pan · scroll to zoom</span><span class="map-touch-hint">Swipe to pan · pinch to zoom</span></p>
        <figcaption class="sr-only">Country outlines · imagery coverage varies.</figcaption>
    </figure>
</template>

<script setup lang="ts">
import geography from "~/assets/region-map.json";
import type { CountryCatalog, RegionMapBounds, RegionPickerMode } from "~/types/regions";
import { countryDisplayName } from "~/utils/countryDisplayName";

const props = withDefaults(
    defineProps<{
        catalog: CountryCatalog;
        selectedCodes: string[];
        mode: RegionPickerMode;
        disabled?: boolean;
        readonly?: boolean;
    }>(),
    { disabled: false, readonly: false }
);
const emit = defineEmits<{ select: [code: string] }>();
const id = useId();
const world = { x: 0, y: 0, width: geography.width, height: geography.height };
const camera = ref<RegionMapBounds>({ ...world });
const canvas = ref<SVGSVGElement | null>(null);
const minWidth = 16;
const dragging = ref(false);
type PointerPosition = { x: number; y: number; startX: number; startY: number; target: Element };
const pointers = new Map<number, PointerPosition>();
let suppressClick = false;
let pointerSelection = false;
const hovered = ref("");
const activeCode = ref("");
const shapes = new Map(geography.countries.map((country) => [country.code, country]));
const available = computed(() => new Map(props.catalog.countries.map((country) => [country.code, { ...country, name: countryDisplayName(country.code, country.name) }])));
const selected = computed(() => new Set(props.selectedCodes.filter((code) => available.value.has(code))));
const mapCountries = computed(() =>
    [...props.catalog.countries]
        .sort((a, b) => countryDisplayName(a.code, a.name).localeCompare(countryDisplayName(b.code, b.name), "en") || a.code.localeCompare(b.code, "en"))
        .flatMap((country) => {
            const shape = shapes.get(country.code);
            return shape ? [shape] : [];
        })
);
const viewBox = computed(() => `${camera.value.x} ${camera.value.y} ${camera.value.width} ${camera.value.height}`);
const isZoomed = computed(() => camera.value.width < world.width);
const isMoved = computed(() => isZoomed.value || Math.abs(camera.value.x) > 0.01);
const wrapOffsets = computed(() => {
    const first = Math.floor(camera.value.x / world.width);
    const last = Math.ceil((camera.value.x + camera.value.width) / world.width) - 1;
    return Array.from({ length: last - first + 1 }, (_, index) => (first + index) * world.width);
});
const hoverLabel = computed(() => available.value.get(hovered.value)?.name);

function actionLabel(code: string) {
    const country = available.value.get(code);
    if (!country) return code;
    if (props.mode === "continents") {
        const continent = props.catalog.continents.find((item) => item.id === country.continent);
        return `Select ${continent?.name || country.name} via ${country.name}`;
    }
    return `${props.mode === "custom" ? "Toggle" : "Select"} ${country.name}`;
}

function isDisabled(event: Event) {
    // Native fieldsets disable the equivalent buttons/selects, but not SVG nodes.
    return props.disabled || props.readonly || !!(event.currentTarget as Element | null)?.closest("fieldset:disabled, [inert]");
}

function choose(code: string, event: Event) {
    if (isDisabled(event)) return;
    activeCode.value = code;
    // Local toggles keep the user's camera; native preset controls still fit.
    pointerSelection = true;
    emit("select", code);
    void nextTick(() => {
        pointerSelection = false;
    });
}

function guardClick(event: MouseEvent) {
    // Screen-reader activation has no pointer gesture to suppress. Native
    // pointer clicks still remain blocked after a drag, including touch clicks.
    const isPointerClick = event.detail > 0 || (event instanceof PointerEvent && !!event.pointerType);
    if (isDisabled(event) || (suppressClick && isPointerClick)) {
        event.preventDefault();
        event.stopPropagation();
    }
}

function setCamera(x: number, y: number, width: number) {
    const boundedWidth = Math.max(minWidth, Math.min(world.width, width));
    const height = boundedWidth / 2;
    camera.value = {
        x: ((x % world.width) + world.width) % world.width,
        y: Math.max(0, Math.min(world.height - height, y)),
        width: boundedWidth,
        height,
    };
}

function zoom(factor: number, anchorX = 0.5, anchorY = 0.5) {
    const current = camera.value;
    const width = Math.max(minWidth, Math.min(world.width, current.width * factor));
    setCamera(current.x + (current.width - width) * anchorX, current.y + (current.height - width / 2) * anchorY, width);
}

function screenPoint(x: number, y: number) {
    const matrix = canvas.value?.getScreenCTM();
    if (!matrix) return null;
    // Includes SVG's meet/letterbox offset, not just the outer client rectangle.
    return { x: (x - matrix.e) / matrix.a, y: (y - matrix.f) / matrix.d, scale: matrix.a };
}

function control(event: MouseEvent, action: "in" | "out" | "fit" | "reset") {
    if (isDisabled(event)) return;
    if (action === "fit") fitSelection();
    else if (action === "reset") resetMap();
    else zoom(action === "in" ? 1 / 1.5 : 1.5);
}

function wheelZoom(event: WheelEvent) {
    if (isDisabled(event)) return;
    const point = screenPoint(event.clientX, event.clientY);
    if (!point) return;
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 200 : 1);
    zoom(Math.exp(Math.max(-0.5, Math.min(0.5, delta * 0.003))), (point.x - camera.value.x) / camera.value.width, (point.y - camera.value.y) / camera.value.height);
}

function guardTouch(event: TouchEvent) {
    // Keep ordinary page swipes native, but reserve a two-finger gesture before
    // the browser can interpret its vertical midpoint movement as page scroll.
    if (!isDisabled(event) && event.touches.length > 1 && event.cancelable) event.preventDefault();
}

function startPointer(event: PointerEvent) {
    if (isDisabled(event) || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (!pointers.size) suppressClick = false;
    const target = (event.target as Element).closest("[data-country]") || canvas.value;
    if (!target) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, target });
    // Capture on the stable country group, not the SVG or a wrapping path.
    // Taps retain their country and wrap-copy removal cannot interrupt a drag.
    target.setPointerCapture(event.pointerId);
    if (pointers.size > 1) {
        suppressClick = true;
        dragging.value = true;
        hovered.value = "";
    }
}

function movePointer(event: PointerEvent) {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    if (isDisabled(event)) {
        clearPointers();
        return;
    }
    const previous = [...pointers.values()].map(({ x, y }) => ({ x, y }));
    const oldX = pointer.x;
    const oldY = pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!dragging.value && Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) < 6) return;
    suppressClick = true;
    // A vertical one-finger swipe belongs to the page, even before pointercancel.
    if (!dragging.value && event.pointerType === "touch" && pointers.size === 1 && Math.abs(pointer.x - pointer.startX) <= Math.abs(pointer.y - pointer.startY)) return;
    dragging.value = true;
    hovered.value = "";
    const next = [...pointers.values()];
    const a = previous[0];
    const b = previous[1];
    const c = next[0];
    const d = next[1];
    if (a && b && c && d) {
        const before = screenPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
        const after = screenPoint((c.x + d.x) / 2, (c.y + d.y) / 2);
        if (!before || !after) return;
        const oldDistance = Math.hypot(a.x - b.x, a.y - b.y);
        const newDistance = Math.hypot(c.x - d.x, c.y - d.y);
        if (oldDistance < 1 || newDistance < 1) return;
        const current = camera.value;
        const width = Math.max(minWidth, Math.min(world.width, (current.width * oldDistance) / newDistance));
        const ratio = width / current.width;
        setCamera(before.x - (after.x - current.x) * ratio, before.y - (after.y - current.y) * ratio, width);
    } else {
        const point = screenPoint(event.clientX, event.clientY);
        if (!point) return;
        setCamera(camera.value.x - (pointer.x - oldX) / point.scale, camera.value.y - (pointer.y - oldY) / point.scale, camera.value.width);
    }
}

function endPointer(event: PointerEvent) {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    pointers.delete(event.pointerId);
    if (pointer.target.hasPointerCapture(event.pointerId)) pointer.target.releasePointerCapture(event.pointerId);
    if (!pointers.size) dragging.value = false;
}

function cancelPointer(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    suppressClick = true;
    endPointer(event);
}

function clearPointers() {
    const captured = [...pointers.entries()];
    pointers.clear();
    for (const [pointerId, pointer] of captured) {
        if (pointer.target.hasPointerCapture(pointerId)) pointer.target.releasePointerCapture(pointerId);
    }
    dragging.value = false;
    suppressClick = true;
}

function focusCountry(code: string, event: FocusEvent) {
    if (isDisabled(event)) return;
    activeCode.value = code;
    // Do not refit on pointer focus during a pan or a country toggle.
    if (!pointers.size && (event.target as Element).matches(":focus-visible")) {
        const bounds = shapes.get(code)?.bounds;
        if (bounds && isMoved.value) {
            const left = (((bounds.x - camera.value.x) % world.width) + world.width) % world.width;
            const isInFrame = left + bounds.width <= camera.value.width && bounds.y >= camera.value.y && bounds.y + bounds.height <= camera.value.y + camera.value.height;
            if (!isInFrame) frameBounds(bounds);
        }
    }
}

watch([() => props.disabled, () => props.readonly], clearPointers);
onBeforeUnmount(clearPointers);

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
    setCamera(width === world.width ? 0 : bounds.x + bounds.width / 2 - width / 2, bounds.y + bounds.height / 2 - height / 2, width);
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
    [() => props.mode, () => props.selectedCodes.join(","), mapCountries, () => props.readonly],
    (value, previous) => {
        const firstSelected = mapCountries.value.find((country) => selected.value.has(country.code));
        const currentStillAvailable = mapCountries.value.some((country) => country.code === activeCode.value);
        if (!currentStillAvailable) {
            activeCode.value = firstSelected?.code || mapCountries.value[0]?.code || "";
        }
        if (pointerSelection && !props.readonly) return;
        const modeChanged = value[0] !== previous?.[0];
        if (props.mode === "world" && (modeChanged || props.readonly)) resetMap();
        else if (props.readonly || props.mode === "continents" || (props.mode === "country" && selected.value.size === 1) || (props.mode === "custom" && modeChanged)) {
            if (selected.value.size) fitSelection();
            else if (props.readonly) resetMap();
        }
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
    position: relative;
    height: clamp(210px, 24vw, 280px);
    overflow: hidden;
    border: 1px solid #41483c;
    border-radius: 12px;
    background: radial-gradient(ellipse at 48% 40%, #2b342d 0%, #1c221f 64%, #181c1a 100%);
    box-shadow: inset 0 0 40px #10151160;
}
.map-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 28px #11171155;
    pointer-events: none;
}
.map-canvas {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    /* One-finger vertical page scroll remains native; two fingers can pinch. */
    touch-action: pan-y;
}
.map-backdrop {
    fill: #374037;
    pointer-events: none;
}
.map-grid {
    fill: none;
    stroke: #a0b295;
    stroke-width: 0.6;
    stroke-dasharray: 2 6;
    opacity: 0.16;
    pointer-events: none;
}
.map-country {
    cursor: pointer;
    outline: none;
}
.map-country path {
    fill: #68795d;
    stroke: #252e25;
    stroke-width: 0.65;
    stroke-linejoin: round;
}
.map-country.is-selected path {
    fill: #b6e388;
    stroke: #698b51;
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
.is-dragging .map-canvas,
.is-dragging .map-country {
    cursor: grabbing;
}
.is-readonly .map-canvas,
.is-disabled .map-canvas {
    touch-action: auto;
    cursor: default;
}
.is-readonly .map-country {
    pointer-events: none;
}
.is-readonly .map-stage {
    height: clamp(128px, 15vw, 190px);
}
.is-readonly figcaption {
    margin-top: 0.35rem;
}
.map-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    min-width: 0;
    margin-top: 0.35rem;
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
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 100%;
    gap: 0.2rem;
    margin-left: auto;
}
.map-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0.35rem 0.5rem;
    border: 1px solid #41483c;
    border-radius: 8px;
    background: #242b24;
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
.map-zoom {
    padding: 0;
    font-size: 1.25rem;
    font-weight: 400;
}
.map-hint {
    margin: 0.3rem 0 0.1rem;
    color: var(--gb-muted);
    font-size: 0.7rem;
    line-height: 1.45;
    text-wrap: pretty;
}
.map-touch-hint {
    display: none;
}
@media (pointer: coarse) {
    .map-desktop-hint {
        display: none;
    }
    .map-touch-hint {
        display: inline;
    }
}
figcaption {
    color: var(--gb-muted);
    font-size: 0.7rem;
    line-height: 1.45;
    text-wrap: pretty;
}
@media (max-width: 760px) {
    .map-hover {
        display: none;
    }
    .map-actions {
        position: relative;
        gap: 0;
        flex-wrap: nowrap;
    }
    .map-actions::before {
        content: "";
        position: absolute;
        inset: 6px 0;
        border: 1px solid #41483c;
        border-radius: 7px;
        background: #242b24;
        pointer-events: none;
    }
    .map-control {
        position: relative;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 7px;
        background: transparent;
        font-size: 12px;
    }
    .map-control:enabled:hover {
        background: transparent;
        color: var(--gb-accent);
    }
    .map-control:focus-visible {
        outline-offset: -2px;
    }
    .map-zoom {
        font-size: 18px;
    }
    .map-reset svg {
        width: 16px;
        height: 16px;
    }
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
    .map-toolbar {
        flex-wrap: wrap;
    }
    .map-actions {
        margin-left: auto;
    }
}
</style>
