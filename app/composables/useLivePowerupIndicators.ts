import { roundPowerupEffects } from "~/utils/roundPowerups";

export type LivePowerupIndicator = { doubleScore: boolean; targets: string[]; attackers: string[] };

/** Live rows reflect authoritative active effects, never queued choices or past rounds. */
export const useLivePowerupIndicators = () => {
    const lobby = useLobbyStore();
    return computed(() => {
        const indicators = new Map<string, LivePowerupIndicator>();
        const settings = lobby.lobbySettings;
        if (!settings?.gameId) return indicators;
        const row = (id: string) => {
            let value = indicators.get(id);
            if (!value) {
                value = { doubleScore: false, targets: [], attackers: [] };
                indicators.set(id, value);
            }
            return value;
        };
        for (const effect of roundPowerupEffects(settings, settings.currentRound, "ACTIVE")) {
            if (!settings.playerList[effect.source]) continue;
            if (effect.type === 0) row(effect.source).doubleScore = true;
            else if (effect.type === 1 && effect.target && settings.playerList[effect.target]) {
                row(effect.source).targets.push(effect.target);
                row(effect.target).attackers.push(effect.source);
            }
        }
        return indicators;
    });
};
