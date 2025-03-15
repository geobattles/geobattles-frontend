import { GameState, type Coordinates } from "~/types/appTypes";

export const useCountryBattleStore = defineStore("countryBattleStore", () => {
    // GamePlay State
    const currentState = ref(GameState.WAITING);
    const currentRound = ref(0);
    const currentMapPin = ref<Coordinates>({} as Coordinates);
    const searchedLocationCoords = ref<Coordinates>({} as Coordinates);
    const setSearchedLocationCoords = (coordinates: Coordinates): Coordinates => (searchedLocationCoords.value = coordinates);
    const isSubmitDisabled = ref(true);

    const startRound = async () => {
        // Add logic to start the round
    };

    const finishRound = (round: number, polygon: any) => {
        // Add logic to finish the round
    };

    const finishGame = () => {
        // Add logic to finish the game
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
        processClickedCountry,
        clearMap,
    };
});
