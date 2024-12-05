import { GameState } from "./GameFlowManager";
type EventCallback = (event: CustomEvent) => void;

export class UIManager {
    private googleMap: HTMLElement | null = null;
    private googlePanorama: HTMLElement | null = null;

    private eventListeners: { [key: string]: EventCallback[] } = {};

    private submitButton: HTMLElement | null = null; // Used to properly handle submit button on map hover effect
    private gameplayPageContainer: HTMLElement | null = null; // Gameplay container (element to be fullscreened on user request)
    private isMobile: boolean = false; // Flag to check if the current device is mobile or desktop

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
            this.setupMobileView(toggle_map_mobile, show_map_button);
        } else {
            this.setupDesktopView(submit_button);
        }
    }

    private setupMobileView(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>): void {
        setMapZoom(3);
        toggle_map_mobile.value?.addEventListener("click", () => {
            const gameFlowManager = useGameFlowManager().value;
            if (gameFlowManager && gameFlowManager.currentState === GameState.PLAYING) {
                this.googleMap?.classList.toggle("google-map-gameplay-container-mobile");
            }
        });
        show_map_button.value = true;
    }

    private setupDesktopView(submit_button: Ref<HTMLElement | null>): void {
        // Add default gameplay map desktop class
        this.googleMap?.classList.add("google-map-gameplay-container");

        // Add hover effect on map
        if (this.googleMap) this.googleMap.addEventListener("mouseenter", () => this.handleMapHover(true, submit_button));

        // Remove map hover effect on panorama click
        if (this.googlePanorama) this.googlePanorama.addEventListener("click", () => this.handleMapHover(false, submit_button));
    }

    // Applied only for Desktop view for hover effect on map
    private handleMapHover(isHovering: boolean, submit_button: Ref<HTMLElement | null>): void {
        const gameFlowManager = useGameFlowManager().value;
        if (gameFlowManager && gameFlowManager.currentState === GameState.PLAYING) {
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
        const gameFlowManager = useGameFlowManager().value;
        if (!gameFlowManager) throw new Error("GameFlowManager is not initialized");

        watch(
            () => gameFlowManager.currentState,
            (newVal) => {
                console.log("Game flow changed to: " + newVal);
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
                gameplayMapContainerMobile.insertBefore(this.googleMap, gameplayMapContainerMobile.firstChild);

                // Remove midround class
                this.googleMap.classList.remove("google-map-midround-container", "google-map-midround-container-vertical");

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
                this.googleMap.classList.remove("google-map-midround-container", "google-map-endgame-container");
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
        // Get MidRound map positional container
        const midRoundGameMapPosition = document.getElementsByClassName("google-map-midround-position")[0];

        // Remove and add required classes and append map to the positional container
        if (this.googleMap && midRoundGameMapPosition) {
            midRoundGameMapPosition.appendChild(this.googleMap);
            this.googleMap.classList.remove("google-map-gameplay-container", "google-map-gameplay-container-hovered", "google-map-gameplay-container-mobile");

            if (window.innerWidth < window.innerHeight && this.isMobile) {
                this.googleMap.classList.add("google-map-midround-container-vertical");
            } else {
                this.googleMap.classList.add("google-map-midround-container");
            }
        }
    }

    /**
     * Will move map to finished game state. (currently similiar to midround)
     */
    private moveMapToFinished(): void {
        // Get EndGame map positional container
        const finishedGameMapPosition = document.getElementsByClassName("google-map-finished-position")[0];

        // Remove and add required classes and append map to the positional container
        if (this.googleMap && finishedGameMapPosition) {
            // Remove midroung and gameplay classes
            this.googleMap.classList.remove("google-map-midround-container", "google-map-gameplay-container", "google-map-gameplay-container-hovered");

            // Add endgame class
            if (window.innerWidth < 768) this.googleMap.classList.add("google-map-endgame-container-vertical");
            else this.googleMap.classList.add("google-map-endgame-container");

            // Append map to the positional container
            finishedGameMapPosition.appendChild(this.googleMap);
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
