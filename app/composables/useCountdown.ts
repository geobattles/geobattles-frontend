import type { Ref } from "vue";
import { ROUND_COUNTDOWN_MS } from "~/runtime/roundClock";

export const useCountdown = (remainingTime: () => number, surface: Readonly<Ref<HTMLElement | null>>) => {
    const seconds = ref(Math.ceil(remainingTime() / 1000));
    let frame: number | undefined;

    onMounted(() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sample = () => {
            const remaining = remainingTime();
            const nextSecond = Math.ceil(remaining / 1000);
            seconds.value = nextSecond;
            if (!reducedMotion.matches) {
                const beat = remaining > 0 ? nextSecond - remaining / 1000 : 1;
                surface.value?.style.setProperty("--countdown-beat", String(beat));
                surface.value?.style.setProperty("--countdown-progress", String(1 - remaining / ROUND_COUNTDOWN_MS));
            }
            if (remaining > 0) frame = requestAnimationFrame(sample);
        };
        sample();
    });

    onBeforeUnmount(() => {
        if (frame !== undefined) cancelAnimationFrame(frame);
    });
    return seconds;
};
