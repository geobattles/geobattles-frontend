/** Presentation follows the server-derived deadline; reconnects never reset it. */
export function useTimer() {
    const { lobbySettings, rejoinTimer, roundDeadline } = useLobbyState();
    const fullRoundTime = computed(() => lobbySettings.value?.conf.roundTime ?? 0);
    const roundTime = computed(() => rejoinTimer.value ?? fullRoundTime.value);
    const countdown = ref(0);
    const countdownColor = computed(() => (countdown.value <= 15 ? "var(--gb-coral)" : "var(--gb-accent)"));
    const knobSize = ref(64);
    let mounted = false;
    let audio: AudioContext | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let previousSecond = -1;
    const playTickSound = ({ isLastTick = false }: { isLastTick?: boolean } = {}) => {
        if (!mounted || document.hidden) return;
        try {
            audio ??= new AudioContext();
            if (audio.state !== "running") return;
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.frequency.setValueAtTime(isLastTick ? 440 : 800, audio.currentTime);
            gain.gain.setValueAtTime(0.06, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + (isLastTick ? 0.6 : 0.1));
            oscillator.start();
            oscillator.stop(audio.currentTime + (isLastTick ? 0.6 : 0.1));
        } catch {
            console.warn("Timer audio is unavailable in this browser.");
        }
    };
    const update = () => {
        const deadline = roundDeadline.value;
        countdown.value = deadline === null ? 0 : Math.min(Math.max(0, fullRoundTime.value), Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        const threshold = fullRoundTime.value <= 20 ? 10 : 15;
        if (countdown.value > 0 && countdown.value <= threshold && previousSecond !== countdown.value) playTickSound();
        previousSecond = countdown.value;
        if (!countdown.value) {
            clearInterval(timer);
            timer = undefined;
        }
    };
    const initialize = () => {
        if (!mounted) return;
        clearInterval(timer);
        update();
        if (countdown.value > 0) timer = setInterval(update, 250);
    };
    watch(roundDeadline, initialize);
    const onVisible = () => {
        if (!document.hidden) initialize();
    };
    onMounted(() => {
        mounted = true;
        initialize();
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("pageshow", initialize);
    });
    onBeforeUnmount(() => {
        mounted = false;
        clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("pageshow", initialize);
        if (audio) void audio.close().catch(() => console.warn("Timer audio cleanup failed."));
    });
    return {
        countdown,
        fullRoundTime,
        roundTime,
        countdownColor,
        knobSize,
        valueTemplate: (value: number) => `${value}s`,
        playRoundFinishSound: () => playTickSound({ isLastTick: true }),
    };
}
