type Orientation = "portrait" | "landscape";
type DisplayMode = "browser" | "standalone" | "fullscreen" | "minimal-ui" | "window-controls-overlay";

interface ViewportRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface ViewportMeasurements {
    layoutWidth: number;
    layoutHeight: number;
    visual: ViewportRect;
    usable: ViewportRect;
    scale: number;
    orientation: Orientation;
    displayMode: DisplayMode;
    elementFullscreen: boolean;
    mobile: boolean;
    coarsePointer: boolean;
    restHeight: number | undefined;
    keyboard: ViewportRect | undefined;
}

const textInputTypes = new Set(["text", "search", "email", "password", "tel", "url", "number"]);

function activeEditable() {
    const field = document.activeElement;
    if (!(field instanceof HTMLElement) || field.inputMode === "none" || field.matches(":disabled")) return null;
    if (field instanceof HTMLInputElement) return !field.readOnly && textInputTypes.has(field.type) ? field : null;
    if (field instanceof HTMLTextAreaElement) return field.readOnly ? null : field;
    return field.isContentEditable ? field : null;
}

function keyboardAdjustedRect(visual: ViewportRect, keyboard?: ViewportRect): ViewportRect {
    if (!keyboard) return visual;
    // A floating or split keyboard does not define a new rectangular viewport.
    const bottom = visual.top + visual.height;
    const docked =
        keyboard.left <= visual.left + 2 &&
        keyboard.left + keyboard.width >= visual.left + visual.width - 2 &&
        keyboard.top > visual.top &&
        keyboard.top < bottom &&
        keyboard.top + keyboard.height >= bottom - 2;
    return docked ? { ...visual, height: keyboard.top - visual.top } : visual;
}

function viewportState() {
    const measurements = shallowRef<ViewportMeasurements>();
    const editable = shallowRef<HTMLElement | null>(null);
    return { measurements, editable };
}

const key: InjectionKey<ReturnType<typeof viewportState>> = Symbol("mobile viewport");

export function provideMobileViewport() {
    const state = viewportState();
    provide(key, state);
    let stop: (() => void) | undefined;

    onMounted(() => {
        const viewport = window.visualViewport;
        const coarsePointer = window.matchMedia("(pointer: coarse)");
        const narrow = window.matchMedia("(max-width: 760px)");
        const landscape = window.matchMedia("(orientation: landscape)");
        const screenOrientation = window.screen.orientation;
        const navigation = navigator as Navigator & {
            standalone?: boolean;
            virtualKeyboard?: EventTarget & { boundingRect?: DOMRectReadOnly };
        };
        const keyboardApi = navigation.virtualKeyboard;
        const modeQueries = (["fullscreen", "window-controls-overlay", "standalone", "minimal-ui"] as const).map(
            (mode) => [mode, window.matchMedia(`(display-mode: ${mode})`)] as const
        );

        const rest = new Map<Orientation, { width: number; height: number; mode: DisplayMode }>();
        let frame = 0;
        let settle = 0;
        let angle = screenOrientation?.angle;
        let lastEdit = -Infinity;

        const measure = () => {
            frame = 0;
            const layoutWidth = window.innerWidth;
            const layoutHeight = window.innerHeight;
            const scale = viewport?.scale || 1;
            const visual =
                viewport && viewport.width > 0 && viewport.height > 0
                    ? { left: viewport.offsetLeft, top: viewport.offsetTop, width: viewport.width, height: viewport.height }
                    : { left: 0, top: 0, width: layoutWidth, height: layoutHeight };
            const bounds = keyboardApi?.boundingRect;
            const keyboard = bounds && bounds.width > 0 && bounds.height > 0 ? { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height } : undefined;
            const usable = keyboardAdjustedRect(visual, keyboard);
            const elementFullscreen = Boolean(document.fullscreenElement);
            const displayMode = elementFullscreen ? "fullscreen" : (modeQueries.find(([, query]) => query.matches)?.[0] ?? (navigation.standalone ? "standalone" : "browser"));
            const editable = activeEditable();
            const now = performance.now();
            if (editable) lastEdit = now;
            const rotated = angle !== screenOrientation?.angle;
            angle = screenOrientation?.angle;
            const previous = state.measurements.value;
            const sameWidth = previous && Math.abs(layoutWidth - previous.layoutWidth) <= 2 && previous.displayMode === displayMode;
            // Resizing both viewports can change the CSS orientation while typing.
            // Retain the previous orientation as the keyboard retracts after blur.
            const orientation =
                coarsePointer.matches && !rotated && sameWidth && now - lastEdit < 350 && layoutHeight < (previous.restHeight ?? previous.layoutHeight) - 48
                    ? previous.orientation
                    : landscape.matches
                      ? "landscape"
                      : "portrait";
            const baseline = rest.get(orientation);
            const canMeasureRest = !editable && !keyboard && Math.abs(scale - 1) <= 0.02 && Math.abs(layoutHeight - visual.height) <= 2;
            if (!baseline && canMeasureRest && now - lastEdit >= 350) rest.set(orientation, { width: layoutWidth, height: visual.height, mode: displayMode });
            const resting = rest.get(orientation);
            const restHeight = resting && Math.abs(layoutWidth - resting.width) <= 2 && resting.mode === displayMode ? resting.height : undefined;
            state.measurements.value = {
                layoutWidth,
                layoutHeight,
                scale,
                visual,
                usable,
                orientation,
                displayMode,
                elementFullscreen,
                mobile: narrow.matches || coarsePointer.matches,
                coarsePointer: coarsePointer.matches,
                restHeight,
                keyboard,
            };
            state.editable.value = editable;

            // Capture the unoccluded height after toolbar or keyboard animation settles.
            // Keep a separate measurement for each orientation when both viewports resize.
            window.clearTimeout(settle);
            if (canMeasureRest && restHeight !== visual.height) {
                settle = window.setTimeout(() => {
                    rest.set(orientation, { width: layoutWidth, height: visual.height, mode: displayMode });
                    schedule();
                }, 350);
            }
        };
        const schedule = () => {
            if (!frame) frame = window.requestAnimationFrame(measure);
        };
        const subscriptions: [EventTarget | null | undefined, string][] = [
            [viewport, "resize"],
            [viewport, "scroll"],
            [window, "resize"],
            [window, "pageshow"],
            [document, "focusin"],
            [document, "focusout"],
            [document, "fullscreenchange"],
            [document, "visibilitychange"],
            [coarsePointer, "change"],
            [narrow, "change"],
            [landscape, "change"],
            [screenOrientation, "change"],
            [keyboardApi, "geometrychange"],
            ...modeQueries.map(([, query]): [EventTarget, string] => [query, "change"]),
        ];
        for (const [source, event] of subscriptions) source?.addEventListener(event, schedule);
        measure();
        stop = () => {
            for (const [source, event] of subscriptions) source?.removeEventListener(event, schedule);
            window.cancelAnimationFrame(frame);
            window.clearTimeout(settle);
        };
    });
    onBeforeUnmount(() => stop?.());
    return computed(() => state.measurements.value);
}

export function useMobileViewport() {
    const state = inject(key);
    if (!state) throw new Error("Mobile viewport provider is missing.");
    const measurements = computed(() => state.measurements.value);
    const editable = computed(() => state.editable.value);
    const zoomed = computed(() => Math.abs((measurements.value?.scale ?? 1) - 1) > 0.02);
    const heightReduction = computed(() => {
        const view = measurements.value;
        return view && !zoomed.value ? Math.max(0, view.layoutHeight - view.usable.height, (view.restHeight ?? 0) - view.usable.height) : 0;
    });
    return { measurements, editable, zoomed, heightReduction };
}

// Apply these values to a surface that needs to fit inside the visible rectangle.
// Let the browser pan freely during zoom.
export function useViewportFit(enabled: () => boolean = () => true) {
    const { measurements, zoomed } = useMobileViewport();
    return computed(() => {
        const view = measurements.value;
        if (!enabled() || !view || zoomed.value) return undefined;
        const top = Math.max(0, view.usable.top);
        const bottom = Math.max(0, view.layoutHeight - top - view.usable.height);
        if (top + bottom <= 2) return undefined;
        return { "--visible-top": `${top}px`, "--visible-bottom": `${bottom}px`, "--visible-height": `${view.usable.height}px` };
    });
}
