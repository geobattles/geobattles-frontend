import type { User, LobbyInfo, Coordinates, Results } from "~/types";

// Here are defined all states that are used in the app
export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useLobbySettings = () => useState<LobbyInfo>("lobby_settings", () => ({} as LobbyInfo));
export const useSocketConnection = () => useState<WebSocket>("socket_connection", () => ({} as WebSocket));
export const useCoordinates = () => useState<Coordinates>("game_coordinates", () => ({} as Coordinates));

// Google map states
export const useGoogleMap = () => useState<google.maps.Map>("google_map", () => ({} as google.maps.Map));
export const useMapMarkers = () => useState<google.maps.Marker[]>("map_markers", () => [] as google.maps.Marker[]);

// Gameplay sates
export const useCurrentPin = () => useState<Coordinates>("current_pin", () => ({} as Coordinates));
export const useResults = () => useState<Results>("results", () => ({} as Results));
