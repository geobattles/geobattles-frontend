import { GameState } from "~/types/appTypes";

type EventCallback = (event: CustomEvent) => void;

export class UIManager {
    private googleMap: HTMLElement | null = null;
    private googlePanorama: HTMLElement | null = null;

    private eventListeners: { [key: string]: EventCallback[] } = {};

    private submitButton: HTMLElement | null = null; // Used to properly handle submit button on map hover effect
    private gameplayPageContainer: HTMLElement | null = null; // Gameplay container (element to be fullscreened on user request)
    private isMobile: boolean = false; // Flag to check if the current device is mobile or desktop
    private isVertical: boolean = false; // Flag to check if the current device is vertical or horizontal

    constructor() {}

    /**
     * Will handle the mounting process of Gameplay
     * Will setup the map listeners based on the screen size for mobile or desktop.
     * Listeners like hover on map, click on map button (mobile), etc.
     *
     * @param toggle_map_mobile
     * @param show_map_button
     * @param submit_button
     */
    mountingProcess(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>): void {
        const google_map = useGoogleMapHTML();
        const google_pan = useGooglePanoramaHTML();
        if (!google_map.value) throw new Error("Google Map DOM element not found in gameplay");
        if (!google_pan.value) throw new Error("Google Panorama DOM element not found in gameplay");

        this.googleMap = google_map.value;
        this.googlePanorama = google_pan.value;
        this.submitButton = submit_button.value;

        this.setupMapListeners(toggle_map_mobile, show_map_button, submit_button);
    }

    private setupMapListeners(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>): void {
        if (this.isMobile) {
            console.log("SETTING UP MOBILE VIEW"); //! Dev
            this.setupMobileView(toggle_map_mobile, show_map_button);
        } else {
            console.log("SETTING UP DESKTOP VIEW"); //! Dev
            this.setupDesktopView(submit_button);
        }
    }

    private setupMobileView(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>): void {
        setMapZoom(3); // Make zoom greater on mobile
        toggle_map_mobile.value?.addEventListener("click", this.handleMapToggleMobile.bind(this));
        window.addEventListener("resize", this.updateOrientation.bind(this));

        show_map_button.value = true;
    }

    // Method toggles class for mobile map (to show or hide the map)
    private handleMapToggleMobile(): void {
        const gameStore = useGameplayStore();
        if (gameStore && gameStore.currentState === GameState.PLAYING) {
            this.googleMap?.classList.toggle("google-map-gameplay-container-mobile");
        }
    }

    private setupDesktopView(submit_button: Ref<HTMLElement | null>): void {
        // Add default gameplay map desktop class
        this.googleMap?.classList.add("google-map-gameplay-container");

        // Add hover effect on map
        if (this.googleMap) this.googleMap.addEventListener("mouseenter", () => this.handleMapHover(true, submit_button));

        // Remove map hover effect on panorama click
        if (this.googlePanorama) this.googlePanorama.addEventListener("click", () => this.handleMapHover(false, submit_button));
    }

    private updateOrientation(): void {
        console.log("ORIENTATION UPDATE | is vertical? --> ", window.innerWidth < window.innerHeight); //! Dev
        // Update orientation flag
        this.isVertical = window.innerWidth < window.innerHeight;

        const gameStore = useGameplayStore();

        // Get results container to update (either midRound or endGame)
        let resultsContainer: HTMLElement | null = null;
        if (gameStore.currentState === GameState.MID_ROUND) resultsContainer = document.getElementById("midround-results-container");
        else resultsContainer = document.getElementById("endgame-results-container");

        // Apply classes based on orientation
        if (this.googleMap) {
            if (this.isVertical) {
                // Map classes
                this.googleMap.classList.remove("google-map-midround-container-horizontal");
                this.googleMap.classList.add("google-map-midround-container-vertical");

                // Results classes
                resultsContainer?.classList.remove("midround-results-container-horizontal");
                resultsContainer?.classList.add("midround-results-container-vertical");
            } else {
                // Map classes
                this.googleMap.classList.remove("google-map-midround-container-vertical");
                this.googleMap.classList.add("google-map-midround-container-horizontal");

                // Results classes
                resultsContainer?.classList.remove("midround-results-container-vertical");
                resultsContainer?.classList.add("midround-results-container-horizontal");
            }
        }
    }
    // Applied only for Desktop view for hover effect on map
    private handleMapHover(isHovering: boolean, submit_button: Ref<HTMLElement | null>): void {
        const gameStore = useGameplayStore();
        if (gameStore && gameStore.currentState === GameState.PLAYING) {
            if (isHovering) {
                this.googleMap?.classList.add("google-map-gameplay-container-hovered");
                submit_button.value?.classList.add("submit-button-hovered-map");
            } else {
                this.googleMap?.classList.remove("google-map-gameplay-container-hovered");
                submit_button.value?.classList.remove("submit-button-hovered-map");
            }
        }
    }

    /**
     * Will track the game flow and move the map to the required position based on the game state.
     */
    googleMapDOMTracker(): void {
        const gameStore = useGameplayStore();

        watch(
            () => gameStore.currentState,
            (newVal) => {
                console.warn("Game flow changed to: " + newVal);
                if (newVal === GameState.MID_ROUND) {
                    this.moveMapToMidRound();
                }
                if (newVal === GameState.PLAYING) {
                    this.moveMapToPlaying();
                }
                if (newVal === GameState.FINISHED) {
                    this.moveMapToFinished();
                }
            },
            { immediate: true }
        );
    }

    /**
     * Will move map back to playing state for Desktop view.
     * For mobile, the click on Map Button alone will handle everything.
     */
    private moveMapToPlaying(): void {
        // Handle Mobile Gameplay
        if (this.isMobile) {
            const gameplayMapContainerMobile = document.getElementsByClassName("gameplay-map-mobile-position")[0];

            if (this.googleMap && gameplayMapContainerMobile) {
                gameplayMapContainerMobile.appendChild(this.googleMap);

                // Remove midround class
                this.googleMap.classList.remove("google-map-midround-container-horizontal", "google-map-midround-container-vertical");

                // Gameplay class for mobile map will be handled by Map Button click
            } else {
                console.error("Google Map or Gameplay Map Container not found for mobile gameplay");
            }
        } else {
            // Get gameplay container and insert map as first child
            const gamePlayMapContainer = document.getElementsByClassName("gameplay-map-wrapper")[0];
            if (this.googleMap && gamePlayMapContainer) {
                gamePlayMapContainer.insertBefore(this.googleMap, gamePlayMapContainer.firstChild);

                // Remove midround class
                this.googleMap.classList.remove("google-map-midround-container-horizontal", "google-map-endgame-container");
                this.submitButton?.classList.remove("submit-button-hovered-map");

                // Add gameplay class
                this.googleMap.classList.add("google-map-gameplay-container");
            }
        }
    }

    /**
     * Will move map to mid round state.
     */
    private moveMapToMidRound(): void {
        // Get MidRound map positional container and results container
        const midRoundMapParentElement = document.getElementById("midround-map-and-results");
        const midRoundResultsContainer = document.getElementById("midround-results-container");

        // Remove and add required classes and append map to the positional container
        if (this.googleMap && midRoundMapParentElement) {
            // Append map to the positional container
            midRoundMapParentElement.appendChild(this.googleMap);

            // Remove gameplay classes
            this.googleMap.classList.remove("google-map-gameplay-container", "google-map-gameplay-container-hovered", "google-map-gameplay-container-mobile");

            // Add midround classes
            if (window.innerWidth < window.innerHeight && this.isMobile) {
                // Handle map classes
                this.googleMap.classList.remove("google-map-midround-container-horizontal");
                this.googleMap.classList.add("google-map-midround-container-vertical");

                // Handle results classes
                midRoundResultsContainer?.classList.remove("midround-results-container-horizontal");
                midRoundResultsContainer?.classList.add("midround-results-container-vertical");
            } else {
                // Handle map classes
                this.googleMap.classList.remove("google-map-midround-container-vertical");
                this.googleMap.classList.add("google-map-midround-container-horizontal");

                // Handle results classes
                midRoundResultsContainer?.classList.remove("midround-results-container-vertical");
                midRoundResultsContainer?.classList.add("midround-results-container-horizontal");
            }
        }
    }

    /**
     * Will move map to finished game state. (currently similiar to midround
     * and just takes midround classes)
     */
    private moveMapToFinished(): void {
        // Get endgame map positional container and results container
        const endgameMapParentElement = document.getElementById("endgame-map-and-results");
        const endgameResultsContainer = document.getElementById("endgame-results-container");

        // Remove and add required classes and append map to the positional container
        if (this.googleMap && endgameMapParentElement) {
            // Append map to the positional container
            endgameMapParentElement.appendChild(this.googleMap);

            // Remove gameplay classes
            this.googleMap.classList.remove("google-map-gameplay-container", "google-map-gameplay-container-hovered", "google-map-gameplay-container-mobile");

            // Add endgame classes
            if (window.innerWidth < window.innerHeight && this.isMobile) {
                // Handle map classes
                this.googleMap.classList.remove("google-map-midround-container-horizontal");
                this.googleMap.classList.add("google-map-midround-container-vertical");

                // Handle results classes
                endgameResultsContainer?.classList.remove("midround-results-container-horizontal");
                endgameResultsContainer?.classList.add("midround-results-container-vertical");
            } else {
                // Handle map classes
                this.googleMap.classList.remove("google-map-midround-container-vertical");
                this.googleMap.classList.add("google-map-midround-container-horizontal");

                // Handle results classes
                endgameResultsContainer?.classList.remove("midround-results-container-vertical");
                endgameResultsContainer?.classList.add("midround-results-container-horizontal");
            }
        }
    }

    setGameplayPageContainer(container: HTMLElement): void {
        this.gameplayPageContainer = container;
    }

    setMobile(isMobile: boolean): void {
        this.isMobile = isMobile;
    }

    getIsMobile(): boolean {
        return this.isMobile;
    }

    toggleFullscreen(): void {
        // const elem = this.gameplayPageContainer;
        if (this.gameplayPageContainer) {
            if (!document.fullscreenElement) {
                this.gameplayPageContainer.requestFullscreen().catch((err) => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen().catch((err) => {
                    console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
                });
            }
        }
    }

    // Method to add event listeners
    on(event: string, callback: EventCallback): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    // Method to remove event listeners
    off(event: string, callback: EventCallback): void {
        if (!this.eventListeners[event]) return;
        this.eventListeners[event] = this.eventListeners[event].filter((cb) => cb !== callback);
    }

    // Method to dispatch events
    dispatch(event: string, detail: any): void {
        if (!this.eventListeners[event]) return;
        const customEvent = new CustomEvent(event, { detail });
        this.eventListeners[event].forEach((callback) => callback(customEvent));
    }

    // Example method that triggers an event
    triggerPlayerLeft(playerName: string): void {
        this.dispatch("showPlayerLeftToast", { playerName });
    }

    showPlayerLeftToast(player_id: string): void {
        console.info("Player left: " + player_id);
        this.triggerPlayerLeft(player_id); // Ensure the event is dispatched
    }
}
