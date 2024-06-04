import type { User, LobbyInfo, Coordinates, Results, GameFlow, TotalResults, RoundResults, GameType } from "~/types";

// Here are defined all states that are used in the app
export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useLobbySettings = () => useState<LobbyInfo>("lobby_settings", () => ({} as LobbyInfo));
export const useLobbySettingsOriginal = () => useState<LobbyInfo>("lobby_settings_original", () => ({} as LobbyInfo));
export const useSocketConnection = () => useState<WebSocket>("socket_connection", () => ({} as WebSocket));
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);
export const useLobbyList = () => useState<string[]>("lobby_list", () => []);

// Settings states
export const useModifySettingsModal = () => useState<boolean>("modify_settings_modal", () => false);
export const useGameType = () => useState<GameType>("game_type", () => undefined);

// Google map states
export const useGoogleMap = () => useState<google.maps.Map | undefined>("google_map", () => undefined);
export const useGoogleMapHTML = () => useState<HTMLElement | null>("google_map_html", () => null);
export const useGooglePanorama = () => useState<google.maps.StreetViewPanorama>("google_panorama", () => ({} as google.maps.StreetViewPanorama));
export const useGooglePanoramaHTML = () => useState<HTMLElement | null>("google_panorama_html", () => null);
export const useMapMarkers = () => useState<google.maps.Marker[]>("map_markers", () => [] as google.maps.Marker[]);

// Gameplay states
export const useCoordinates = () => useState<Coordinates>("game_coordinates", () => ({} as Coordinates));
export const useCurrentPin = () => useState<Coordinates>("current_pin", () => ({} as Coordinates));
export const useResults = () => useState<Results>("live_results", () => ({} as Results));
export const useRoundResults = () => useState<RoundResults>("live_results", () => ({} as RoundResults));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({} as TotalResults));
export const useGameFlow = () => useState<GameFlow>("game_flow", () => undefined);
export const usePolyLines = () => useState<google.maps.Polyline[]>("poly_lines", () => [] as google.maps.Polyline[]);
export const useIsSubmitDisabled = () => useState<boolean>("submit_button", () => false);

// Countries states
export const useCountryList = () => useState<string[]>("country_list", () => [] as string[]);
export const useFilteredCountryList = () => useState<string[]>("filtered_country_list", () => [] as string[]);
export const useCountryInput = () => useState<string>("country_input", () => "");
