import { type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";

export const useGameMode = defineStore("gameModeStore", () => {
    // GameMode and GameMode Logic
    const currentMode = ref<"BattleRoyale" | "CountryBattle">("BattleRoyale");
    const modeLogic = ref<ReturnType<typeof useBattleRoyaleMode> | ReturnType<typeof useCountryBattleMode>>(useBattleRoyaleMode());

    // Initialized once player joins the lobby
    const initGameMode = () => {
        const gameMode = useLobbyStore().lobbySettings?.conf.mode;
        currentMode.value = gameMode === 2 ? "CountryBattle" : "BattleRoyale";
        modeLogic.value = currentMode.value === "BattleRoyale" ? useBattleRoyaleMode() : useCountryBattleMode();
    };

    // Update GameMode
    const updateGameMode = (newGameType: "BattleRoyale" | "CountryBattle") => {
        if (currentMode.value !== newGameType) {
            // Update game mode
            currentMode.value = newGameType;
            modeLogic.value = newGameType === "BattleRoyale" ? useBattleRoyaleMode() : useCountryBattleMode();
            console.info(`Game mode updated to: ${newGameType}`);
        }
    };

    // ========== GameMode Logic Functions ==========
    const startRound = () => {
        modeLogic.value.startRound();
    };

    const finishRound = (totalResults: TotalResults, roundResults: Results, round: number, polygon?: any) => {
        modeLogic.value.finishRound(totalResults, roundResults, round, polygon);
    };

    const finishGame = () => {
        console.info(`Finishing gameplay.`);
        modeLogic.value.finishGame();
    };

    const processNewResult = (user: string, player_result: ResultsInfo): void => {
        modeLogic.value.processNewResult(user, player_result);
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
        initGameMode,
        updateGameMode,
        startRound,
        finishRound,
        finishGame,
        processClickedCountry,
        processNewResult,
        submitGuess,
        exitGameplay,
    };
});
