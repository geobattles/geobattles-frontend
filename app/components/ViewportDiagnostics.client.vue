<template>
    <Teleport v-if="enabled && target && view" :to="target">
        <details ref="panel" class="viewport-report" popover="manual" :style="fit" open>
            <summary>Viewport</summary>
            <dl>
                <dt>Layout</dt>
                <dd>{{ size(view.layoutWidth, view.layoutHeight) }}</dd>
                <dt>Visual</dt>
                <dd>{{ size(view.visual.width, view.visual.height) }}</dd>
                <dt>Visual offset</dt>
                <dd>{{ size(view.visual.left, view.visual.top) }}</dd>
                <dt>Usable</dt>
                <dd>{{ size(view.usable.width, view.usable.height) }}</dd>
                <dt>Scale</dt>
                <dd>{{ view.scale.toFixed(2) }}</dd>
                <dt>Orientation</dt>
                <dd>{{ view.orientation }}</dd>
                <dt>Display</dt>
                <dd>{{ view.displayMode }}</dd>
                <dt>Edited element</dt>
                <dd>{{ fieldType }}</dd>
                <dt>Height loss</dt>
                <dd>{{ Math.round(heightReduction) }}px</dd>
                <dt>Idle height</dt>
                <dd>{{ view.restHeight === undefined ? "Unknown" : `${Math.round(view.restHeight)}px` }}</dd>
                <dt>Keyboard bounds</dt>
                <dd>{{ view.keyboard ? size(view.keyboard.width, view.keyboard.height) : "Unreported" }}</dd>
                <dt>Safe T/R/B/L</dt>
                <dd>{{ safeArea }}</dd>
                <dt>App shell</dt>
                <dd>{{ shellSize }}</dd>
            </dl>
        </details>
    </Teleport>
</template>

<script setup lang="ts">
const route = useRoute();
const enabled = computed(() => route.query.viewport === "1");
const { measurements: view, editable, heightReduction } = useMobileViewport();
const fit = useViewportFit(() => enabled.value);
const panel = useTemplateRef("panel");
const target = shallowRef<HTMLElement>();
const shellSize = ref("—");
const safeArea = ref("—");
const size = (w: number, h: number) => `${Math.round(w)} × ${Math.round(h)}`;
const fieldType = computed(() => {
    const field = editable.value;
    return field instanceof HTMLInputElement ? `input/${field.type}` : (field?.localName ?? "None");
});

onMounted(() => {
    watch(
        [enabled, view],
        async ([show, current]) => {
            if (!show || !current) return;
            const host = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog:modal")).at(-1) ?? document.body;
            if (target.value !== host) {
                panel.value?.hidePopover();
                target.value = host;
            }
            await nextTick();
            if (!enabled.value || !panel.value?.isConnected) return;
            if (!panel.value.matches(":popover-open")) panel.value.showPopover();
            const shell = document.querySelector(".app-root")?.getBoundingClientRect();
            shellSize.value = shell ? size(shell.width, shell.height) : "—";
            const styles = getComputedStyle(document.documentElement);
            safeArea.value = ["top", "right", "bottom", "left"].map((edge) => styles.getPropertyValue(`--gb-safe-${edge}`).trim()).join(" / ");
        },
        { immediate: true, flush: "post" }
    );
});
</script>

<style scoped>
.viewport-report {
    position: fixed;
    inset: auto max(0.5rem, var(--gb-safe-right)) calc(var(--visible-bottom, 0px) + max(0.5rem, var(--gb-safe-bottom))) auto;
    width: min(16rem, calc(100% - var(--gb-safe-left) - var(--gb-safe-right) - 1rem));
    max-height: min(17rem, calc(var(--visible-height, var(--gb-viewport-height)) - 1rem));
    margin: 0;
    padding: 0.4rem 0.6rem;
    overflow: auto;
    border: 1px solid var(--gb-line);
    border-radius: 0.6rem;
    background: #0c1916f5;
    color: var(--gb-text);
    font: 0.72rem/1.4 var(--gb-font-mono);
}
.viewport-report summary {
    min-height: 28px;
    cursor: pointer;
    font-weight: 700;
}
.viewport-report dl {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.15rem 0.5rem;
    margin: 0;
}
.viewport-report dd {
    margin: 0;
    overflow-wrap: anywhere;
}
</style>
