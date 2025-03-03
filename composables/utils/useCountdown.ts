export function useCountdown(initialValue: number) {
    const counter = ref<number>(initialValue);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startCountdown = () => {
        intervalId = setInterval(() => {
            if (counter.value > 1) {
                counter.value--;
            } else {
                clearInterval(intervalId!); // Stop countdown when it reaches 0
                intervalId = null;
            }
        }, 1000);
    };

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId); // Cleanup interval on unmount
    });

    return {
        counter,
        startCountdown,
    };
}
