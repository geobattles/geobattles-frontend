import { SocketStatus, SocketType, type GameSocketEvent, type SocketCommand } from "~/types/socketTypes";
import { decodeGameSocketEvent, decodeRequestError, decodeSocketFrame, socketEventContext, type SocketEnvelope } from "~/runtime/socketProtocol";
import type { useAuthStore } from "~/composables/auth";
import type { RequestError } from "~/composables/requestState";

export const createSocketRuntime = (
    endpoint: string,
    auth: ReturnType<typeof useAuthStore>,
    ports: {
        apply: (event: GameSocketEvent) => void;
        afterFrame: () => void;
        closeAttempt: () => void;
        invalidateViews: () => void;
        releaseSession: () => void;
    }
) => {
    const { connectionState, isOnline, recoveryDeadline, recoverySecondsRemaining, retryAttempt, nextRetryAt, connectionError } = useSocketState();
    const request = useRequestState();
    const player = usePlayerInfo();
    const recoveryBudget = 30_000;
    const maxAttempts = 12;
    const heartbeatTimeout = 10_000;
    const availabilityTimeout = 3_000;
    type Failure = RequestError & { terminal?: boolean };
    type Attempt = {
        generation: number;
        socket: WebSocket | null;
        admitted: boolean;
        identity: string | null;
        lastActivity: number;
        lastHeartbeatCheck: number;
        resumeUntil: number;
        wasHidden: boolean;
        lastSeq: number;
        availabilityCheck?: AbortController;
    };
    let lobbyId: string | null = null;
    let identity: string | null = null;
    let generation = 0;
    let sessionGeneration = 0;
    let disposed = false;
    let hasAdmitted = false;
    let attempt: Attempt | null = null;
    let readiness: Promise<void> | null = null;
    let resolveReadiness: (() => void) | undefined;
    let rejectReadiness: ((error: Error) => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let admissionTimer: ReturnType<typeof setTimeout> | undefined;
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let statusTimer: ReturnType<typeof setInterval> | undefined;
    const failure = (code: string, message: string, terminal = false): Failure => ({ command: "", code, message, terminal });
    const unavailable = () => failure("CONNECTION_FAILED", "The lobby connection is unavailable. Wait for reconnection before retrying.");
    const cancelled = () => new Error("Lobby connection was cancelled or expired.");
    const current = (owner: Attempt) => !disposed && attempt === owner && owner.generation === generation && (!owner.identity || owner.identity === player.value.ID);
    const waitForReadiness = () => {
        if (!readiness) {
            readiness = new Promise<void>((resolve, reject) => {
                resolveReadiness = resolve;
                rejectReadiness = reject;
            });
            // Recovery need not have an awaiting route/create/join caller.
            void readiness.catch(() => {});
        }
        return readiness;
    };
    const settleReadiness = (error?: Error) => {
        if (error) rejectReadiness?.(error);
        else resolveReadiness?.();
        readiness = null;
        resolveReadiness = rejectReadiness = undefined;
    };
    const clearRetry = () => {
        clearTimeout(retryTimer);
        retryTimer = undefined;
        nextRetryAt.value = null;
    };
    const clearAttempt = (intentional = false) => {
        const previous = attempt;
        attempt = null;
        generation++;
        clearTimeout(admissionTimer);
        clearInterval(heartbeatTimer);
        admissionTimer = heartbeatTimer = undefined;
        ports.closeAttempt();
        previous?.availabilityCheck?.abort();
        const socket = previous?.socket;
        if (!socket) return;
        // Only a committed leave/logout sends this membership-removing command.
        // A close code, offline event, HMR or expiry never means intentional leave.
        if (intentional && socket.readyState === WebSocket.OPEN) {
            try {
                socket.send(JSON.stringify({ command: "disconnect" }));
            } catch {
                // Local release is still required; sending is not a server ACK.
            }
        }
        socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
        try {
            socket.close();
        } catch {
            // CONNECTING/closing transports must not prevent local disposal.
        }
    };
    const clearBudget = () => {
        clearTimeout(deadlineTimer);
        clearInterval(statusTimer);
        deadlineTimer = statusTimer = undefined;
        recoveryDeadline.value = null;
        recoverySecondsRemaining.value = 0;
    };
    const disconnect = (intentional = false) => {
        sessionGeneration++;
        clearRetry();
        clearBudget();
        clearAttempt(intentional);
        settleReadiness(cancelled());
        ports.invalidateViews();
        lobbyId = identity = null;
        hasAdmitted = false;
        retryAttempt.value = 0;
        connectionState.value = "disconnected";
        connectionError.value = null;
        request.resetPending();
        window.removeEventListener("pageshow", onResume);
        document.removeEventListener("visibilitychange", onVisibility);
    };
    const terminate = (error: Failure) => {
        // Retain the exact, curated cause after teardown rather than replacing
        // an admission/auth/protocol failure with an invented HTTP upgrade reason.
        settleReadiness(new Error(error.message));
        disconnect();
        connectionError.value = { command: error.command, code: error.code, message: error.message };
        request.fail(connectionError.value);
        ports.releaseSession();
    };
    const expire = () =>
        terminate(
            failure(
                "RECOVERY_EXPIRED",
                "The 30-second connection window ended. Check your network and close any other tab using this identity, then deliberately re-enter the lobby. The server may no longer retain your place.",
                true
            )
        );
    const withinBudget = () => {
        if (recoveryDeadline.value !== null && Date.now() >= recoveryDeadline.value) {
            expire();
            return false;
        }
        return !!lobbyId && !disposed;
    };
    const beginBudget = () => {
        if (recoveryDeadline.value !== null) return;
        const session = sessionGeneration;
        recoveryDeadline.value = Date.now() + recoveryBudget;
        const tick = () => {
            if (session !== sessionGeneration || recoveryDeadline.value === null) return;
            recoverySecondsRemaining.value = Math.max(0, Math.ceil((recoveryDeadline.value - Date.now()) / 1000));
            if (Date.now() >= recoveryDeadline.value) expire();
        };
        tick();
        statusTimer = setInterval(tick, 1000);
        deadlineTimer = setTimeout(tick, recoveryBudget);
    };
    const scheduleRetry = (immediate = false) => {
        if (!withinBudget() || attempt || retryTimer !== undefined || !isOnline.value || retryAttempt.value >= maxAttempts) return;
        // Equal jitter avoids synchronized clients and zero-delay retry loops.
        // Every attempt, offline wait and auth wait consumes the SAME deadline.
        const remaining = recoveryDeadline.value! - Date.now();
        const base = Math.min(500 * 2 ** Math.max(0, retryAttempt.value - 1), 3000);
        const delay = Math.min(remaining, immediate ? 0 : Math.floor(base * (0.5 + Math.random() * 0.5)));
        nextRetryAt.value = Date.now() + delay;
        const session = sessionGeneration;
        retryTimer = setTimeout(() => {
            retryTimer = undefined;
            nextRetryAt.value = null;
            if (session === sessionGeneration && withinBudget()) open();
        }, delay);
    };
    const recover = () => {
        if (!lobbyId || disposed) return;
        beginBudget();
        if (!withinBudget()) return;
        clearRetry();
        clearAttempt();
        ports.invalidateViews();
        request.resetPending();
        connectionState.value = hasAdmitted ? "reconnecting" : "connecting";
        waitForReadiness();
        scheduleRetry();
    };
    const onOffline = () => {
        isOnline.value = false;
        if (lobbyId) recover();
    };
    const onOnline = () => {
        isOnline.value = true;
        if (!lobbyId || !withinBudget() || attempt) return;
        clearRetry();
        scheduleRetry(true);
    };
    const probeAfterResume = (owner: Attempt) => {
        // Browsers answer native control pings without running this page's JS.
        // Give queued/next legacy pings one cadence to arrive after suspension;
        // do not hand away a healthy host just because a hidden timer was late.
        if (owner.resumeUntil) {
            if (Date.now() >= owner.resumeUntil) recover();
            return;
        }
        owner.lastHeartbeatCheck = Date.now();
        owner.resumeUntil = Date.now() + 4000;
        owner.wasHidden = false;
        try {
            owner.socket?.send(JSON.stringify({ command: "pong" }));
        } catch {
            recover();
        }
    };
    const onResume = () => {
        isOnline.value = navigator.onLine;
        if (!lobbyId || !withinBudget()) return;
        if (!isOnline.value) {
            recover();
            return;
        }
        if (attempt?.admitted) {
            if (attempt.socket?.readyState !== WebSocket.OPEN) recover();
            else if (Date.now() - attempt.lastActivity > heartbeatTimeout) probeAfterResume(attempt);
        } else if (!attempt) {
            clearRetry();
            scheduleRetry(true);
        }
    };
    const onVisibility = () => {
        if (document.visibilityState === "visible") onResume();
    };
    const clearConnectionFeedback = () => {
        connectionError.value = null;
        if (
            request.requestError &&
            [
                "CONNECTION_FAILED",
                "RECOVERY_EXPIRED",
                "CLIENT_STATE_INVALID",
                "ADMISSION_TIMEOUT",
                "AUTHENTICATION_REQUIRED",
                "IDENTITY_CHANGED",
                "PLAYER_NOT_IN_LOBBY",
                "LOBBY_NOT_FOUND",
            ].includes(request.requestError.code)
        )
            request.clearError();
    };
    const dispatch = async (data: SocketEnvelope, admitted: boolean) => {
        if (data.status === SocketStatus.ERROR) {
            const error = decodeRequestError(data);
            if (!admitted || error.code === "PLAYER_NOT_IN_LOBBY") {
                throw { ...error, terminal: error.code !== "LOBBY_BUSY" } satisfies Failure;
            }
            request.fail(error);
        } else {
            const event = decodeGameSocketEvent(data);
            if (event) await ports.apply(event);
        }
        ports.afterFrame();
    };
    const open = () => {
        if (!withinBudget() || !isOnline.value || attempt || retryAttempt.value >= maxAttempts) return;
        const id = lobbyId!;
        const owner: Attempt = {
            generation: ++generation,
            socket: null,
            admitted: false,
            identity: null,
            lastActivity: Date.now(),
            lastHeartbeatCheck: Date.now(),
            resumeUntil: 0,
            wasHidden: document.visibilityState === "hidden",
            lastSeq: -1,
        };
        attempt = owner;
        retryAttempt.value++;
        const assertCurrent = () => {
            if (!current(owner) || !withinBudget()) throw cancelled();
        };
        const failed = (error: Failure) => {
            if (!current(owner)) return;
            if (error.terminal) terminate(error);
            else {
                connectionError.value = { command: error.command, code: error.code, message: error.message };
                recover();
            }
        };
        void (async () => {
            assertCurrent();
            await auth.initializeAuth();
            assertCurrent();
            // Refresh remains shared/revision-scoped in the auth owner. Cancelling
            // this attempt must not cancel/log out a newer user's auth operation.
            const token = await auth.getValidAccessToken();
            assertCurrent();
            if (!token || !player.value.ID) {
                failed(failure("AUTHENTICATION_REQUIRED", "Please sign in again before joining the lobby.", true));
                return;
            }
            if (identity && identity !== player.value.ID) {
                failed(failure("IDENTITY_CHANGED", "The player identity changed. Deliberately re-enter the lobby with your current identity.", true));
                return;
            }
            identity = owner.identity = player.value.ID;
            const url = `${endpoint.replace(/\/$/, "").replace(/^http(s)?:\/\//, "ws$1://")}/lobbySocket?id=${encodeURIComponent(id)}`;
            const socket = new WebSocket(url, ["json", token]);
            owner.socket = socket;
            const receiving = () => current(owner) && !owner.availabilityCheck && withinBudget();
            let messages = Promise.resolve();
            let companion: { phase: unknown; round: unknown; gameId: unknown } | null = null;
            admissionTimer = setTimeout(
                () => {
                    if (current(owner) && !owner.admitted)
                        failed(failure("ADMISSION_TIMEOUT", "The server did not acknowledge lobby admission. Retrying within the connection window."));
                },
                Math.min(10_000, recoveryDeadline.value! - Date.now())
            );
            const markReady = () => {
                owner.admitted = hasAdmitted = true;
                clearTimeout(admissionTimer);
                admissionTimer = undefined;
                clearRetry();
                clearBudget();
                retryAttempt.value = 0;
                connectionState.value = "connected";
                clearConnectionFeedback();
                settleReadiness();
            };
            socket.onopen = () => {
                if (!receiving()) return;
                owner.lastActivity = Date.now();
                owner.lastHeartbeatCheck = Date.now();
                heartbeatTimer = setInterval(() => {
                    if (!receiving()) return;
                    const now = Date.now();
                    const suspended = now - owner.lastHeartbeatCheck > heartbeatTimeout;
                    owner.lastHeartbeatCheck = now;
                    if (document.visibilityState === "hidden") {
                        owner.wasHidden = true;
                        return;
                    }
                    if (owner.admitted && (owner.wasHidden || suspended)) {
                        probeAfterResume(owner);
                        return;
                    }
                    if (now - owner.lastActivity > heartbeatTimeout && now >= owner.resumeUntil) failed(unavailable());
                }, 2000);
            };
            socket.onmessage = (event) => {
                if (!receiving()) return;
                let data: SocketEnvelope;
                try {
                    const frame = decodeSocketFrame(event.data);
                    owner.lastActivity = Date.now();
                    owner.resumeUntil = 0;
                    if (frame.kind === "ping") {
                        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ command: "pong" }));
                        return;
                    }
                    data = frame.envelope;
                } catch {
                    failed(failure("CLIENT_STATE_INVALID", "The lobby update was invalid. Restoring an authoritative snapshot."));
                    return;
                }
                messages = messages
                    .then(async () => {
                        if (!receiving()) return;
                        // Optional for compatibility; gaps are legal (unicast and
                        // omitted event types), never evidence of a lost replay log.
                        if (data.seq !== undefined && data.seq <= owner.lastSeq) return;
                        const context = socketEventContext(data.payload);
                        const snapshot = context.lobby;
                        const ownJoin = data.status !== SocketStatus.ERROR && data.type === SocketType.JOINED_LOBBY && context.user === owner.identity && snapshot?.ID === id;
                        if (!owner.admitted && !ownJoin && data.status !== SocketStatus.ERROR) return;
                        if (snapshot && snapshot.ID !== id) throw new Error("Unexpected lobby.");
                        const repeatedAdmission =
                            companion &&
                            data.type === SocketType.REJOIN_ROUND &&
                            snapshot?.ID === id &&
                            context.phase === companion.phase &&
                            context.round === companion.round &&
                            (context.gameId ?? snapshot.gameId) === companion.gameId;
                        companion = null;
                        if (!repeatedAdmission) await dispatch(data, owner.admitted);
                        if (!receiving()) return;
                        if (data.seq !== undefined) owner.lastSeq = data.seq;
                        if (ownJoin && snapshot) {
                            // The JOINED_LOBBY handler validated the connected own membership.
                            companion = { phase: snapshot.phase, round: snapshot.currentRound, gameId: snapshot.gameId };
                            markReady();
                        }
                    })
                    .catch((error: unknown) => {
                        if (!receiving()) return;
                        const known =
                            error &&
                            typeof error === "object" &&
                            "code" in error &&
                            typeof error.code === "string" &&
                            "command" in error &&
                            typeof error.command === "string" &&
                            "message" in error &&
                            typeof error.message === "string" &&
                            "terminal" in error &&
                            typeof error.terminal === "boolean";
                        failed(known ? (error as Failure) : failure("CLIENT_STATE_INVALID", "The game update could not be applied. Restoring an authoritative snapshot."));
                    });
            };
            const transportFailed = async () => {
                if (!current(owner) || owner.availabilityCheck) return;
                // Reconnect after an admitted socket drops without waiting on
                // the public lobby list. If a replacement fails before its
                // own JOINED snapshot, use the existing diagnostic path there.
                if (owner.admitted || !isOnline.value) {
                    failed(unavailable());
                    return;
                }
                if (!withinBudget()) return;
                // Browsers don't expose rejection bodies on failed admission.
                // One bounded check belongs to this failed attempt only.
                const check = new AbortController();
                owner.availabilityCheck = check;
                const timeout = setTimeout(() => check.abort(), availabilityTimeout);
                try {
                    const response = await fetch(`${endpoint.replace(/\/$/, "")}/lobby`, { cache: "no-store", signal: check.signal });
                    if (response.ok) {
                        const lobbies: unknown = await response.json();
                        if (
                            current(owner) &&
                            !check.signal.aborted &&
                            withinBudget() &&
                            lobbies &&
                            typeof lobbies === "object" &&
                            !Array.isArray(lobbies) &&
                            !Object.hasOwn(lobbies, id)
                        ) {
                            failed(
                                failure(
                                    "LOBBY_NOT_FOUND",
                                    "This lobby is no longer available. It may have closed or the development server may have restarted. Create a new lobby or join another one.",
                                    true
                                )
                            );
                            return;
                        }
                    }
                } catch {
                    // Offline, timeout and server errors retain normal recovery.
                } finally {
                    clearTimeout(timeout);
                }
                if (current(owner)) failed(unavailable());
            };
            socket.onerror = () => void transportFailed();
            socket.onclose = () => void transportFailed();
        })().catch(() => {
            if (current(owner)) failed(unavailable());
        });
    };
    const connect = (id: string): Promise<void> => {
        if (disposed) return Promise.reject(new Error("The game runtime has been disposed."));
        if (!id) return Promise.reject(new Error("A lobby ID is required."));
        if (id === lobbyId) {
            if (!withinBudget()) return Promise.reject(cancelled());
            if (readiness) return readiness;
            if (connectionState.value === "connected" && attempt?.admitted && attempt.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
            const ready = waitForReadiness();
            recover();
            return ready;
        }
        // Only a committed route may release/switch membership, never connect().
        if (lobbyId) return Promise.reject(new Error("Leave the current lobby through navigation before joining another."));
        disconnect();
        lobbyId = id;
        isOnline.value = navigator.onLine;
        window.addEventListener("pageshow", onResume);
        document.addEventListener("visibilitychange", onVisibility);
        connectionState.value = "connecting";
        clearConnectionFeedback();
        beginBudget();
        const ready = waitForReadiness();
        // Offline initial entry waits inside the absolute budget, not an
        // immediate terminal failure or an unbounded online-event subscription.
        if (isOnline.value) open();
        return ready;
    };
    const writeCommand = (message: SocketCommand, beforeWrite: () => void, onUnavailable: (error: RequestError) => void): (() => boolean) | undefined => {
        const reject = () => onUnavailable({ ...unavailable(), command: message.command });
        const owner = attempt;
        if (!owner || !current(owner) || !withinBudget() || !owner.admitted || connectionState.value !== "connected" || owner.socket?.readyState !== WebSocket.OPEN) {
            reject();
            return;
        }
        if (Date.now() - owner.lastActivity > heartbeatTimeout && Date.now() >= owner.resumeUntil) {
            recover();
            reject();
            return;
        }
        beforeWrite();
        try {
            owner.socket.send(JSON.stringify(message));
            return () => current(owner);
        } catch {
            reject();
            recover();
        }
    };
    // Network presentation outlives terminal lobby attempts so an offline
    // expiry cannot strand the retained recovery screen with disabled actions.
    isOnline.value = navigator.onLine;
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return {
        status: reactive({
            connectionState,
            isOnline,
            recoveryDeadline,
            recoverySecondsRemaining,
            retryAttempt,
            nextRetryAt,
            connectionError,
            isConnected: computed(() => connectionState.value === "connected"),
            isRecovering: computed(() => connectionState.value === "connecting" || connectionState.value === "reconnecting"),
        }),
        getLobbyId: () => lobbyId,
        captureSession: () => {
            const epoch = sessionGeneration;
            return () => !disposed && epoch === sessionGeneration;
        },
        connect,
        disconnect,
        writeCommand,
        dispose: () => {
            if (disposed) return;
            disposed = true;
            disconnect();
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        },
    };
};
