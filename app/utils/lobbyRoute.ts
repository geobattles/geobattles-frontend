import { GameState, type LobbyPhase, type LobbyInfo } from "~/types/appTypes";
import type { RouteLocationNormalized } from "vue-router";

export const routeLobbyId = (route: Pick<RouteLocationNormalized, "name" | "params">): string | null => {
    if (route.name !== "lobby-id" && route.name !== "gameplay-id") return null;
    return typeof route.params.id === "string" ? route.params.id : null;
};
export const phaseGameState = (phase: LobbyPhase): GameState => {
    switch (phase) {
        case "WAITING":
            return GameState.WAITING;
        case "PLAYING":
            return GameState.PLAYING;
        case "MID-ROUND":
            return GameState.MID_ROUND;
        case "FINISHED":
            return GameState.FINISHED;
        default:
            throw new Error("Unknown lobby phase.");
    }
};
export const lobbyRoutePath = (lobby: LobbyInfo): string => (!lobby.phase || lobby.phase === "WAITING" ? `/lobby/${lobby.ID}` : `/gameplay-${lobby.ID}`);
