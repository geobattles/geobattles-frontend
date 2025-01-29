import type { LobbyInfo, Results, ResultsInfo, TotalResults } from "../types/appTypes";
import type { Coordinates, ResultsHashMap } from "../core/Results";

export abstract class BaseGameMode {
    constructor() {}

    // protected validateGameState(expectedState: GameState): boolean {
    //     return this.gameManager.getGameState() === expectedState;
    // }

    protected updateMapView(coords: Coordinates): void {
        // this.mapController.setSearchedLocation(coords);
        // this.mapController.resetView();
    }

    abstract cleanup(): void;

    abstract startRound(): void;
    // abstract finishRound(totalResults: ResultsHashMap, roundResults: ResultsHashMap, polygon?: any): void;
    abstract finishRound(totalResults: TotalResults, roundResults: Results, polygon?: any): void;
    abstract finishGame(): void;
    abstract processMapPin(coordinates: Coordinates): void;
    abstract processNewResult(user_id: string, player_result: ResultsInfo): void;
    abstract clearMap(): void;
    abstract isSubmitButtonDisabled(): boolean;
}
