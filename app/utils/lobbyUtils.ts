import type { GameType, LobbyInfo } from "~/types/appTypes";

/**
 * Process country list selection with special handling for edge cases
 */
export const processCountryList = (settings: LobbyInfo, countryList: string[]): string[] | null => {
    if (settings.conf.ccList.length === 0) {
        return null; // Removed from settings
    } else if (settings.conf.ccList.length === countryList.length) {
        return []; // Special case for all countries
    }

    return [...settings.conf.ccList]; // Selected subset of countries
};

/**
 * Create deep clones of lobby settings to avoid reference issues
 */
export const cloneLobbySettings = (
    lobbyInfo: LobbyInfo
): {
    settings: LobbyInfo;
    originalSettings: LobbyInfo;
} => {
    const settings = structuredClone(lobbyInfo);
    settings.conf = structuredClone(lobbyInfo.conf);

    const originalSettings = structuredClone(lobbyInfo);
    originalSettings.conf = structuredClone(lobbyInfo.conf);

    return { settings, originalSettings };
};

/**
 * Determine game mode from lobby settings
 */
export const getGameModeFromSettings = (mode: number): GameType => {
    switch (mode) {
        case 1:
            return "BattleRoyale";
        case 2:
            return "CountryBattle";
        default:
            throw new Error("Unknown game mode");
    }
};

/**
 * Compare two settings objects and extract only the changed fields
 */
export const getSettingsDiff = <T extends Record<string, any>>(current: T, original: T, specialFields: Record<string, Function> = {}): Partial<T> => {
    const changes: Partial<T> = {};

    // Handle special fields with custom logic
    for (const [field, processor] of Object.entries(specialFields)) {
        if (field in current) {
            const result = processor(current[field], original[field]);
            if (result !== undefined) {
                changes[field as keyof T] = result;
            }
        }
    }

    // Process regular fields
    for (const field in current) {
        if (specialFields[field]) continue; // Skip already processed fields

        const currentValue = current[field];
        const originalValue = original[field];

        // Deep comparison for objects
        if (typeof currentValue === "object" && currentValue !== null) {
            if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
                changes[field as keyof T] = JSON.parse(JSON.stringify(currentValue));
            }
        }
        // Direct comparison for primitives
        else if (currentValue !== originalValue) {
            changes[field as keyof T] = currentValue;
        }
    }

    return changes;
};
