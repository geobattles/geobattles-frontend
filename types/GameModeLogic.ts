import type { Coordinates, GameState, Results, ResultsInfo, TotalResults } from "./appTypes";

// Create a shared interface for game mode logic
export interface GameModeLogic {
    currentState: Readonly<Ref<GameState>>;
    currentRound: Readonly<Ref<number>>;
    currentMapPin: Readonly<Ref<Coordinates>>;
    searchedLocationCoords: Readonly<Ref<Coordinates>>;
    setSearchedLocationCoords: (coordinates: Coordinates) => void;
    isSubmitDisabled: ComputedRef<boolean> | Ref<boolean>;
    clearMap: () => void;
    startRound: (isCountdown?: boolean) => Promise<void>;
    finishRound: (round: number, polygon?: any) => void;
    finishGame: () => void;
}

// Add optional methods
export interface BattleRoyaleLogic extends GameModeLogic {
    processMapPin: (coordinates: Coordinates) => Promise<void>;
    getUserLives: (user: string) => number;
    submitGuess: () => void;
}

export interface CountryBattleLogic extends GameModeLogic {
    processClickedCountry: (polygon: any, countryCode: string) => void;
}
