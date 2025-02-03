const DEFAULT_TIMER_SOUND_THRESHOLD = 10;
const SHORT_ROUND_THRESHOLD = 20;
const SHORT_ROUND_SOUND_THRESHOLD = 5;
const LARGE_SCREEN_SIZE = 1024;
const LARGE_KNOB_SIZE = 80;
const SMALL_KNOB_SIZE = 50;

export function useTimer() {
    const { lobbySettings } = useLobbyStore();
    const screenWidth = ref(window.innerWidth);
    const countdown = ref(lobbySettings?.conf.roundTime ?? 0);
    const timerSoundThreshold = ref(DEFAULT_TIMER_SOUND_THRESHOLD);
    const refSound = ref<HTMLAudioElement | null>(null);

    const roundTime = computed(() => lobbySettings?.conf.roundTime ?? 0);
    const countdownColor = ref("var(--p-primary-500)");
    const knobSize = computed(() => (screenWidth.value > LARGE_SCREEN_SIZE ? LARGE_KNOB_SIZE : SMALL_KNOB_SIZE));
    const valueTemplate = (value: number) => `${value}s`;

    function startCountdown() {
        const start = Date.now();
        return setInterval(() => {
            const delta = Date.now() - start;
            countdown.value = Math.max(roundTime.value - Math.floor(delta / 1000), 0);
        }, 1000);
    }

    function startSoundTimer() {
        timeoutSound = setTimeout(() => {
            intervalSound = setInterval(() => refSound.value?.play(), 1000);
            countdownColor.value = "var(--p-red-600)";
        }, (roundTime.value - timerSoundThreshold.value) * 1000);
    }

    function setupResizeListener() {
        const resizeListener = () => (screenWidth.value = window.innerWidth);
        window.addEventListener("resize", resizeListener);
        return resizeListener;
    }

    let intervalSound: ReturnType<typeof setInterval>;
    let intervalCountdown: ReturnType<typeof setInterval>;
    let timeoutSound: ReturnType<typeof setTimeout>;

    onMounted(() => {
        if (!lobbySettings || !lobbySettings.conf.roundTime) {
            console.error("Lobby settings or round time are not set!");
            return;
        }

        if (roundTime.value <= SHORT_ROUND_THRESHOLD) {
            timerSoundThreshold.value = SHORT_ROUND_SOUND_THRESHOLD;
        }

        startSoundTimer();
        intervalCountdown = startCountdown();

        const resizeListener = setupResizeListener();

        onUnmounted(() => {
            clearTimeout(timeoutSound);
            clearInterval(intervalSound);
            clearInterval(intervalCountdown);
            window.removeEventListener("resize", resizeListener);
        });
    });

    return {
        countdown,
        roundTime,
        countdownColor,
        knobSize,
        valueTemplate,
        refSound,
    };
}
