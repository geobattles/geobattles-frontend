import type { LobbyInfo, ResultData } from "~/types/appTypes";
import type { PowerupEffect } from "~/types/powerups";

export const roundPowerupEffects = (lobby: LobbyInfo | null | undefined, round: number, status: PowerupEffect["status"]) =>
    lobby?.powerupState?.effects.filter((effect) => effect.gameId === lobby.gameId && effect.round === round && effect.status === status) ?? [];

export const duelStake = 1000;

type SettledDuel = { id: string; opponent: string; incoming: boolean; outcome?: "Won" | "Lost" | "Draw" };

export function roundScoreModifiers(playerId: string, result: ResultData, effects: PowerupEffect[] = []) {
    let doubleUsed = Boolean(result.dblScr);
    const duels: SettledDuel[] = [];
    for (const effect of effects) {
        if (effect.type === 0) {
            doubleUsed = true;
        } else if (effect.target) {
            const incoming = effect.target === playerId;
            const won = effect.outcome === (incoming ? "TARGET_WON" : "SOURCE_WON");
            duels.push({
                id: effect.id,
                opponent: incoming ? effect.source : effect.target,
                incoming,
                outcome: !effect.outcome ? undefined : effect.outcome === "DRAW" ? "Draw" : won ? "Won" : "Lost",
            });
        }
    }
    // The server owns the aggregate, including zero when separate duels cancel out.
    const duelPoints = result.duelScr ?? 0;
    return { doubleUsed, duels, duelPoints, hasDuels: duels.length > 0 || duelPoints !== 0 };
}

export type RoundScoreModifiers = ReturnType<typeof roundScoreModifiers>;
