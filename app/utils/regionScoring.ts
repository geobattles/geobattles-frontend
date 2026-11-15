import type { CountryCatalog } from "../types/regions";

/** Same spherical distance and extent policy as the backend country catalog. */
const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const radians = Math.PI / 180;
    const latitude = Math.sin(((b.lat - a.lat) * radians) / 2);
    const longitude = Math.sin(((b.lng - a.lng) * radians) / 2);
    const chord = latitude * latitude + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * longitude * longitude;
    return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, chord))));
};

export function sameCountries(first: readonly string[], second: readonly string[]) {
    const a = new Set(first);
    const b = new Set(second);
    return a.size === b.size && [...a].every((code) => b.has(code));
}

/** [] has the wire protocol's worldwide meaning. Empty Custom is rejected by the form. */
export function regionScoreScale(codes: readonly string[], catalog: CountryCatalog): number {
    const available = new Map(catalog.countries.map((country) => [country.code, country]));
    const selected = [...new Set(codes)].map((code) => {
        const country = available.get(code);
        if (!country) throw new Error("Unknown country in selected region");
        return country;
    });
    const { worldSpanKm, worldHalfKm, minimumHalfKm } = catalog.scoring;
    if (!selected.length || selected.length === available.size) return worldHalfKm;
    let span = 0;
    for (let i = 0; i < selected.length; i++) {
        const first = selected[i]!;
        span = Math.max(span, first.spanKm);
        for (let j = 0; j < i; j++) {
            const second = selected[j]!;
            span = Math.max(span, distanceKm(first.center, second.center) + (first.spanKm + second.spanKm) / 2);
        }
    }
    return Math.max(minimumHalfKm, (worldHalfKm * Math.min(worldSpanKm, span)) / worldSpanKm);
}

export function regionLabel(codes: readonly string[], catalog: CountryCatalog | null): string {
    if (
        !codes.length ||
        (catalog &&
            sameCountries(
                codes,
                catalog.countries.map((country) => country.code)
            ))
    )
        return "Whole world";
    if (codes.length === 1) return catalog?.countries.find((country) => country.code === codes[0])?.name ?? codes[0]!;
    const continent = catalog?.continents.find((entry) => sameCountries(codes, entry.codes));
    return continent?.name ?? `Custom · ${new Set(codes).size} countries`;
}

export function previewBaseScore(km: number, factor: number, automaticHalfKm?: number): number {
    if (automaticHalfKm !== undefined) {
        return Math.min(5000, Math.trunc(5000 * Math.pow(0.5, Math.max(0, km * 1000 - 100) / (automaticHalfKm * 1000))));
    }
    // Keep the existing manual curve, metres→kilometres conversion and truncation.
    return Math.min(5000, Math.trunc(5000 * Math.pow(0.999, (km - factor / 1000) * (0.2 + 30 * Math.pow(0.98, 10 * Math.pow(factor, 0.6))))));
}
