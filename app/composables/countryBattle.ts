import { GameState, type Coordinates } from "~/types/appTypes";

export const useCountryBattleStore = () => {
    // GamePlay State
    const { currentState, currentRound, currentMapPin, searchedLocationCoords } = useCountryBattleState();
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

    return reactive({
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
    });
};
