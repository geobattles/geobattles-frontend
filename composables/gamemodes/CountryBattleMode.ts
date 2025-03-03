import { GameState, type Coordinates, type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";
import type { CountryBattleLogic } from "~/types/GameModeLogic";

export function useCountryBattleMode(): CountryBattleLogic {
    // GamePlay State
    const currentState = ref(GameState.WAITING);
    const currentRound = ref(0);
    const currentMapPin = ref<Coordinates>({} as Coordinates);
    const searchedLocationCoords = ref<Coordinates>({} as Coordinates);
    const setSearchedLocationCoords = (coordinates: Coordinates): Coordinates => (searchedLocationCoords.value = coordinates);
    const isSubmitDisabled = ref(true);

    const startRound = () => {};

    const finishRound = (totalResults: TotalResults, roundResults: Results, round: number, polygon: any) => {
        // Add logic to finish the round
    };

    const finishGame = () => {
        // Add logic to finish the game
    };

    const processNewResult = (user: string, player_result: ResultsInfo) => {
        // Add logic to process new result
    };

    const processClickedCountry = (polygon: any, countryCode: string) => {
        // Add logic to process clicked country
    };

    const clearMap = () => {
        // Add logic to clear the map
    };

    return {
        currentState: readonly(currentState),
        currentRound: readonly(currentRound),
        currentMapPin: readonly(currentMapPin),
        searchedLocationCoords: readonly(searchedLocationCoords),
        setSearchedLocationCoords,
        isSubmitDisabled,
        startRound,
        finishRound,
        finishGame,
        processNewResult,
        processClickedCountry,
        clearMap,
    };
}
