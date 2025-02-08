import type { Results, ResultsInfo, TotalResults, Coordinates } from "../types/appTypes";

export abstract class BaseGameMode {
    constructor() {}

    abstract cleanup(): void;

    abstract startRound(): void;
    abstract finishRound(totalResults: TotalResults, roundResults: Results, polygon?: any): void;
    abstract finishGame(): void;
    abstract processMapPin(coordinates: Coordinates): void;
    abstract processNewResult(user_id: string, player_result: ResultsInfo): void;
    abstract clearMap(): void;
    abstract isSubmitButtonDisabled: ComputedRef<boolean>;
}
