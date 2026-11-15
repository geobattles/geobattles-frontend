export function useCountdown(initialValue: number) {
    const counter = ref<number>(initialValue);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startCountdown = () => {
        if (intervalId) clearInterval(intervalId);
        counter.value = initialValue;
        intervalId = setInterval(() => {
            if (counter.value > 1) {
                counter.value--;
            } else {
                counter.value = 0;
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
