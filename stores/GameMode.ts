import { type GameType } from "~/types/appTypes";

export const useGameMode = defineStore("gameModeStore", () => {
    // GameMode and GameMode Logic
    const currentMode = ref<GameType>("BattleRoyale");
    const modeLogic = ref<ReturnType<typeof useBattleRoyaleMode> | ReturnType<typeof useCountryBattleMode>>(useBattleRoyaleMode());

    // Update GameMode
    const updateGameMode = (newGameType: GameType) => {
        if (currentMode.value !== newGameType) {
            // Update game mode
            currentMode.value = newGameType;
            modeLogic.value = newGameType === "BattleRoyale" ? useBattleRoyaleMode() : useCountryBattleMode();
            console.info(`Game mode updated to: ${newGameType}`);
        }
    };

    // ========== GameMode Logic Functions ==========
    const startRound = async (isCountdown: boolean = true) => {
        await modeLogic.value.startRound(isCountdown);
    };

    const finishRound = (round: number, polygon?: any) => {
        modeLogic.value.finishRound(round, polygon);
    };

    const finishGame = () => {
        console.info(`Finishing gameplay.`);
        modeLogic.value.finishGame();
    };

    const processClickedCountry = (polygon: any, countryCode: string): void => {
        if ("processClickedCountry" in modeLogic.value) {
            modeLogic.value.processClickedCountry(polygon, countryCode);
        } else {
            console.error(`processClickedCountry method not available in ${currentMode.value} mode`);
        }
    };

    const submitGuess = (): void => {
        if ("submitGuess" in modeLogic.value) {
            modeLogic.value.submitGuess();
        } else {
            console.error(`submitGuess method not available in ${currentMode.value} mode`);
        }
    };

    // ========== Extra Functions ==========
    const exitGameplay = () => {
        // Clear click listeners after game ends
        const { getMap } = useGoogleStore();
        google.maps.event.clearListeners(getMap, "click");
        modeLogic.value.clearMap();
    };

    return {
        currentMode: readonly(currentMode),
        modeLogic: readonly(modeLogic),
        updateGameMode,
        startRound,
        finishRound,
        finishGame,
        processClickedCountry,
        submitGuess,
        exitGameplay,
    };
});
