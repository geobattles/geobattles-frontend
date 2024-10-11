import type { Ref } from "vue";
import { GameState } from "./GameFlowManager";

export class UIManager {
    private googleMap: HTMLElement | null = null;
    private googlePanorama: HTMLElement | null = null;

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
        if (this.googleMap) this.googleMap.classList.remove("google-map-gameplay");
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
            },
            { immediate: true }
        );
    }

    private moveMapToMidRound(): void {
        const mid_round_map_window = document.querySelector(".google-map-window");
        if (this.googleMap && mid_round_map_window) {
            mid_round_map_window.appendChild(this.googleMap);
            this.googleMap.classList.remove("google-map-hover", "google-map-gameplay");
            this.googleMap.classList.add("google-map-midround");
        }
    }

    private moveMapToPlaying(): void {
        const gameplay_container = document.getElementById("gameplay_container");
        if (this.googleMap && gameplay_container) {
            gameplay_container.appendChild(this.googleMap);
            this.googleMap.classList.remove("google-map-midround");
            this.googleMap.classList.add("google-map-gameplay");
        }
    }
}

export const useUIManager = () => useState<UIManager>("uiManager", () => new UIManager());
