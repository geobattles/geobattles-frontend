import { reactive } from "vue";
import type { LobbyInfo } from "~/types/appTypes";
import type { PowerupCommand, PowerupPending, PowerupType, PowerupEffect } from "~/types/powerups";
import type { SocketCommand } from "~/types/socketTypes";
import type { RequestError } from "~/composables/requestState";

type Write = (message: SocketCommand, beforeWrite: () => void, unavailable: (error: RequestError) => void) => (() => boolean) | undefined;

const choiceFeedback = (effect: PowerupEffect) => {
    if (effect.status === "REFUNDED") return effect.reason === "TARGET_LEFT" ? "Duel refunded: the opponent left." : "Powerup refunded because a player missed the round.";
    if (effect.status === "CANCELLED") return "Powerup cancelled.";
    return `Confirmed for round ${effect.round}.`;
};

// One client owner: no socket/DOM handles or clock deadlines in Nuxt snapshots.
export const createPowerupRuntime = (ports: { lobby: () => LobbyInfo | null | undefined; playerId: () => string | undefined; startPending: () => boolean }) => {
    const view = reactive({ remainingMs: 0, pending: null as PowerupPending | null, feedback: "" });
    let key = "";
    let deadline = 0;
    let closed = false;
    let tickTimer: ReturnType<typeof setInterval> | undefined;
    let ackTimer: ReturnType<typeof setTimeout> | undefined;
    let write: Write | undefined;
    const clearAck = () => {
        clearTimeout(ackTimer);
        ackTimer = undefined;
    };
    const stopClock = () => {
        clearInterval(tickTimer);
        tickTimer = undefined;
    };
    const settle = (message: string) => {
        clearAck();
        view.pending = null;
        view.feedback = message;
    };
    const owns = (pending: PowerupPending) => {
        const lobby = ports.lobby();
        return lobby?.ID === pending.lobbyId && lobby.gameId === pending.message.gameId && ports.playerId() === pending.playerId;
    };
    // Receipts and reconnect snapshots must acknowledge the exact choice,
    // including Duel's explicit opponent, not merely reuse its request ID.
    const matchesChoice = (pending: PowerupPending, effect: PowerupEffect) => {
        const message = pending.message;
        return (
            message.command === "use_powerup" &&
            effect.requestId === message.requestId &&
            effect.source === pending.playerId &&
            effect.gameId === message.gameId &&
            effect.round === message.round + 1 &&
            effect.type === message.powerup.type &&
            effect.target === message.powerup.target
        );
    };
    const tick = () => {
        view.remainingMs = Math.max(0, deadline - performance.now());
        if (!view.remainingMs) stopClock();
    };
    const sync = () => {
        const lobby = ports.lobby();
        const state = lobby?.powerupState;
        const nextKey = JSON.stringify([lobby?.ID, lobby?.gameId, lobby?.currentRound, lobby?.phase, ports.playerId()]);
        const changed = nextKey !== key;
        if (view.pending && !owns(view.pending)) settle("");
        if (changed) {
            key = nextKey;
            deadline = 0;
            closed = false;
            stopClock();
            view.feedback = "";
        }
        const valid = state && state.gameId === lobby?.gameId && state.round === lobby?.currentRound;
        if (valid && lobby?.phase === "MID-ROUND" && state.status === "OPEN" && !closed) {
            const candidate = performance.now() + state.remainingMs;
            deadline = deadline ? Math.min(deadline, candidate) : candidate;
            tick();
            if (view.remainingMs && tickTimer === undefined) tickTimer = setInterval(tick, 100);
        } else {
            closed = true;
            deadline = 0;
            view.remainingMs = 0;
            stopClock();
        }
        const pending = view.pending;
        if (!pending || !valid) return;
        const message = pending.message;
        if (message.command === "use_powerup") {
            const effect = state.effects.find((effect) => matchesChoice(pending, effect));
            if (effect) {
                settle(choiceFeedback(effect));
                return;
            }
        } else if (state.round === message.round && state.decisionReady[pending.playerId] === true) {
            settle("Choices locked.");
            return;
        }
        if (state.round > message.round || (state.round === message.round && state.status === "CLOSED"))
            settle(message.command === "powerup_ready" ? "Choices closed." : "Not accepted before choices closed. Inventory shown is the server’s state.");
    };
    const uncertain = () => {
        clearAck();
        if (view.pending) {
            view.pending.uncertain = true;
            view.feedback = "";
        }
    };
    const transmit = (pending: PowerupPending) => {
        if (!write || !owns(pending)) return false;
        clearAck();
        const current = write(
            pending.message,
            () => {
                view.pending = pending;
                pending.uncertain = false;
                view.feedback = "";
            },
            uncertain
        );
        if (!current) return false;
        ackTimer = setTimeout(() => {
            if (view.pending?.message.requestId === pending.message.requestId) uncertain();
        }, 5000);
        return true;
    };
    const canChoose = () => {
        tick();
        const lobby = ports.lobby();
        const state = lobby?.powerupState;
        const id = ports.playerId();
        return !!(
            id &&
            lobby?.gameId &&
            lobby.phase === "MID-ROUND" &&
            state?.gameId === lobby.gameId &&
            state.round === lobby.currentRound &&
            state.status === "OPEN" &&
            view.remainingMs > 0 &&
            state.decisionReady[id] === false &&
            !view.pending &&
            !ports.startPending()
        );
    };
    const begin = (choice?: { type: PowerupType; target?: string }) => {
        if (!canChoose()) return false;
        const lobby = ports.lobby()!;
        const playerId = ports.playerId()!;
        if (choice) {
            if (!lobby.conf.powerups[choice.type] || lobby.playerList[playerId]?.powerups?.[choice.type] !== true) return false;
            if (choice.type === 1 && (!choice.target || choice.target === playerId || lobby.playerList[choice.target]?.connected !== true)) return false;
            if (choice.type === 0 && choice.target) return false;
        }
        // getRandomValues also works on the explicitly supported HTTP LAN preview.
        // randomUUID is secure-context-only and would throw there.
        const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const context = { gameId: lobby.gameId!, round: lobby.currentRound, requestId };
        const message: PowerupCommand = choice ? { command: "use_powerup", ...context, powerup: choice } : { command: "powerup_ready", ...context };
        return transmit({ playerId, lobbyId: lobby.ID, message, uncertain: false });
    };
    const receipt = (gameId: string, requestId: string, effect?: PowerupEffect) => {
        const pending = view.pending;
        if (!pending || !owns(pending) || pending.message.gameId !== gameId || pending.message.requestId !== requestId) return;
        if (pending.message.command === "use_powerup") {
            if (!effect || !matchesChoice(pending, effect)) return;
            settle(choiceFeedback(effect));
        } else if (!effect) settle("Choices locked.");
    };
    const reject = (error: RequestError) => {
        if (error.command !== "use_powerup" && error.command !== "powerup_ready") return false;
        const pending = view.pending;
        if (
            pending &&
            owns(pending) &&
            pending.message.command === error.command &&
            error.requestId === pending.message.requestId &&
            (!error.gameId || error.gameId === pending.message.gameId) &&
            (error.round === undefined || error.round === pending.message.round)
        )
            settle(`Not accepted: ${error.message}`);
        return true; // Dedicated feedback: do not duplicate it in the global alert.
    };
    const closeAttempt = () => {
        stopClock();
        view.remainingMs = 0;
        uncertain();
    };
    const dispose = () => {
        stopClock();
        clearAck();
        key = "";
        deadline = 0;
        closed = false;
        view.pending = null;
        view.feedback = "";
        view.remainingMs = 0;
    };
    return {
        view,
        sync,
        receipt,
        reject,
        closeAttempt,
        dispose,
        bind: (sender: Write) => {
            write = sender;
        },
        use: (type: PowerupType, target?: string) => begin({ type, ...(target ? { target } : {}) }),
        ready: () => begin(),
        retry: () => {
            sync();
            return !!view.pending?.uncertain && transmit(view.pending);
        },
    };
};
