import type { CountryViewport } from "./countryViewport";

/** Pure one-shot ownership; no SDK objects, timers or listeners. */
export const createGameplayFrame = () => {
    type Frame = { key: string; bounds: CountryViewport | null; isCurrent: () => boolean };
    let pending: Frame | null = null;
    let appliedKey: string | null = null;
    return {
        request(key: string, bounds: CountryViewport | null, isCurrent: () => boolean) {
            if (!isCurrent() || key === appliedKey) return false;
            pending = { key, bounds, isCurrent };
            return true;
        },
        apply(visible: boolean, frame: (bounds: CountryViewport | null) => void) {
            const current = pending;
            if (!current) return false;
            if (!current.isCurrent()) {
                pending = null;
                return false;
            }
            if (!visible) return false;
            frame(current.bounds);
            if (pending === current) {
                appliedKey = current.key;
                pending = null;
            }
            return true;
        },
        // Cleanup invalidates deferred work, not a healthy same-round camera.
        clear() {
            pending = null;
        },
        reset() {
            pending = null;
            appliedKey = null;
        },
    };
};
