export interface BaseResults {
    roundNumber: number;
}

export interface BattleRoyaleResults extends BaseResults {
    lives: number;
    distance: number;
    score: number;
}

export interface CountryBattleResults extends BaseResults {
    correctCountry: boolean;
    selectedCountry: string;
    targetCountry: string;
}

export interface ResultsHashMap {
    [key: string]: BattleRoyaleResults | CountryBattleResults;
}

export enum GameState {
    WAITING = "WAITING",
    STARTING = "STARTING",
    PLAYING = "PLAYING",
    MID_ROUND = "MID-ROUND",
    FINISHED = "FINISHED",
}

export type Coordinates = {
    lat: number;
    lng: number;
};
