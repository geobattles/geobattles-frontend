import type { RequestError } from "~/composables/requestState";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

// Serializable presentation only. The client plugin owns sockets/promises/timers.
export const useSocketState = () => ({
    connectionState: useState<ConnectionState>("socket:state", () => "disconnected"),
    isOnline: useState("socket:online", () => true),
    recoveryDeadline: useState<number | null>("socket:recoveryDeadline", () => null),
    recoverySecondsRemaining: useState("socket:recoverySecondsRemaining", () => 0),
    retryAttempt: useState("socket:retryAttempt", () => 0),
    nextRetryAt: useState<number | null>("socket:nextRetryAt", () => null),
    connectionError: useState<RequestError | null>("socket:error", () => null),
});
