export type LivePowerupIndicator = { doubleScore: boolean; duels: number; attackingYou: boolean; incoming: number };

/** Live rows reflect authoritative active effects, never queued choices or past rounds. */
export const useLivePowerupIndicators = () => {
    const lobby = useLobbyStore();
    const player = usePlayerInfo();
    return computed(() => {
        const indicators = new Map<string, LivePowerupIndicator>();
        const settings = lobby.lobbySettings;
        if (!settings?.gameId) return indicators;
        const row = (id: string) => {
            let value = indicators.get(id);
            if (!value) {
                value = { doubleScore: false, duels: 0, attackingYou: false, incoming: 0 };
                indicators.set(id, value);
            }
            return value;
        };
        for (const effect of settings.powerupState?.effects ?? []) {
            if (effect.status !== "ACTIVE" || effect.gameId !== settings.gameId || effect.round !== settings.currentRound) continue;
            if (!settings.playerList[effect.source]) continue;
            if (effect.type === 0) row(effect.source).doubleScore = true;
            else if (effect.type === 1 && effect.target && settings.playerList[effect.target]) {
                row(effect.source).duels++;
                row(effect.target).incoming++;
                if (effect.target === player.value.ID) row(effect.source).attackingYou = true;
            }
        }
        return indicators;
    });
};
