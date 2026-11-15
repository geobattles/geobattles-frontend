import { GameState, type Coordinates, type GameType } from "~/types/appTypes";

export const useSelectedGameMode = () => useState<GameType>("game:mode", () => "BattleRoyale");

export const useBattleRoyaleState = () => ({
    currentState: useState("battleRoyale:state", () => GameState.WAITING),
    currentRound: useState("battleRoyale:round", () => 0),
    currentMapPin: useState<Coordinates>("battleRoyale:pin", () => ({}) as Coordinates),
    searchedLocationCoords: useState<Coordinates>("battleRoyale:location", () => ({}) as Coordinates),
    isGuessPending: useState("battleRoyale:guessPending", () => false),
});

export const useCountryBattleState = () => ({
    currentState: useState("countryBattle:state", () => GameState.WAITING),
    currentRound: useState("countryBattle:round", () => 0),
    currentMapPin: useState<Coordinates>("countryBattle:pin", () => ({}) as Coordinates),
    searchedLocationCoords: useState<Coordinates>("countryBattle:location", () => ({}) as Coordinates),
});

export const useUIState = () => ({
    isMobile: useState("ui:mobile", () => false),
    isVertical: useState("ui:vertical", () => false),
});
