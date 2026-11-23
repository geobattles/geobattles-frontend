import type { RequestError } from "~/composables/requestState";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

// Serializable presentation only. The client plugin owns sockets/promises/timers.
export const useSocketState = () => ({
    connectionState: useState<ConnectionState>("socket:state", () => "disconnected"),
    isRestored: useState("socket:restored", () => false),
    isWeak: useState("socket:weak", () => false),
    isOnline: useState("socket:online", () => true),
    recoveryDeadline: useState<number | null>("socket:recoveryDeadline", () => null),
    recoverySecondsRemaining: useState("socket:recoverySecondsRemaining", () => 0),
    retryAttempt: useState("socket:retryAttempt", () => 0),
    nextRetryAt: useState<number | null>("socket:nextRetryAt", () => null),
    connectionError: useState<RequestError | null>("socket:error", () => null),
});

export type ConnectionNotice = "weak" | "offline" | "reconnecting" | "restored";

export function useConnectionNotice() {
    const { connectionState, isOnline, isWeak, isRestored } = useSocketState();
    return computed<ConnectionNotice | null>(() => {
        if (connectionState.value === "disconnected") return null;
        if (!isOnline.value) return "offline";
        if (connectionState.value === "reconnecting") return "reconnecting";
        if (isWeak.value) return "weak";
        return isRestored.value ? "restored" : null;
    });
}
