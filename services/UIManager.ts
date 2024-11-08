import { GameState } from "./GameFlowManager";
type EventCallback = (event: CustomEvent) => void;

export class UIManager {
    private googleMap: HTMLElement | null = null;
    private googlePanorama: HTMLElement | null = null;
    private eventListeners: { [key: string]: EventCallback[] } = {};

    constructor() {}

    mountingProcess(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>): void {
        const google_map = useGoogleMapHTML();
        const google_pan = useGooglePanoramaHTML();
        if (!google_map.value) throw new Error("Google Map DOM element not found in gameplay");
        if (!google_pan.value) throw new Error("Google Panorama DOM element not found in gameplay");

        this.googleMap = google_map.value;
        this.googlePanorama = google_pan.value;

        this.setupMapListeners(toggle_map_mobile, show_map_button, submit_button);
    }

    private setupMapListeners(toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>): void {
        if (window.innerWidth < 1000) {
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
                this.googleMap?.classList.toggle("google-map-hover");
            }
        });
        show_map_button.value = true;
    }

    private setupDesktopView(submit_button: Ref<HTMLElement | null>): void {
        if (this.googleMap) {
            this.googleMap.addEventListener("mouseenter", () => this.handleMapHover(true, submit_button));
            this.googleMap.addEventListener("mouseleave", () => {});
        }
        if (this.googlePanorama) {
            this.googlePanorama.addEventListener("click", () => this.handleMapHover(false, submit_button));
        }
    }

    private handleMapHover(isHovering: boolean, submit_button: Ref<HTMLElement | null>): void {
        const gameFlowManager = useGameFlowManager().value;
        if (gameFlowManager && gameFlowManager.currentState === GameState.PLAYING) {
            if (isHovering) {
                this.googleMap?.classList.add("google-map-hover");
                submit_button.value?.classList.add("submit-button-hover");
            } else {
                this.googleMap?.classList.remove("google-map-hover");
                submit_button.value?.classList.remove("submit-button-hover");
            }
        }
    }

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

    private moveMapToPlaying(): void {
        const gameplay_container = document.getElementById("gameplay_container");
        if (this.googleMap && gameplay_container) {
            gameplay_container.appendChild(this.googleMap);
            this.googleMap.classList.remove("google-map-midround");
            this.googleMap.classList.add("google-map-gameplay");
        }
    }

    private moveMapToMidRound(): void {
        const mid_round_map_window = document.querySelector(".google-map-window");
        if (this.googleMap && mid_round_map_window) {
            mid_round_map_window.appendChild(this.googleMap);
            this.googleMap.classList.remove("google-map-hover", "google-map-gameplay");
            this.googleMap.classList.add("google-map-midround");
        }
    }

    private moveMapToFinished(): void {
        const gameplay_container = document.getElementById("google-map-finished");
        if (this.googleMap && gameplay_container) {
            gameplay_container.appendChild(this.googleMap);
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
