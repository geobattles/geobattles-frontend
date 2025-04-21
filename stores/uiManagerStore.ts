import { ref, watch, type Ref, type WatchStopHandle } from "vue";
import { GameState } from "~/types/appTypes";

export const useUIManagerStore = defineStore("uiManager", () => {
    type EventCallback = (event: CustomEvent) => void;

    const googleMap = ref<HTMLElement | null>(null);
    const googlePanorama = ref<HTMLElement | null>(null);
    const stateWatcher = ref<WatchStopHandle | null>(null);

    const eventListeners = ref<{ [key: string]: EventCallback[] }>({});

    const submitButton = ref<HTMLElement | null>(null);
    const gameplayPageContainer = ref<HTMLElement | null>(null);
    const isMobile = ref(false);

    const isVertical = ref(typeof window !== "undefined" ? window.innerWidth < window.innerHeight : false);

    const mountingProcess = (toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>) => {
        const { getMapHTML, getPanoramaHTML } = useGoogleStore();

        googleMap.value = getMapHTML;
        googlePanorama.value = getPanoramaHTML;
        submitButton.value = submit_button.value;

        setupMapListeners(toggle_map_mobile, show_map_button, submit_button);
        gameStateTracker();
    };

    const setupMapListeners = (toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>) => {
        if (isMobile.value) {
            console.debug("SETTING UP MOBILE VIEW"); //! Dev
            setupMobileView(toggle_map_mobile, show_map_button);
        } else {
            console.debug("SETTING UP DESKTOP VIEW"); //! Dev
            setupDesktopView(submit_button);
        }
    };

    const setupMobileView = (toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>) => {
        const { setMapZoom } = useGoogleStore();
        setMapZoom(3); // Make zoom greater on mobile
        toggle_map_mobile.value?.addEventListener("click", handleMapToggleMobile);
        window.addEventListener("resize", updateOrientation);

        show_map_button.value = true;
    };

    const handleMapToggleMobile = () => {
        const gameMode = useGameMode();
        if (gameMode && gameMode.modeLogic.currentState === GameState.PLAYING) {
            googleMap.value?.classList.toggle("google-map-gameplay-container-mobile");
        }
    };

    const setupDesktopView = (submit_button: Ref<HTMLElement | null>) => {
        // Add default gameplay map desktop class
        googleMap.value?.classList.add("google-map-gameplay-container");

        // Add hover effect on map
        if (googleMap.value) googleMap.value.addEventListener("mouseenter", () => handleMapHover(true, submit_button));

        // Remove map hover effect on panorama click
        if (googlePanorama.value) googlePanorama.value.addEventListener("click", () => handleMapHover(false, submit_button));
    };

    const updateOrientation = () => {
        // Update orientation flag
        isVertical.value = window.innerWidth < window.innerHeight;

        const gameMode = useGameMode();

        // Get results container to update (either midRound or endGame)
        let resultsContainer: HTMLElement | null = null;
        if (gameMode.modeLogic.currentState === GameState.MID_ROUND) resultsContainer = document.getElementById("midround-results-container");
        else resultsContainer = document.getElementById("endgame-results-container");

        // Apply classes based on orientation
        if (googleMap.value) {
            if (isVertical.value) {
                // Map classes
                googleMap.value.classList.remove("google-map-midround-container-horizontal");
                googleMap.value.classList.add("google-map-midround-container-vertical");

                // Results classes
                resultsContainer?.classList.remove("midround-results-container-horizontal");
                resultsContainer?.classList.add("midround-results-container-vertical");
            } else {
                // Map classes
                googleMap.value.classList.remove("google-map-midround-container-vertical");
                googleMap.value.classList.add("google-map-midround-container-horizontal");

                // Results classes
                resultsContainer?.classList.remove("midround-results-container-vertical");
                resultsContainer?.classList.add("midround-results-container-horizontal");
            }
        }
    };

    const handleMapHover = (isHovering: boolean, submit_button: Ref<HTMLElement | null>) => {
        const gameMode = useGameMode();
        if (gameMode && gameMode.modeLogic.currentState === GameState.PLAYING) {
            if (isHovering) {
                googleMap.value?.classList.add("google-map-gameplay-container-hovered");
                submit_button.value?.classList.add("submit-button-hovered-map");
            } else {
                googleMap.value?.classList.remove("google-map-gameplay-container-hovered");
                submit_button.value?.classList.remove("submit-button-hovered-map");
            }
        }
    };

    const gameStateTracker = () => {
        // Stop previous watcher if it exists
        if (stateWatcher.value) stateWatcher.value();

        const gameMode = useGameMode();
        stateWatcher.value = watch(
            () => gameMode.modeLogic.currentState,
            (newVal) => {
                console.warn("Game flow changed to: " + newVal);
                if (newVal === GameState.MID_ROUND) {
                    moveMapToMidRound();
                }
                if (newVal === GameState.PLAYING) {
                    // Set panorama to visible and focus (gets rid of the pan panorama staying small after orientation change)
                    const googleStore = useGoogleStore();
                    googleStore.getPanorama.setVisible(true);
                    googleStore.getPanorama.focus();

                    // Move map to gameplay container
                    moveMapToPlaying();
                }
                if (newVal === GameState.FINISHED) {
                    moveMapToFinished();
                }
            },
            { immediate: true }
        );
    };

    const moveMapToPlaying = () => {
        // Handle Mobile Gameplay
        if (isMobile.value) {
            const gameplayMapContainerMobile = document.getElementsByClassName("gameplay-map-mobile-position")[0];

            if (googleMap.value && gameplayMapContainerMobile) {
                gameplayMapContainerMobile.appendChild(googleMap.value);

                // Remove midround class
                googleMap.value.classList.remove("google-map-midround-container-horizontal", "google-map-midround-container-vertical");

                // Gameplay class for mobile map will be handled by Map Button click
            } else {
                console.error("Google Map or Gameplay Map Container not found for mobile gameplay");
            }
        } else {
            // Get gameplay container and insert map as first child
            const gamePlayMapContainer = document.getElementsByClassName("gameplay-map-wrapper")[0];
            if (googleMap.value && gamePlayMapContainer) {
                gamePlayMapContainer.insertBefore(googleMap.value, gamePlayMapContainer.firstChild);

                // Remove midround class
                googleMap.value.classList.remove("google-map-midround-container-horizontal", "google-map-endgame-container");
                submitButton.value?.classList.remove("submit-button-hovered-map");

                // Add gameplay class
                googleMap.value.classList.add("google-map-gameplay-container");
            }
        }
    };

    const moveMapToMidRound = () => {
        // Get MidRound map positional container and results container
        const midRoundMapParentElement = document.getElementById("midround-map-and-results");
        const midRoundResultsContainer = document.getElementById("midround-results-container");

        // Remove and add required classes and append map to the positional container
        if (googleMap.value && midRoundMapParentElement) {
            // Append map to the positional container
            midRoundMapParentElement.appendChild(googleMap.value);

            // Remove gameplay classes
            googleMap.value.classList.remove("google-map-gameplay-container", "google-map-gameplay-container-hovered", "google-map-gameplay-container-mobile");

            // Add midround classes
            if (window.innerWidth < window.innerHeight && isMobile.value) {
                // Handle map classes
                googleMap.value.classList.remove("google-map-midround-container-horizontal");
                googleMap.value.classList.add("google-map-midround-container-vertical");

                // Handle results classes
                midRoundResultsContainer?.classList.remove("midround-results-container-horizontal");
                midRoundResultsContainer?.classList.add("midround-results-container-vertical");
            } else {
                // Handle map classes
                googleMap.value.classList.remove("google-map-midround-container-vertical");
                googleMap.value.classList.add("google-map-midround-container-horizontal");

                // Handle results classes
                midRoundResultsContainer?.classList.remove("midround-results-container-vertical");
                midRoundResultsContainer?.classList.add("midround-results-container-horizontal");
            }
        }
    };

    const moveMapToFinished = () => {
        // Get endgame map positional container and results container
        const endgameMapParentElement = document.getElementById("endgame-map-and-results");
        const endgameResultsContainer = document.getElementById("endgame-results-container");

        // Remove and add required classes and append map to the positional container
        if (googleMap.value && endgameMapParentElement) {
            // Append map to the positional container
            endgameMapParentElement.appendChild(googleMap.value);

            // Remove gameplay classes
            googleMap.value.classList.remove("google-map-gameplay-container", "google-map-gameplay-container-hovered", "google-map-gameplay-container-mobile");

            // Add endgame classes
            if (window.innerWidth < window.innerHeight && isMobile.value) {
                // Handle map classes
                googleMap.value.classList.remove("google-map-midround-container-horizontal");
                googleMap.value.classList.add("google-map-midround-container-vertical");

                // Handle results classes
                endgameResultsContainer?.classList.remove("midround-results-container-horizontal");
                endgameResultsContainer?.classList.add("midround-results-container-vertical");
            } else {
                // Handle map classes
                googleMap.value.classList.remove("google-map-midround-container-vertical");
                googleMap.value.classList.add("google-map-midround-container-horizontal");

                // Handle results classes
                endgameResultsContainer?.classList.remove("midround-results-container-vertical");
                endgameResultsContainer?.classList.add("midround-results-container-horizontal");
            }
        }
    };

    const setGameplayPageContainer = (container: HTMLElement) => {
        gameplayPageContainer.value = container;
    };

    const toggleFullscreen = () => {
        if (gameplayPageContainer.value) {
            if (!document.fullscreenElement) {
                gameplayPageContainer.value.requestFullscreen().catch((err) => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen().catch((err) => {
                    console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
                });
            }
        }
    };

    const applyGuessStyles = (playerID: string, previousLeader: string, newLeader: string) => {
        const player_dom: HTMLElement | null = document.getElementById(playerID);
        if (newLeader === playerID)
            setTimeout(() => (newLeader === previousLeader ? player_dom?.classList.add("applied-guess") : player_dom?.classList.add("applied-guess-lead")), 100);
        // Apply winning styles for new leader
        else setTimeout(() => player_dom?.classList.add("applied-guess"), 100); // Apply gray styles for guess
        setTimeout(() => player_dom?.classList.remove("applied-guess-lead", "applied-guess"), newLeader === playerID ? 1400 : 1200); // Remove guess styles
    };

    const on = (event: string, callback: EventCallback) => {
        if (!eventListeners.value[event]) {
            eventListeners.value[event] = [];
        }
        eventListeners.value[event].push(callback);
    };

    const off = (event: string, callback: EventCallback) => {
        if (!eventListeners.value[event]) return;
        eventListeners.value[event] = eventListeners.value[event].filter((cb) => cb !== callback);
    };

    const dispatch = (event: string, detail: any) => {
        if (!eventListeners.value[event]) return;
        const customEvent = new CustomEvent(event, { detail });
        eventListeners.value[event].forEach((callback) => callback(customEvent));
    };

    const triggerPlayerLeft = (playerName: string) => {
        dispatch("showPlayerLeftToast", { playerName });
    };

    const showPlayerLeftToast = (player_id: string) => {
        console.info("Player left: " + player_id);
        triggerPlayerLeft(player_id); // Ensure the event is dispatched
    };

    return {
        googleMap,
        googlePanorama,
        stateWatcher,
        eventListeners,
        submitButton,
        gameplayPageContainer,
        isMobile,
        isVertical,
        mountingProcess,
        setupMapListeners,
        setupMobileView,
        handleMapToggleMobile,
        setupDesktopView,
        updateOrientation,
        handleMapHover,
        gameStateTracker,
        moveMapToPlaying,
        moveMapToMidRound,
        moveMapToFinished,
        setGameplayPageContainer,
        toggleFullscreen,
        applyGuessStyles,

        // Event handling methods
        on,
        off,
        dispatch,
        triggerPlayerLeft,
        showPlayerLeftToast,
    };
});
