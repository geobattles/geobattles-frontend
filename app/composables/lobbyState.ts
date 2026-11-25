import type { Coordinates, LobbyInfo, LobbySummary, Player } from "~/types/appTypes";

// Data-only dependencies keep lobby, player lookup and mode initialization acyclic.
export const useLobbyState = () => ({
    closedLobbyId: useState<string | null>("lobby:closedId", () => null),
    lobbySettings: useState<LobbyInfo | null>("lobby:settings", () => null),
    lobbySettingsOriginal: useState<LobbyInfo | null>("lobby:originalSettings", () => null),
    playerPresentation: useState<{ lobbyId: string | null; players: Record<string, Pick<Player, "name" | "color">> }>("lobby:playerPresentation", () => ({
        lobbyId: null,
        players: {},
    })),
    isUpdatingSettings: useState("lobby:updatingSettings", () => false),
    lobbyList: useState<Record<string, LobbySummary>>("lobby:list", () => ({})),
    modifySettingsModal: useState("lobby:modifySettingsModal", () => false),
    rejoinTimer: useState<number | null>("lobby:rejoinSeconds", () => null),
    roundDeadline: useState<number | null>("lobby:roundDeadline", () => null),
    // GAME_END or a complete FINISHED snapshot, never a locally inferred total.
    finalResultsReady: useState("lobby:finalResultsReady", () => false),
    // Capture the admitted identity, not whichever player logs in afterwards.
    finalResultsPlayerId: useState<string | null>("lobby:finalResultsPlayerId", () => null),
    // Validated member/final archives and observed finalized round answers only.
    // Older servers may still leave this incomplete after recovery.
    revealedAnswers: useState<Record<number, Coordinates>>("lobby:revealedAnswers", () => ({})),
});

// A navigation hint only. Admission still requires the same signed identity.
export const useLobbyReturnState = () => useState<{ id: string; playerId: string } | null>("lobby:return", () => null);
