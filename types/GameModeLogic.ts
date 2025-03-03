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
    startRound: () => void;
    finishRound: (totalResults: TotalResults, roundResults: Results, round: number, polygon?: any) => void;
    finishGame: () => void;
    processNewResult: (user: string, player_result: ResultsInfo) => void;
}

// Add optional methods
export interface BattleRoyaleLogic extends GameModeLogic {
    processMapPin: (coordinates: Coordinates) => Promise<void>;
    submitGuess: () => void;
}

export interface CountryBattleLogic extends GameModeLogic {
    processClickedCountry: (polygon: any, countryCode: string) => void;
}
