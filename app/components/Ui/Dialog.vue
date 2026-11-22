<template>
    <dialog
        ref="dialog"
        class="ui-dialog"
        :class="{ 'ui-dialog-wide': wide }"
        :style="viewportStyle"
        :data-viewport-fit="viewportStyle ? true : undefined"
        data-viewport-scroll
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        @cancel="cancel"
        @close="closed"
        @click="backdrop"
        @pointerdown="rememberPointer"
    >
        <div v-if="mounted && open" class="ui-dialog-inner">
            <header class="ui-dialog-header" data-viewport-sticky>
                <div>
                    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
                    <h2 :id="titleId">{{ title }}</h2>
                </div>
                <button v-if="closable" class="btn btn-icon btn-quiet" type="button" aria-label="Close dialog" @click="close"><UiIcon name="close" /></button>
            </header>
            <p v-if="description" :id="descriptionId" class="muted mb-6">{{ description }}</p>
            <slot />
        </div>
    </dialog>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ open: boolean; title: string; description?: string; eyebrow?: string; wide?: boolean; closable?: boolean }>(), { closable: true });
const emit = defineEmits<{ "update:open": [value: boolean] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const mounted = ref(false);
const { editable } = useMobileViewport();
const viewportStyle = useViewportFit(() => props.open && (!editable.value || dialog.value?.contains(editable.value) === true));
const id = useId();
const titleId = `${id}-title`;
const descriptionId = `${id}-description`;
let previousFocus: HTMLElement | null = null;
let pointerOnBackdrop = false;
const close = () => emit("update:open", false);
const cancel = (event: Event) => {
    event.preventDefault();
    if (props.closable) close();
};
const closed = () => {
    if (dialog.value?.open) return;
    if (props.open) close();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
};
const rememberPointer = (event: PointerEvent) => {
    pointerOnBackdrop = event.target === dialog.value;
};
const backdrop = (event: MouseEvent) => {
    const element = dialog.value;
    if (!element || !props.closable || !pointerOnBackdrop || event.target !== element) return;
    const rect = element.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
};
const sync = async () => {
    await nextTick();
    if (!mounted.value || !dialog.value) return;
    if (props.open && !dialog.value.open) {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.value.showModal();
    } else if (!props.open && dialog.value.open) dialog.value.close();
};
watch(() => props.open, sync);
onMounted(() => {
    mounted.value = true;
    void sync();
});
onBeforeUnmount(() => {
    mounted.value = false;
    dialog.value?.close();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
});
</script>
