import type { Coordinates } from "~/types/appTypes";

const numbers = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const distances = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const dates = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const times = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export const journalNumber = (value: number) => numbers.format(value);
export const journalDistance = (meters: number | null) =>
    meters === null ? "No guess" : meters < 1000 ? `${distances.format(meters)} m` : `${distances.format(meters / 1000)} km`;
export const journalDate = (timestamp: number) => dates.format(timestamp);
export const journalTime = (timestamp: number) => times.format(timestamp);
export const journalCoordinates = (point: Coordinates) =>
    `${Math.abs(point.lat).toFixed(4)}° ${point.lat < 0 ? "S" : "N"}, ${Math.abs(point.lng).toFixed(4)}° ${point.lng < 0 ? "W" : "E"}`;
