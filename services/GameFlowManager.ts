import { BattleRoyale } from "../composables/GameplayBattleRoyale";
import type { GameType, GameFlow, Coordinates, Results, TotalResults, ResultsInfo, GameMode } from "~/types";
import { UIManager } from "./UIManager";

export enum GameState {
    WAITING = "WAITING",
    STARTING = "STARTING",
    PLAYING = "PLAYING",
    MID_ROUND = "MID-ROUND",
    FINISHED = "FINISHED",
}

export class GameFlowManager {
    public gameMode: GameMode;
    public gameRound: number = 0;

    public currentState: GameState;
    public currentMapPin: Ref<Coordinates>;
    public searchedLocationCoords: Ref<Coordinates>;
    private uiManager: UIManager;

    constructor(gameType: GameType) {
        this.currentState = GameState.WAITING;
        this.gameMode = this.createGameMode(gameType);
        this.currentMapPin = ref({} as Coordinates);
        this.searchedLocationCoords = ref({} as Coordinates);
        this.uiManager = useUIManager().value;
    }

    private createGameMode(gameType: GameType): GameMode {
        switch (gameType) {
            case "BattleRoyale":
                return new BattleRoyale(this);
            case "CountryBattle":
                return new CountryBattle(this);
            default:
                throw new Error(`Unsupported game type: ${gameType}`);
        }
    }

    updateGameMode(newGameType: GameType): void {
        if (this.gameMode.gameType !== newGameType) {
            this.gameMode = this.createGameMode(newGameType);
            console.info(`Game mode updated to: ${newGameType}`);

            // Reset game state
            if (this.currentState !== GameState.FINISHED) this.setGameState(GameState.WAITING);
            this.currentMapPin.value = {} as Coordinates;
            this.searchedLocationCoords.value = {} as Coordinates;
        }
    }

    setGameState(state: GameState): void {
        this.currentState = state;
    }

    /**
     * Method is used to send a start round message to the server,
     * that lobby admin would like to start a new round.
     */
    sendStartRoundSocketMessage(): void {
        console.log("Sending start round message");
        const game = {
            command: "start",
        };
        const { sendMessage } = useWebSocket();
        if (sendMessage) sendMessage(game);
    }

    /**
     * Method is used when we receive a new round message from the server.
     */
    startRound(): void {
        console.info(`Starting new ${this.gameMode.gameType} round.`);

        this.setGameState(GameState.STARTING); // Change game flow state
        setTimeout(() => this.setGameState(GameState.PLAYING), 3000); // For 3 seconds countdown

        // Start round for the game mode
        this.gameMode.startRound();

        // Set new click listener after 3 seconds countdown
        setTimeout(() => {
            this.setMapClickEventListener();
        }, 3000);
    }

    finishRound(total_results: TotalResults, round_results: Results, polygon?: any): void {
        console.info(`Finsihing gameplay round.`);

        this.setGameState(GameState.MID_ROUND); // Change game flow state
        this.gameMode.finishRound(total_results, round_results, polygon);
    }

    finishGame(): void {
        console.info(`Finishing gameplay.`);

        this.setGameState(GameState.FINISHED);
        this.gameMode.finishGame();

        // Clear click listeners after game ends
        const google_map_instance = isGoogleMap();
        google.maps.event.clearListeners(google_map_instance, "click");
    }

    processNewResult(user: string, player_result: ResultsInfo): void {
        this.gameMode.processNewResult(user, player_result);
    }

    submitGuess(): void {
        const socket_message = {
            command: "submit_location",
            location: this.currentMapPin.value,
        };

        const { sendMessage } = useWebSocket();
        if (sendMessage) sendMessage(socket_message);
    }

    isSubmitButtonDisabled(): boolean {
        try {
            if (this.gameMode.gameType === "BattleRoyale") {
                if (useMapMarkers().value.length === 0) return true; // Disable if no markers
                // Disable if number of markers equals number of attempts
                const player_id = usePlayerInfo().value.ID;
                if (!player_id) throw new Error("Player ID not found probably because left lobby");
                const playerAttempt = useResults().value[player_id].attempt;
                if (useMapMarkers().value.length === playerAttempt) return true;
            } else if (this.gameMode.gameType === "CountryBattle") {
                return false; // Always enable for CountryBattle
            }
            // TODO: Implement for other CountryBattle game mode
        } catch (error) {
            console.log("Error in isSubmitButtonDisabled:", error);
        }

        return false; // Enable button for other game modes
    }

    setMapClickEventListener(): void {
        // Clear previous listener
        const google_map_instance = isGoogleMap();
        google.maps.event.clearListeners(google_map_instance, "click");

        // Add new listener
        addMapClickListener(this.gameMode.processMapPin);
    }

    mountingProcess(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>): void {
        this.uiManager.mountingProcess(toggle_map_mobile, show_map_button, submit_button);
        this.uiManager.googleMapDOMTracker();
    }
    /**
     * Will apply guess styles to a player who guessed.
     *
     * @param player_id Player that made a guess
     * @param previous_leader Previous leader
     * @param new_leader New leader
     */
    static applyGuessStyles(player_id: string, previous_leader: string, new_leader: string): void {
        const player_dom: HTMLElement | null = document.getElementById(player_id);
        if (new_leader === player_id) setTimeout(() => (new_leader === previous_leader ? player_dom?.classList.add("applied-guess") : player_dom?.classList.add("applied-guess-lead")), 100); // Apply winning styles for new leader
        else setTimeout(() => player_dom?.classList.add("applied-guess"), 100); // Apply gray styles for guess
        setTimeout(() => player_dom?.classList.remove("applied-guess-lead", "applied-guess"), new_leader === player_id ? 1400 : 1200); // Remove guess styles
    }
}
