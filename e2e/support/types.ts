export interface Player {
    name: string;
    connected: boolean;
    ready: boolean;
    color: string;
    lives?: number;
}

export interface Snapshot {
    ID: string;
    admin: string;
    gameId?: string;
    conf: { name: string; numRounds: number; numAttempt: number; roundTime: number; [key: string]: unknown };
    playerList: Record<string, Player>;
    numPlayers: number;
    phase: "WAITING" | "PLAYING" | "MID-ROUND" | "FINISHED";
    round: number;
    currentRound: number;
    timeRemaining: number;
    totalResults: Record<string, Record<string, unknown>>;
    results: Record<string, Record<string, unknown[]>>;
    endResults: Record<string, Record<string, { total?: number }>>;
    revealedAnswers?: Record<string, { lat: number; lng: number }>;
}

export interface Envelope {
    type: string;
    status: string;
    seq: number;
    payload?: {
        lobby?: Snapshot;
        user?: string;
        gameId?: string;
        round?: number;
        phase?: string;
        timeRemaining?: number;
        command?: string;
        code?: string;
        players?: Record<string, Player>;
        roundRes?: Record<string, { total?: number }>;
        endResults?: Snapshot["endResults"];
        revealedAnswers?: Snapshot["revealedAnswers"];
        results?: Record<string, Record<string, unknown[]>>;
        totalResults?: Record<string, Record<string, unknown>>;
    };
    generation: number;
}
