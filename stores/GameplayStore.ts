import { GameState, type Coordinates, type Results, type ResultsInfo, type TotalResults } from "~/types/appTypes";

export const useGameplayStore = defineStore("gameplay", () => {
    // GameMode and GameMode Logic
    const currentMode = ref<"BattleRoyale" | "CountryBattle" | null>(null);
    const modeLogic = ref<ReturnType<typeof useBattleRoyaleMode> | ReturnType<typeof useCountryBattleMode> | null>(null);

    // Gameplay state
    const currentState = ref(GameState.WAITING);
    const currentRound = ref(0);
    const currentMapPin = ref<Coordinates>({} as Coordinates);
    const searchedLocationCoords = ref<Coordinates>({} as Coordinates);

    // UI Manager
    const uiManager = useUIManager().value;

    // Constants
    const COUNTDOWN = 3000;

    // Initialized once player joins the lobby
    const initializeGameplay = () => {
        const gameMode = useLobbyStore().lobbySettings?.conf.mode;
        currentMode.value = gameMode === 1 ? "BattleRoyale" : gameMode === 2 ? "CountryBattle" : null;
        if (!currentMode.value) throw new Error("No game mode selected when initializing gameplay");

        modeLogic.value = currentMode.value === "BattleRoyale" ? useBattleRoyaleMode() : useCountryBattleMode();

        currentState.value = GameState.WAITING;
        currentRound.value = 0;
    };

    const updateGameMode = (newGameType: "BattleRoyale" | "CountryBattle") => {
        if (currentMode.value !== newGameType) {
            // Update game mode
            currentMode.value = newGameType;
            modeLogic.value = newGameType === "BattleRoyale" ? useBattleRoyaleMode() : useCountryBattleMode();
            console.info(`Game mode updated to: ${newGameType}`);

            // Reset game state
            if (currentState.value !== GameState.FINISHED) currentState.value = GameState.WAITING;
            currentMapPin.value = {} as Coordinates;
            searchedLocationCoords.value = {} as Coordinates;
        }
    };

    // Function sends a start round message to the server that the lobby admin would like to start a new round.
    const sendStartRoundSocketMessage = () => {
        useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START });
    };

    // Function starts a new round for the current game mode.
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

    // Function submits the current guess to the server.
    const submitGuess = () => {
        const socket_message = {
            command: SOCKET_COMMANDS.SUBMIT_LOCATION,
            location: currentMapPin.value,
        };

        const socketStore = useWebSocketStore();
        socketStore.sendMessage(socket_message);
    };

    const finishRound = (totalResults: TotalResults, roundResults: Results, round: number, polygon?: any) => {
        if (!modeLogic.value) throw new Error("Mode store is not initialized");
        currentState.value = GameState.MID_ROUND;
        currentRound.value = round;
        modeLogic.value.finishRound(totalResults, roundResults, polygon); // Finish round for the game mode
    };

    const finishGame = () => {
        console.info(`Finishing gameplay.`);
        currentState.value = GameState.FINISHED;
        currentRound.value = 0;

        if (!modeLogic.value) throw new Error("Mode store is not initialized");
        modeLogic.value.finishGame();
    };

    const processClickedCountry = (polygon: any, countryCode: string): void => {
        if (modeLogic.value && "processClickedCountry" in modeLogic.value) {
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

    const exitGameplay = () => {
        // Clear click listeners after game ends
        const gMap = isGoogleMap();
        google.maps.event.clearListeners(gMap, "click");
        modeLogic.value?.clearMap();
    };

    /**
     * TODO: Should be moved to UI manager maybe? Or idk something needs to be changed here.
     * @param playerID
     * @param previousLeader
     * @param newLeader
     */
    const applyGuessStyles = (playerID: string, previousLeader: string, newLeader: string) => {
        const player_dom: HTMLElement | null = document.getElementById(playerID);
        if (newLeader === playerID)
            setTimeout(() => (newLeader === previousLeader ? player_dom?.classList.add("applied-guess") : player_dom?.classList.add("applied-guess-lead")), 100);
        // Apply winning styles for new leader
        else setTimeout(() => player_dom?.classList.add("applied-guess"), 100); // Apply gray styles for guess
        setTimeout(() => player_dom?.classList.remove("applied-guess-lead", "applied-guess"), newLeader === playerID ? 1400 : 1200); // Remove guess styles
    };

    return {
        currentMode: readonly(currentMode),
        currentState: readonly(currentState),
        currentRound: readonly(currentRound),
        modeLogic: readonly(modeLogic),
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
        exitGameplay,
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
