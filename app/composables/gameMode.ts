import { type GameType } from "~/types/appTypes";
import { useBattleRoyaleStore } from "./battleRoyale";
import { useCountryBattleStore } from "./countryBattle";

export const useGameMode = () => {
    const app = useNuxtApp();
    const currentMode = useSelectedGameMode();
    const battleRoyale = useBattleRoyaleStore();
    const countryBattle = useCountryBattleStore();
    const modeLogic = computed(() => (currentMode.value === "BattleRoyale" ? battleRoyale : countryBattle));
    const updateGameMode = (mode: GameType) => {
        currentMode.value = mode;
    };
    return reactive({
        currentMode: readonly(currentMode),
        modeLogic,
        updateGameMode,
        startRound: (countdown = true) => (currentMode.value === "BattleRoyale" ? battleRoyale.startRound(countdown) : countryBattle.startRound()),
        finishRound: (round: number, polygon?: unknown) => (currentMode.value === "BattleRoyale" ? battleRoyale.finishRound(round) : countryBattle.finishRound(round, polygon)),
        finishGame: () => modeLogic.value.finishGame(),
        processClickedCountry: (polygon: unknown, code: string) => {
            if (currentMode.value === "CountryBattle") countryBattle.processClickedCountry(polygon, code);
        },
        submitGuess: () => {
            if (currentMode.value === "BattleRoyale") battleRoyale.submitGuess();
        },
        exitGameplay: () => app.$gameRuntime.leave(true),
    });
};
