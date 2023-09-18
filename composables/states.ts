import type { User, LobbyInfo, Coordinates, Results, GameFlow, TotalResults, RoundResults } from "~/types";

// Here are defined all states that are used in the app
export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useLobbySettings = () => useState<LobbyInfo>("lobby_settings", () => ({} as LobbyInfo));
export const useSocketConnection = () => useState<WebSocket>("socket_connection", () => ({} as WebSocket));

// Google map states
export const useGoogleMap = () => useState<google.maps.Map | undefined>("google_map", () => undefined);
export const useGooglePanorama = () => useState<google.maps.StreetViewPanorama>("google_panorama", () => ({} as google.maps.StreetViewPanorama));
export const useMapMarkers = () => useState<google.maps.Marker[]>("map_markers", () => [] as google.maps.Marker[]);

// Gameplay states
export const useCoordinates = () => useState<Coordinates>("game_coordinates", () => ({} as Coordinates));
export const useCurrentPin = () => useState<Coordinates>("current_pin", () => ({} as Coordinates));
export const useResults = () => useState<Results>("live_results", () => ({} as Results));
export const useRoundResults = () => useState<RoundResults>("live_results", () => ({} as RoundResults));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({} as TotalResults));
export const useGameFlow = () => useState<GameFlow>("game_flow", () => undefined);
export const usePolyLines = () => useState<google.maps.Polyline[]>("poly_lines", () => [] as google.maps.Polyline[]);
