import type { Ref } from "vue";
import { ROUND_COUNTDOWN_MS } from "~/runtime/roundClock";

export const useCountdown = (remainingTime: () => number, surface: Readonly<Ref<HTMLElement | null>>) => {
    const seconds = ref(Math.ceil(remainingTime() / 1000));
    const light = ref(false);
    let stop: (() => void) | undefined;

    onMounted(() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const compact = window.matchMedia("(pointer: coarse), (max-width: 850px), (max-height: 520px)");
        let frame: number | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const cancel = () => {
            if (frame !== undefined) cancelAnimationFrame(frame);
            clearTimeout(timer);
        };
        const sample = () => {
            if (document.hidden) return;
            const remaining = remainingTime();
            const nextSecond = Math.ceil(remaining / 1000);
            if (seconds.value !== nextSecond) seconds.value = nextSecond;

            if (light.value || reducedMotion.matches) {
                if (remaining > 0) timer = setTimeout(sample, Math.ceil(remaining - (nextSecond - 1) * 1000));
                return;
            }
            const beat = remaining > 0 ? nextSecond - remaining / 1000 : 1;
            surface.value?.style.setProperty("--countdown-beat", String(beat));
            surface.value?.style.setProperty("--countdown-progress", String(1 - remaining / ROUND_COUNTDOWN_MS));
            if (remaining > 0) frame = requestAnimationFrame(sample);
        };
        const synchronize = () => {
            cancel();
            light.value = compact.matches;
            if (light.value) {
                const remaining = remainingTime();
                const elapsedBeat = Math.ceil(remaining / 1000) - remaining / 1000;
                surface.value?.style.setProperty("--countdown-delay", `-${elapsedBeat}s`);
            }
            sample();
        };
        compact.addEventListener("change", synchronize);
        reducedMotion.addEventListener("change", synchronize);
        document.addEventListener("visibilitychange", synchronize);
        window.addEventListener("pageshow", synchronize);
        synchronize();
        stop = () => {
            cancel();
            compact.removeEventListener("change", synchronize);
            reducedMotion.removeEventListener("change", synchronize);
            document.removeEventListener("visibilitychange", synchronize);
            window.removeEventListener("pageshow", synchronize);
        };
    });
    onBeforeUnmount(() => stop?.());
    return { seconds, light };
};
