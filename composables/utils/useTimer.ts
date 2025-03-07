// Timer configuration constants
const TIMER_CONFIG = {
    DEFAULT_SOUND_THRESHOLD: 15,
    SHORT_ROUND_THRESHOLD: 20,
    SHORT_ROUND_SOUND_THRESHOLD: 10,
    LARGE_SCREEN_SIZE: 1024,
    LARGE_KNOB_SIZE: 80,
    SMALL_KNOB_SIZE: 50,
};

type TimerSound = {
    isLastTick?: boolean;
};

export function useTimer() {
    const { lobbySettings } = useLobbyStore();
    const screenWidth = ref(window.innerWidth);
    const roundTime = computed(() => lobbySettings?.conf.roundTime ?? 0);
    const countdown = ref(roundTime.value);
    const timerSoundThreshold = ref(roundTime.value <= TIMER_CONFIG.SHORT_ROUND_THRESHOLD ? TIMER_CONFIG.SHORT_ROUND_SOUND_THRESHOLD : TIMER_CONFIG.DEFAULT_SOUND_THRESHOLD);
    const countdownColor = ref("var(--p-primary-500)");

    // Computed properties
    const knobSize = computed(() => (screenWidth.value > TIMER_CONFIG.LARGE_SCREEN_SIZE ? TIMER_CONFIG.LARGE_KNOB_SIZE : TIMER_CONFIG.SMALL_KNOB_SIZE));

    // Audio Context for Web Audio API
    let audioContext: AudioContext | null = null;
    let intervalSound: ReturnType<typeof setInterval>;
    let intervalCountdown: ReturnType<typeof setInterval>;
    let timeoutSound: ReturnType<typeof setTimeout>;

    /**
     * Plays a tick sound using Web Audio API
     */
    function playTickSound({ isLastTick = false }: TimerSound = {}) {
        try {
            // Lazy initialize audio context (needs user interaction)
            if (!audioContext) {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (isLastTick) {
                // Final timer sound - clear game-ending tone
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.3); // A4 note
                oscillator.frequency.linearRampToValueAtTime(330, audioContext.currentTime + 0.8); // E4 note

                gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 1.0);
            } else {
                // Regular tick sound
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        } catch (error) {
            console.error("Error playing tick sound:", error);
        }
    }

    /**
     * Sets up and starts the countdown timer
     */
    function initializeTimer() {
        if (!lobbySettings?.conf.roundTime) {
            console.error("Lobby settings or round time are not set!");
            return;
        }

        // Start countdown
        const startTime = Date.now();
        intervalCountdown = setInterval(() => {
            countdown.value = Math.max(roundTime.value - Math.floor((Date.now() - startTime) / 1000), 0);
        }, 1000);

        // Start sound timer
        const delayBeforeSound = (roundTime.value - timerSoundThreshold.value) * 1000;
        timeoutSound = setTimeout(() => {
            countdownColor.value = "var(--p-red-600)";
            intervalSound = setInterval(() => {
                if (countdown.value > 0) {
                    playTickSound();
                }
            }, 1000);
        }, delayBeforeSound);
    }

    const handleResize = () => (screenWidth.value = window.innerWidth);

    onMounted(() => {
        initializeTimer();
        // Handle window resize
        window.addEventListener("resize", handleResize);
    });

    onUnmounted(() => {
        clearTimeout(timeoutSound);
        clearInterval(intervalSound);
        clearInterval(intervalCountdown);
        window.removeEventListener("resize", handleResize);

        // Clean up audio context
        if (audioContext) {
            audioContext.close().catch(console.error);
        }
    });

    return {
        countdown,
        roundTime,
        countdownColor,
        knobSize,
        valueTemplate: (value: number) => `${value}s`,
        playRoundFinishSound: () => playTickSound({ isLastTick: true }),
    };
}
