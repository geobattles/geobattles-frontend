<template>
    <div class="country-filters">
        <button
            ref="trigger"
            class="picker-tool filter-trigger"
            type="button"
            :disabled="disabled"
            :aria-label="activeCount ? `Filters (${activeCount} active)` : 'Filters'"
            :aria-expanded="open"
            :aria-controls="id"
            @click="toggle"
        >
            <UiIcon name="settings" />
            <span>Filters</span>
            <b v-if="activeCount" aria-hidden="true">{{ activeCount }}</b>
        </button>
        <div
            :id="id"
            ref="panel"
            class="filter-popover"
            popover="auto"
            role="group"
            aria-label="Country filters"
            :style="position"
            @toggle="syncOpen"
            @keydown.esc.stop.prevent="close"
        >
            <div class="filter-heading">
                <strong>Filters</strong>
                <button type="button" class="picker-tool" aria-label="Close filters" @click="close"><UiIcon name="close" /></button>
            </div>
            <div v-if="!single" class="filter-view" role="group" aria-label="Show countries">
                <button type="button" :aria-pressed="!selectedOnly" @click="selectedOnly = false">All countries</button>
                <button type="button" :aria-pressed="selectedOnly" @click="selectedOnly = true">Selected only</button>
            </div>
            <label class="filter-sort">
                <span>Sort by</span>
                <select v-model="sortBy" class="input" aria-label="Sort by">
                    <option value="name">Country name</option>
                    <option value="code">ISO code</option>
                </select>
            </label>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ single: boolean; disabled: boolean; hasRegion: boolean }>();
const emit = defineEmits<{ opening: [] }>();
const selectedOnly = defineModel<boolean>("selectedOnly", { required: true });
const sortBy = defineModel<"name" | "code">("sortBy", { required: true });
const id = useId();
const trigger = useTemplateRef("trigger");
const panel = useTemplateRef("panel");
const open = ref(false);
const position = shallowRef<Record<string, string>>({});
const { measurements } = useMobileViewport();
const activeCount = computed(() => Number(props.hasRegion) + Number(!props.single && selectedOnly.value) + Number(sortBy.value !== "name"));

function place() {
    const anchor = trigger.value?.getBoundingClientRect();
    if (!anchor?.width || !panel.value) {
        panel.value?.hidePopover();
        return;
    }
    const view = measurements.value;
    if (!view) return;
    const { left, top, width, height } = view.usable;
    const gap = 8;
    const panelWidth = Math.min(268, width - 2 * gap);
    const anchorTop = Math.min(anchor.top, top + height);
    const anchorBottom = Math.max(anchor.bottom, top);
    const above = anchorTop - top - 2 * gap;
    const below = top + height - anchorBottom - 2 * gap;
    const overlay = Math.max(above, below) < 96;
    const useBelow = below >= Math.min(panel.value.scrollHeight, 250) || below >= above;
    position.value = {
        width: `${panelWidth}px`,
        left: `${Math.max(left + gap, Math.min(anchor.right - panelWidth, left + width - panelWidth - gap))}px`,
        top: overlay ? `${top + gap}px` : useBelow ? `${anchorBottom + gap}px` : "auto",
        bottom: overlay || useBelow ? "auto" : `${view.layoutHeight - anchorTop + gap}px`,
        maxHeight: `${Math.max(0, overlay ? height - 2 * gap : useBelow ? below : above)}px`,
    };
}

async function toggle() {
    if (!panel.value || props.disabled) return;
    if (panel.value.matches(":popover-open")) {
        close();
        return;
    }
    emit("opening");
    panel.value.showPopover();
    open.value = true;
    place();
    await nextTick();
    panel.value.querySelector<HTMLElement>(".filter-view button[aria-pressed='true'], select")?.focus({ preventScroll: true });
}

function syncOpen() {
    open.value = panel.value?.matches(":popover-open") ?? false;
}

function close() {
    panel.value?.hidePopover();
    trigger.value?.focus({ preventScroll: true });
}

watch(
    [open, measurements],
    ([shown]) => {
        if (shown) place();
    },
    { flush: "post" }
);
watch(open, (shown, _previous, onCleanup) => {
    if (!shown) return;
    const area = trigger.value?.closest("[data-viewport-scroll]");
    area?.addEventListener("scroll", place, { passive: true });
    onCleanup(() => area?.removeEventListener("scroll", place));
});
watch(
    () => props.disabled,
    (disabled) => {
        if (disabled) panel.value?.hidePopover();
    }
);
</script>

<style scoped>
.picker-tool,
.filter-view button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.25rem 0.6rem;
    border: 1px solid var(--picker-line);
    border-radius: 0.65rem;
    background: linear-gradient(145deg, #92e6c41a, #082e2a);
    color: #e9faf4;
    font-weight: 700;
    font-size: 0.78rem;
}
.picker-tool:enabled:hover,
.filter-view button:enabled:hover,
.filter-view button[aria-pressed="true"] {
    border-color: #bcea946b;
    background: #23523f;
    color: #e6ffc9;
}
.picker-tool .ui-icon {
    width: 1.05rem;
    flex: none;
}
.filter-trigger b {
    min-width: 1.1rem;
    padding: 0.04rem 0.2rem;
    border-radius: 1rem;
    background: #c7f78d;
    color: #103424;
    font: 750 0.68rem/1.4 var(--gb-font-display);
}
.filter-popover {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 0.55rem;
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid #81bca684;
    border-radius: 0.85rem;
    background: linear-gradient(145deg, #16423a, #092823 78%);
    color: #effbf7;
    box-shadow: 0 12px 32px #0008;
}
.filter-popover:popover-open {
    display: grid;
    gap: 0.5rem;
    animation: filter-in 150ms ease-out;
}
.filter-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding-inline-start: 0.25rem;
}
.filter-heading .picker-tool {
    padding: 0;
}
.filter-view {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.3rem;
}
.filter-sort {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.6rem;
    padding-inline-start: 0.25rem;
    color: #c7ddd5;
    font-size: 0.8rem;
}
.filter-sort select {
    width: 100%;
    min-height: 44px;
    border-radius: 0.55rem;
    font-size: 16px;
}
@keyframes filter-in {
    from {
        opacity: 0.5;
        transform: translateY(3px);
    }
}
@container (max-width: 385px) {
    .filter-trigger > span {
        display: none;
    }
    .filter-trigger:not(:has(b)) {
        padding: 0;
    }
}
</style>
