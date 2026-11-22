export type PowerupType = 0 | 1;
export type PowerupEffect = {
    id: string;
    requestId: string;
    gameId: string;
    round: number;
    type: PowerupType;
    source: string;
    target?: string;
    status: "QUEUED" | "ACTIVE" | "APPLIED" | "CANCELLED" | "REFUNDED";
    outcome?: "SOURCE_WON" | "TARGET_WON" | "DRAW";
    reason?: "SOURCE_LEFT" | "TARGET_LEFT";
};
export type PowerupState = {
    gameId?: string;
    round: number;
    targetRound: number | null;
    status: "OPEN" | "CLOSED";
    closesAt: number | null;
    serverNow: number;
    remainingMs: number;
    decisionReady: Record<string, boolean>;
    startRequested: boolean;
    starting: boolean;
    effects: PowerupEffect[];
};
export type PowerupCommand =
    | { command: "use_powerup"; gameId: string; round: number; requestId: string; powerup: { type: PowerupType; target?: string } }
    | { command: "powerup_ready"; gameId: string; round: number; requestId: string };
export type PowerupPending = { playerId: string; lobbyId: string; message: PowerupCommand; uncertain: boolean };
