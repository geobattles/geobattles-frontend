import { BattleRoyaleMode } from "~/core/BattleRoyaleMode";
import { CountryBattleMode } from "~/core/CountryBattleMode";

export class GameModeFactory {
    static createGameMode(mode: "BattleRoyale" | "CountryBattle") {
        switch (mode) {
            case "BattleRoyale":
                return new BattleRoyaleMode();
            case "CountryBattle":
                return new CountryBattleMode();
            default:
                throw new Error("Invalid game mode");
        }
    }
}
