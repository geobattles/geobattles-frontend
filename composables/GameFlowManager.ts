import { ref, watch } from "vue";
import type { Ref } from "vue";
import { BattleRoyale } from "./GameplayBattleRoyale";
import type { GameType, GameFlow, Coordinates, Results, TotalResults, ResultsInfo, GameMode } from "~/types";

export const useResults = () => useState<Results>("live_results", () => ({} as Results));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({} as TotalResults));

export enum GameState {
    WAITING = "WAITING",
    STARTING = "STARTING",
    PLAYING = "PLAYING",
    MID_ROUND = "MID-ROUND",
    FINISHED = "FINISHED",
}

export class GameFlowManager {
    public gameMode: GameMode;
    public currentState: GameState;
    public current_map_pin: Ref<Coordinates>;
    public searched_location_coords: Ref<Coordinates>;

    constructor(gameType: GameType) {
        console.log("GameFlowManager CONTRUCTED"); //! Dev

        this.currentState = GameState.WAITING;
        this.gameMode = this.createGameMode(gameType);
        this.current_map_pin = ref({} as Coordinates);
        this.searched_location_coords = ref({} as Coordinates);
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
            console.log(`Game mode updated to: ${newGameType}`);

            // Reset game state
            if (this.currentState !== GameState.FINISHED) this.currentState = GameState.WAITING;
            this.current_map_pin.value = {} as Coordinates;
            this.searched_location_coords.value = {} as Coordinates;
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
        const game = {
            command: "start",
        };
        const socket = useSocketConnection().value;
        if (socket) socket.send(JSON.stringify(game));
    }

    /**
     * Method is used when we receive a new round message from the server.
     */
    startRound(): void {
        this.setGameState(GameState.STARTING); // Change game flow state
        setTimeout(() => this.setGameState(GameState.PLAYING), 3000); // For 3 seconds countdown

        // Start round for the game mode
        this.gameMode.startRound();

        // Set new click listener after 3 seconds countdown
        setTimeout(() => {
            console.log("SETTING ENW CLICK LISTENER for game mode", this.gameMode.gameType); //! Dev
            this.setMapClickEventListener();
        }, 3000);
    }

    finishRound(total_results: TotalResults, round_results: Results, polygon?: any): void {
        this.setGameState(GameState.MID_ROUND); // Change game flow state
        this.gameMode.finishRound(total_results, round_results, polygon);
    }

    finishGame(): void {
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
            location: this.current_map_pin.value,
        };

        const socket = useSocketConnection().value;
        if (socket) socket.send(JSON.stringify(socket_message));
    }

    setMapClickEventListener(): void {
        // Clear previous listener
        const google_map_instance = isGoogleMap();
        google.maps.event.clearListeners(google_map_instance, "click");

        // Add new listener
        addMapClickListener(this.gameMode.processMapPin);
    }

    mountingProcess(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>): void {
        const google_map = useGoogleMapHTML();
        const google_pan = useGooglePanoramaHTML();
        if (!google_map.value) throw new Error("Google Map DOM element not found in gameplay");
        if (!google_pan.value) throw new Error("Google Panorama DOM element not found in gameplay");

        this.googleMapDOMTracker(google_map.value);

        // Handle map hover and mobile view of map
        if (window.innerWidth < 1000) {
            setMapZoom(3);
            if (this.currentState === GameState.PLAYING) google_map.value?.classList.remove("google-map-gameplay");
            toggle_map_mobile.value?.addEventListener("click", () => (this.currentState === GameState.PLAYING ? google_map.value?.classList.toggle("google-map-hover") : null));
            show_map_button.value = true;
        } else {
            // Event listeners to properly display minimap
            google_map.value.addEventListener("mouseenter", () => {
                if (this.currentState === GameState.PLAYING) google_map.value?.classList.add("google-map-hover");
                if (this.currentState === GameState.PLAYING) submit_button.value?.classList.add("submit-button-hover");
            });
            google_map.value.addEventListener("mouseleave", () => {});
            google_pan.value.addEventListener("click", () => {
                if (this.currentState === GameState.PLAYING) google_map.value?.classList.remove("google-map-hover");
                if (this.currentState === GameState.PLAYING) submit_button.value?.classList.remove("submit-button-hover");
            });
        }
    }

    /**
     * Function is used to change GoogleMap HTMLElement position in the DOM. This is used
     * to minimize GoogleMaps API usage. With such approach, GoogleMap is only loaded for
     * every user once in a lobby instance.
     *
     * @param google_map
     */
    googleMapDOMTracker(google_map: HTMLElement): void {
        watch(
            () => this.currentState,
            (newVal) => {
                console.log("Game flow changed to: " + newVal); //! Dev
                if (newVal === GameState.MID_ROUND) {
                    const mid_round_map_window = document.getElementsByClassName("google-map-window")[0]; // Element is found in GameplayViewsMidRound component.
                    if (google_map && mid_round_map_window) {
                        mid_round_map_window.appendChild(google_map);

                        // Change class
                        google_map.classList.remove("google-map-hover");
                        google_map.classList.remove("google-map-gameplay");
                        google_map.classList.add("google-map-midround");
                    }
                }
                if (newVal === GameState.PLAYING) {
                    const gameplay_container = document.getElementById("gameplay_container");
                    if (google_map && gameplay_container) {
                        gameplay_container.appendChild(google_map);

                        // Change class
                        google_map.classList.remove("google-map-midround");
                        google_map.classList.add("google-map-gameplay");
                    }
                }
            }
        );
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
