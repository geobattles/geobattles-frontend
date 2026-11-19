import type { Coordinates, ResultData } from "~/types/appTypes";

export const isSocketRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const wireInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);

export const decodeSocketCoordinates = (value: unknown): Coordinates => {
    if (
        !isSocketRecord(value) ||
        typeof value.lat !== "number" ||
        typeof value.lng !== "number" ||
        !Number.isFinite(value.lat) ||
        !Number.isFinite(value.lng) ||
        Math.abs(value.lat) > 90 ||
        Math.abs(value.lng) > 180
    )
        throw new Error("Invalid socket coordinates.");
    return { lat: value.lat, lng: value.lng };
};

export const decodeSocketResult = (row: unknown): ResultData => {
    if (
        !isSocketRecord(row) ||
        !wireInteger(row.attempt) ||
        row.attempt < 0 ||
        !wireInteger(row.baseScr) ||
        !wireInteger(row.lives) ||
        typeof row.distance !== "number" ||
        !Number.isFinite(row.distance) ||
        row.distance < 0
    )
        throw new Error("Invalid socket result.");
    const result: ResultData = { attempt: row.attempt, baseScr: row.baseScr, lives: row.lives, distance: row.distance, location: decodeSocketCoordinates(row.location) };
    for (const field of ["placeScr", "dblScr", "duelScr", "total", "time"] as const) {
        const score = row[field];
        if (score !== undefined) {
            if (!wireInteger(score)) throw new Error("Invalid socket result.");
            result[field] = score;
        }
    }
    if (row.cc !== undefined) {
        if (typeof row.cc !== "string") throw new Error("Invalid socket result.");
        result.cc = row.cc;
    }
    if (row.player_countries !== undefined) {
        if (!Array.isArray(row.player_countries) || !row.player_countries.every((country): country is string => typeof country === "string"))
            throw new Error("Invalid socket result.");
        result.player_countries = [...row.player_countries];
    }
    return result;
};
