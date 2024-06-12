import type { GameType, GameFlow, Coordinates, Results, TotalResults } from "~/types";

export const useResults = () => useState<Results>("live_results", () => ({} as Results));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({} as TotalResults));

export class Gameplay {
    static current_map_pin: Ref<Coordinates> = ref({} as Coordinates);
    static searched_location_coords: Ref<Coordinates> = ref({} as Coordinates);

    static mountingProcess = (game_mode: GameType, toggle_map_mobile: Ref<HTMLElement | null>, show_map_button: Ref<boolean>, submit_button: Ref<HTMLElement | null>) => {
        const game_flow = useGameFlow(); // Get game flow state

        const google_map = useGoogleMapHTML(); // Get Google Map DOM element from state
        const google_pan = useGooglePanoramaHTML(); // Get Google Map DOM element from state
        if (!google_map.value) throw new Error("Google Map DOM element not found in gameplay");
        if (!google_pan.value) throw new Error("Google Panorama DOM element not found in gameplay");

        if (game_mode === "CountryBattle") {
            addMapClickListener(CountryBattle.processMapPin); // Add click listener to map as it is somehow removed the initial one in onMounted hook
        } else if (game_mode === "BattleRoyale") {
            addMapClickListener(BattleRoyale.processMapPin); // Add click listener to map as it is somehow removed the initial one in onMounted hook
        }

        Gameplay.googleMapDOMTracker(google_map.value); // Watch and move Google Map DOM element

        // Handle map hover and mobile view of map
        if (window.innerWidth < 1000) {
            setMapZoom(3);
            if (game_flow.value === "PLAYING") google_map.value?.classList.remove("google-map-gameplay");
            toggle_map_mobile.value?.addEventListener("click", () => (game_flow.value === "PLAYING" ? google_map.value?.classList.toggle("google-map-hover") : null));
            show_map_button.value = true;
        } else {
            // Event listners to properly display minimap
            google_map.value.addEventListener("mouseenter", () => {
                if (game_flow.value === "PLAYING") google_map.value?.classList.add("google-map-hover");
                if (game_flow.value === "PLAYING") submit_button.value?.classList.add("submit-button-hover");
            });
            google_map.value.addEventListener("mouseleave", () => {});
            google_pan.value.addEventListener("click", () => {
                if (game_flow.value === "PLAYING") google_map.value?.classList.remove("google-map-hover");
                if (game_flow.value === "PLAYING") submit_button.value?.classList.remove("submit-button-hover");
            });
        }
    };

    // Send signal to backend to start new round
    static nextRound = () => {
        const game = {
            command: "start",
        };
        useSocketConnection().value.send(JSON.stringify(game));
    };

    // Send current pin location to server
    static submitGuess = () => {
        const socket_message = {
            command: "submit_location",
            location: this.current_map_pin.value,
        };

        useSocketConnection().value.send(JSON.stringify(socket_message));
    };

    /**
     * Function is used to change GoogleMap HTMLElement position in the DOM. This is used
     * to minimize GoogleMaps API usage. With such approach, GoogleMap is only loaded for
     * every user once in a lobby instance.
     *
     * @param google_map
     */
    static googleMapDOMTracker = (google_map: HTMLElement) => {
        const game_flow = useGameFlow();

        watch(game_flow, (newVal) => {
            console.log("Game flow changed to: " + newVal); //! Dev
            if (newVal === "MID-ROUND") {
                const mid_round_map_window = document.getElementsByClassName("google-map-window")[0]; // Element is found in GameplayViewsMidRound component.
                if (google_map && mid_round_map_window) {
                    mid_round_map_window.appendChild(google_map);

                    // Chnage class
                    google_map.classList.remove("google-map-hover");
                    google_map.classList.remove("google-map-gameplay");
                    google_map.classList.add("google-map-midround"); // Change class
                }
            }
            if (newVal === "PLAYING") {
                const gameplay_container = document.getElementById("gameplay_container");
                if (google_map && gameplay_container) {
                    gameplay_container.appendChild(google_map);

                    // Change class
                    google_map.classList.remove("google-map-midround"); // Change class
                    google_map.classList.add("google-map-gameplay");
                }
            }
        });
    };

    /**
     * Will apply guess styles to a player who guessed.
     *
     * @param player_id Player that made a guess
     * @param previous_leader Previous leader
     * @param new_leader New leader
     */
    static applyGuessStyles = (player_id: string, previous_leader: string, new_leader: string) => {
        const player_dom: HTMLElement | null = document.getElementById(player_id);
        if (new_leader === player_id) setTimeout(() => (new_leader === previous_leader ? player_dom?.classList.add("applied-guess") : player_dom?.classList.add("applied-guess-lead")), 100); // Apply winning styles for new leader
        else setTimeout(() => player_dom?.classList.add("applied-guess"), 100); // Apply gray styles for guess
        setTimeout(() => player_dom?.classList.remove("applied-guess-lead", "applied-guess"), new_leader === player_id ? 1400 : 1200); // Remove guess styles
    };
}
