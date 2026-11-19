import { SocketStatus, SocketType, type GameSocketEvent } from "~/types/socketTypes";
import type { RequestError } from "~/composables/requestState";
import { decodeSocketCoordinates, decodeSocketResult, isSocketRecord } from "~/runtime/socketValues";

const needRecord = (value: unknown): Record<string, unknown> => {
    if (!isSocketRecord(value)) throw new Error("Invalid socket payload.");
    return value;
};
const checkRecords = (value: Record<string, unknown>, fields: string[]) => {
    for (const field of fields) needRecord(value[field]);
};
const checkIdentity = (value: Record<string, unknown>) => {
    if (value.gameId !== undefined && typeof value.gameId !== "string") throw new Error("Invalid match identity.");
};
const checkUser = (value: unknown) => {
    if (typeof value !== "string" || !value) throw new Error("Invalid event player.");
};
const checkSnapshot = (value: unknown) => {
    const lobby = needRecord(value);
    if (typeof lobby.ID !== "string" || !lobby.ID) throw new Error("Invalid snapshot lobby.");
    checkIdentity(lobby);
    checkRecords(lobby, ["conf", "playerList", "results", "endResults", "fullroundRes", "roundRes", "totalResults"]);
};
const eventTypes: ReadonlySet<string> = new Set(Object.values(SocketType));
const isKnownEvent = (type: string): type is SocketType => eventTypes.has(type);

export type SocketEnvelope = { type: string; status: SocketStatus; seq?: number; payload: unknown };

export const decodeSocketFrame = (raw: unknown): { kind: "ping" } | { kind: "envelope"; envelope: SocketEnvelope } => {
    if (typeof raw !== "string") throw new Error("Expected a text socket frame.");
    const message = needRecord(JSON.parse(raw) as unknown);
    if (message.command === "ping") return { kind: "ping" };
    const { type, status, seq, payload } = message;
    if (typeof type !== "string" || (status !== SocketStatus.NORMAL && status !== SocketStatus.WARNING && status !== SocketStatus.ERROR))
        throw new Error("Invalid socket envelope.");
    if (seq !== undefined && (typeof seq !== "number" || !Number.isSafeInteger(seq) || seq <= 0)) throw new Error("Invalid socket sequence.");
    return { kind: "envelope", envelope: { type, status, seq, payload } };
};

// Read routing metadata before decoding event data, so pre-admission and stale
// frames retain their existing ignore behavior. Only applied state admits us.
export const socketEventContext = (payload: unknown) => {
    const body = isSocketRecord(payload) ? payload : undefined;
    const lobby = isSocketRecord(body?.lobby) ? body.lobby : undefined;
    return { lobby, user: body?.user, phase: body?.phase, round: body?.round, gameId: body?.gameId };
};

export const decodeRequestError = (message: SocketEnvelope): RequestError => {
    const payload = isSocketRecord(message.payload) ? message.payload : undefined;
    return {
        command: typeof payload?.command === "string" ? payload.command : "",
        code: typeof payload?.code === "string" ? payload.code : "REQUEST_FAILED",
        message: message.type === "REQUEST_ERROR" && typeof payload?.message === "string" ? payload.message.slice(0, 500) : "The request failed. Reconnect or try again.",
    };
};

// Validate event shape here; the handlers validate phase/round transitions and
// decode nested score archives before publishing them. Unknown events are still
// ignored for compatibility; a valid seq remains part of the stream order.
export const decodeGameSocketEvent = ({ type, payload }: SocketEnvelope): GameSocketEvent | undefined => {
    if (!isKnownEvent(type)) return undefined;
    if (type === SocketType.ROUND_FINISHED || type === SocketType.TIMES_UP || type === SocketType.NO_COUNTRY) return { type, payload: undefined };
    if (type === SocketType.CC) {
        const body = needRecord(payload);
        return { type, payload: { polygon: body.polygon, cc: typeof body.cc === "string" ? body.cc : undefined } };
    }
    const body = needRecord(payload);
    checkIdentity(body);
    switch (type) {
        case SocketType.JOINED_LOBBY:
        case SocketType.LEFT_LOBBY:
            checkUser(body.user);
            checkSnapshot(body.lobby);
            break;
        case SocketType.UPDATED_LOBBY:
            checkSnapshot(body.lobby);
            break;
        case SocketType.REJOIN_ROUND:
            checkSnapshot(body.lobby);
            checkRecords(body, ["players", "fullroundRes", "roundRes", "totalResults"]);
            break;
        case SocketType.START_ROUND:
            needRecord(body.players);
            body.location = decodeSocketCoordinates(body.location);
            break;
        case SocketType.NEW_RESULT:
            checkUser(body.user);
            body.playerRes = decodeSocketResult(body.playerRes);
            break;
        case SocketType.ROUND_RESULT:
            checkRecords(body, ["players", "fullroundRes", "roundRes", "totalResults", "location"]);
            break;
        case SocketType.GAME_END:
            checkRecords(body, ["results", "totalResults"]);
            break;
        default:
            return type satisfies never;
    }
    // JSON is untyped. This is the single cast for the checked wire shape;
    // the typed event handlers still validate domain and archive invariants.
    const event: unknown = { type, payload: body };
    return event as GameSocketEvent;
};
