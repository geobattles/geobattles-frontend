import type { User, Coordinates, Results, GameFlow, TotalResults, RoundResults } from "~/types";

// States
export const usePlayerInfo = () => useState<User>("user_info", () => ({} as User));
export const useBackendAPI = () => useState<string | undefined>("backend_api", () => undefined);

// Gameplay states
export const useGameFlow = () => useState<GameFlow>("game_flow", () => undefined);
export const useCoordinates = () => useState<Coordinates>("game_coordinates", () => ({} as Coordinates));
export const useCurrentPin = () => useState<Coordinates>("current_pin", () => ({} as Coordinates));
export const useResults = () => useState<Results>("live_results", () => ({} as Results));
export const useRoundResults = () => useState<RoundResults>("live_results", () => ({} as RoundResults));
export const useTotalResults = () => useState<TotalResults>("total_results", () => ({} as TotalResults));
export const usePolyLines = () => useState<google.maps.Polyline[]>("poly_lines", () => [] as google.maps.Polyline[]);
export const useIsSubmitDisabled = () => useState<boolean>("submit_button", () => false);
