export function useViewportForm(root: Ref<HTMLElement | null>) {
    const { measurements, editable, heightReduction, zoomed } = useMobileViewport();
    const field = computed(() => (root.value?.contains(editable.value) ? editable.value : null));
    const visibleHeight = computed(() => measurements.value?.usable.height ?? Infinity);
    const editingHeightLoss = computed(() => {
        const view = measurements.value;
        if (!field.value || !view || (!view.coarsePointer && !view.keyboard)) return 0;
        return heightReduction.value;
    });

    watch(
        [field, visibleHeight, () => measurements.value?.usable.top, zoomed],
        ([input, , , isZoomed], _previous, onCleanup) => {
            if (!input || isZoomed) return;
            // Keep the same field and caret. Wait for the keyboard and layout to
            // settle before adjusting the closest opted-in scroll container.
            const timer = window.setTimeout(() => {
                if (field.value !== input || document.activeElement !== input) return;
                const area = input.closest<HTMLElement>("[data-viewport-scroll]");
                const view = measurements.value?.usable;
                if (!area || !view) return;
                const bounds = area.getBoundingClientRect();
                const header = area.querySelector<HTMLElement>("[data-viewport-sticky]");
                const top = Math.max(bounds.top, view.top, header?.getBoundingClientRect().bottom ?? 0) + 4;
                const bottom = Math.min(bounds.bottom, view.top + view.height) - 4;
                if (bottom <= top) return;
                const group = input.closest("[data-viewport-field]")?.getBoundingClientRect();
                const target = group && group.height <= bottom - top ? group : input.getBoundingClientRect();
                if (target.top < top) area.scrollTop -= top - target.top;
                else if (target.bottom > bottom) area.scrollTop += target.bottom - bottom;
            }, 100);
            onCleanup(() => window.clearTimeout(timer));
        },
        { flush: "post" }
    );

    return {
        field,
        visibleHeight,
        editingHeightLoss,
        landscape: computed(() => measurements.value?.orientation === "landscape"),
        finishEditing: () => field.value?.blur(),
    };
}
