const EXPIRY_PULSE_MS = 320;

/** Sample the existing deadline for both the guess controls and the timer artwork. */
export function useTimer(active: () => boolean, draw: (remainingMs: number, expiryProgress: number) => void) {
    const { lobbySettings, roundDeadline } = useLobbyState();
    const fullRoundTime = computed(() => lobbySettings.value?.conf.roundTime ?? 0);
    const countdown = ref(0);
    let motion: MediaQueryList | undefined;
    let audio: AudioContext | null = null;
    let frame: number | undefined;
    let tick: number | undefined;
    let lastPaint = 0;
    const playTickSound = () => {
        try {
            audio ??= new AudioContext();
            if (audio.state !== "running") return;
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.frequency.setValueAtTime(800, audio.currentTime);
            gain.gain.setValueAtTime(0.06, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audio.currentTime + 0.1);
        } catch {
            console.warn("Timer audio is unavailable in this browser.");
        }
    };
    const cancelSample = () => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        window.clearTimeout(tick);
        frame = tick = undefined;
    };
    const sample = (scheduled: boolean) => {
        if (document.hidden) return;
        const deadline = roundDeadline.value;
        if (!active() || deadline === null) {
            countdown.value = 0;
            draw(0, 1);
            return;
        }

        const timeToDeadline = deadline - Date.now();
        const remainingMs = Math.max(0, Math.min(fullRoundTime.value * 1000, timeToDeadline));
        const seconds = Math.ceil(remainingMs / 1000);
        const previous = countdown.value;
        if (seconds !== previous) {
            countdown.value = seconds;
            const audibleThreshold = fullRoundTime.value <= 20 ? 10 : 15;
            if (scheduled && previous === seconds + 1 && seconds > 0 && seconds <= audibleThreshold) playTickSound();
        }
        const expiryProgress = Math.min(1, Math.max(0, -timeToDeadline / EXPIRY_PULSE_MS));
        const animate = !motion?.matches;
        const now = performance.now();
        // CSS variables stay on the retained timer element. Vue updates at second boundaries.
        if (!scheduled || seconds !== previous || expiryProgress === 1 || now - lastPaint >= (seconds > 10 ? 32 : 15)) {
            draw(remainingMs, expiryProgress);
            lastPaint = now;
        }

        if (animate && (remainingMs > 0 || expiryProgress < 1)) frame = requestAnimationFrame(() => sample(true));
        else if (remainingMs > 0) tick = window.setTimeout(() => sample(true), timeToDeadline - (seconds - 1) * 1000);
    };
    const synchronize = () => {
        if (!motion) return;
        cancelSample();
        sample(false);
    };
    watch([roundDeadline, fullRoundTime, active], synchronize, { flush: "post" });
    onMounted(() => {
        motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        motion.addEventListener("change", synchronize);
        document.addEventListener("visibilitychange", synchronize);
        window.addEventListener("pageshow", synchronize);
        window.addEventListener("pagehide", cancelSample);
        synchronize();
    });
    onBeforeUnmount(() => {
        cancelSample();
        motion?.removeEventListener("change", synchronize);
        document.removeEventListener("visibilitychange", synchronize);
        window.removeEventListener("pageshow", synchronize);
        window.removeEventListener("pagehide", cancelSample);
        if (audio) void audio.close().catch(() => console.warn("Timer audio cleanup failed."));
    });
    return { countdown, fullRoundTime };
}
