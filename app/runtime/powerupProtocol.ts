import { isSocketRecord } from "~/runtime/socketValues";
import type { PowerupEffect, PowerupState } from "~/types/powerups";

const invalid = (): never => {
    throw new Error("Invalid powerup state.");
};
const integer = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 128;
export const decodePowerupEffect = (value: unknown): PowerupEffect => {
    if (
        !isSocketRecord(value) ||
        !text(value.id) ||
        !text(value.requestId) ||
        !text(value.gameId) ||
        !integer(value.round) ||
        value.round < 1 ||
        (value.type !== 0 && value.type !== 1) ||
        !text(value.source) ||
        (value.target !== undefined && !text(value.target)) ||
        !["QUEUED", "ACTIVE", "APPLIED", "CANCELLED", "REFUNDED"].includes(String(value.status)) ||
        (value.outcome !== undefined && !["SOURCE_WON", "TARGET_WON", "DRAW"].includes(String(value.outcome))) ||
        (value.reason !== undefined && !["SOURCE_LEFT", "TARGET_LEFT"].includes(String(value.reason)))
    )
        return invalid();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(value.requestId as string)) return invalid();
    if (value.type === 1 && (!text(value.target) || value.target === value.source || (value.status === "APPLIED" && value.outcome === undefined))) return invalid();
    if (value.type === 0 && value.target !== undefined) return invalid();
    return {
        id: value.id,
        requestId: value.requestId,
        gameId: value.gameId,
        round: value.round,
        type: value.type,
        source: value.source,
        target: value.target,
        status: value.status,
        outcome: value.outcome,
        reason: value.reason,
    } as PowerupEffect;
};
export const decodePowerupState = (value: unknown): PowerupState | undefined => {
    if (value === undefined) return undefined;
    if (
        !isSocketRecord(value) ||
        (value.gameId !== undefined && !text(value.gameId)) ||
        !integer(value.round) ||
        (value.targetRound !== null && (!integer(value.targetRound) || value.targetRound !== value.round + 1)) ||
        (value.status !== "OPEN" && value.status !== "CLOSED") ||
        (value.closesAt !== null && !integer(value.closesAt)) ||
        !integer(value.serverNow) ||
        !integer(value.remainingMs) ||
        value.remainingMs > 20000 ||
        !isSocketRecord(value.decisionReady) ||
        Object.keys(value.decisionReady).length > 1000 ||
        Object.values(value.decisionReady).some((ready) => typeof ready !== "boolean") ||
        typeof value.startRequested !== "boolean" ||
        typeof value.starting !== "boolean" ||
        !Array.isArray(value.effects) ||
        value.effects.length > 100000
    )
        return invalid();
    if (value.status === "OPEN" && (!value.gameId || value.targetRound === null || value.closesAt === null)) return invalid();
    const effects = value.effects.map(decodePowerupEffect);
    if (effects.some((effect) => effect.gameId !== value.gameId)) return invalid();
    return {
        gameId: value.gameId,
        round: value.round,
        targetRound: value.targetRound,
        status: value.status,
        closesAt: value.closesAt,
        serverNow: value.serverNow,
        remainingMs: value.remainingMs,
        decisionReady: { ...value.decisionReady },
        startRequested: value.startRequested,
        starting: value.starting,
        effects,
    } as PowerupState;
};
