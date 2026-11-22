export interface RequestError {
    requestId?: string;
    gameId?: string;
    round?: number;
    command: string;
    code: string;
    message: string;
}

export const useRequestState = () => {
    const requestError = useState<RequestError | null>("request:error", () => null);
    const isStartPending = useState("request:startPending", () => false);
    const readyTarget = useState<boolean | null>("request:readyTarget", () => null);
    const isReadyPending = computed(() => readyTarget.value !== null);
    const { isGuessPending } = useBattleRoyaleState();
    const clearError = () => {
        requestError.value = null;
    };
    const resetPending = () => {
        isStartPending.value = false;
        isGuessPending.value = false;
        readyTarget.value = null;
    };
    const fail = (error: RequestError) => {
        requestError.value = error;
        // Feedback is not a global cancellation. Ordered server replies settle
        // only their command; connection/phase teardown uses resetPending.
        if (error.command === "start") isStartPending.value = false;
        if (error.command === "submit_location") isGuessPending.value = false;
        if (error.command === "setReady") readyTarget.value = null;
    };
    const acknowledgeReady = (ready: boolean | undefined) => {
        if (ready !== undefined && readyTarget.value === ready) readyTarget.value = null;
    };
    return reactive({ requestError, isStartPending, isReadyPending, readyTarget, acknowledgeReady, clearError, resetPending, fail });
};
