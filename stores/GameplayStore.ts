import { GameState, type Coordinates, type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";
import { BattleRoyaleMode } from "~/core/BattleRoyaleMode";
import { CountryBattleMode } from "~/core/CountryBattleMode";
import { GameModeFactory } from "~/core/GameModeFactory";
import { SOCKET_COMMANDS } from "~/core/constants";

export const useGameplayStore = defineStore("gameplay", () => {
    const currentMode = ref<"BattleRoyale" | "CountryBattle" | null>(null);
    const currentState = ref(GameState.WAITING);
    const currentRound = ref(0);
    const modeLogic = ref<BattleRoyaleMode | CountryBattleMode | null>(null);
    const uiManager = useUIManager().value;

    const currentMapPin = ref<Coordinates>({} as Coordinates);
    const searchedLocationCoords = ref<Coordinates>({} as Coordinates);

    const COUNTDOWN = 3000;

    const initializeGameplay = () => {
        const gameMode = useLobbyStore().lobbySettings?.conf.mode;
        currentMode.value = gameMode === 1 ? "BattleRoyale" : gameMode === 2 ? "CountryBattle" : null;

        if (!currentMode.value) throw new Error("No game mode selected");

        modeLogic.value = GameModeFactory.createGameMode(currentMode.value);

        currentState.value = GameState.WAITING;
        currentRound.value = 0;
    };

    const updateGameMode = (newGameType: "BattleRoyale" | "CountryBattle") => {
        if (currentMode.value !== newGameType) {
            modeLogic.value?.cleanup(); // Clear Map and instance from previous game mode

            // Update game mode
            currentMode.value = newGameType;
            modeLogic.value = GameModeFactory.createGameMode(newGameType);
            console.info(`Game mode updated to: ${newGameType}`);

            // Reset game state
            if (currentState.value !== GameState.FINISHED) currentState.value = GameState.WAITING;
            currentMapPin.value = {} as Coordinates;
            searchedLocationCoords.value = {} as Coordinates;
        }
    };

    /**
     * Function sends a start round message to the server that the lobby admin would like to start a new round.
     */
    const sendStartRoundSocketMessage = () => {
        useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START });
    };

    /**
     * Function starts a new round for the current game mode.
     */
    const startRound = () => {
        // Set gameplay to STARTING
        currentState.value = GameState.STARTING;

        if (!modeLogic.value) throw new Error("Mode store is not initialized");
        modeLogic.value.startRound();

        // Set to PLAYING after countdown
        setTimeout(() => {
            currentState.value = GameState.PLAYING;
            setMapClickEventListener();
        }, COUNTDOWN);
    };

    /**
     * Function submits the current guess to the server.
     */
    const submitGuess = () => {
        const socket_message = {
            command: SOCKET_COMMANDS.SUBMIT_LOCATION,
            location: currentMapPin.value,
        };

        const socketStore = useWebSocketStore();
        socketStore.sendMessage(socket_message);
    };

    const finishRound = (totalResults: TotalResults, roundResults: Results, polygon?: any) => {
        if (!modeLogic.value) throw new Error("Mode store is not initialized");
        currentState.value = GameState.MID_ROUND;
        modeLogic.value.finishRound(totalResults, roundResults, polygon); // Finish round for the game mode
    };

    const finishGame = () => {
        console.info(`Finishing gameplay.`);
        currentState.value = GameState.FINISHED;
        currentRound.value = 0;

        if (!modeLogic.value) throw new Error("Mode store is not initialized");
        modeLogic.value.finishGame();

        // Clear click listeners after game ends
        const gMap = isGoogleMap();
        google.maps.event.clearListeners(gMap, "click");
    };

    const processClickedCountry = (polygon: any, countryCode: string): void => {
        if (modeLogic.value instanceof CountryBattleMode) {
            modeLogic.value.processClickedCountry(polygon, countryCode);
        }
    };

    const processNewResult = (user: string, player_result: ResultsInfo): void => {
        if (!modeLogic.value) throw new Error("Mode store is not initialized");
        modeLogic.value.processNewResult(user, player_result);
    };

    const mountingProcess = (toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>): void => {
        uiManager.mountingProcess(toggle_map_mobile, show_map_button, submit_button);
        uiManager.googleMapDOMTracker();
    };

    /**
     * TODO: Should be moved to UI manager maybe? Or idk something needs to be changed here.
     * @param playerID
     * @param previousLeader
     * @param newLeader
     */
    const applyGuessStyles = (playerID: string, previousLeader: string, newLeader: string) => {
        const player_dom: HTMLElement | null = document.getElementById(playerID);
        if (newLeader === playerID) setTimeout(() => (newLeader === previousLeader ? player_dom?.classList.add("applied-guess") : player_dom?.classList.add("applied-guess-lead")), 100); // Apply winning styles for new leader
        else setTimeout(() => player_dom?.classList.add("applied-guess"), 100); // Apply gray styles for guess
        setTimeout(() => player_dom?.classList.remove("applied-guess-lead", "applied-guess"), newLeader === playerID ? 1400 : 1200); // Remove guess styles
    };

    return {
        currentMode,
        currentState,
        currentRound,
        modeLogic,
        currentMapPin,
        searchedLocationCoords,
        initializeGameplay,
        updateGameMode,
        sendStartRoundSocketMessage,
        startRound,
        submitGuess,
        finishRound,
        finishGame,
        processClickedCountry,
        processNewResult,
        mountingProcess,
        applyGuessStyles,
    };
});

// ========== Private Methods (HELPERS) ==========
const setMapClickEventListener = () => {
    const gMap = isGoogleMap();
    const { modeLogic } = useGameplayStore();

    // Remove existing listeners
    google.maps.event.clearListeners(gMap, "click");

    // Add new listener s
    if (!modeLogic) throw new Error("Mode store is not initialized");
    addMapClickListener(modeLogic.processMapPin);
};
