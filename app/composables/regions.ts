import type { CountryCatalog } from "~/types/regions";

export const useCountryCatalog = () => useState<CountryCatalog | null>("country_catalog", () => null);

// Public, local geography only: no provider calls, credentials or mutable module state.
export const useRegionActions = () => {
    const catalog = useCountryCatalog();
    const countries = useCountryList();
    const endpoint = useRuntimeConfig().public.BACKEND_HOST;
    return {
        fetchCountryCatalog: async () => {
            if (catalog.value) return catalog.value;
            const response = await fetch(`${endpoint}/countryCatalog`, { signal: AbortSignal.timeout(10_000) });
            if (!response.ok) throw new Error("Country catalog is unavailable");
            const value: CountryCatalog = await response.json();
            if (!validCatalog(value)) throw new Error("Country catalog is invalid");
            catalog.value = value;
            countries.value = value.countries.map((country) => country.code);
            return value;
        },
    };
};

function validCatalog(value: CountryCatalog): boolean {
    if (!value || !Array.isArray(value.countries) || !value.countries.length || value.countries.length > 300 || !Array.isArray(value.continents) || !value.scoring) return false;
    const { worldSpanKm, worldHalfKm, minimumHalfKm, perfectMeters } = value.scoring;
    if (![worldSpanKm, worldHalfKm, minimumHalfKm, perfectMeters].every((number) => typeof number === "number" && Number.isFinite(number) && number > 0)) return false;
    if (worldSpanKm > 21000 || minimumHalfKm > worldHalfKm || perfectMeters !== 100) return false;
    const codes = new Set<string>();
    for (const country of value.countries) {
        if (!country || typeof country.code !== "string" || !/^[A-Z]{2}$/.test(country.code) || codes.has(country.code) || typeof country.name !== "string" || !country.name)
            return false;
        if (
            !country.center ||
            !Number.isFinite(country.center.lat) ||
            Math.abs(country.center.lat) > 90 ||
            !Number.isFinite(country.center.lng) ||
            Math.abs(country.center.lng) > 180
        )
            return false;
        if (!Number.isFinite(country.spanKm) || country.spanKm <= 0 || country.spanKm > worldSpanKm) return false;
        codes.add(country.code);
    }
    const grouped = new Set<string>();
    const ids = new Set<string>();
    for (const continent of value.continents) {
        if (
            !continent ||
            !["AF", "AS", "EU", "NA", "OC", "SA"].includes(continent.id) ||
            ids.has(continent.id) ||
            typeof continent.name !== "string" ||
            !Array.isArray(continent.codes) ||
            !continent.codes.length
        )
            return false;
        ids.add(continent.id);
        for (const code of continent.codes) {
            if (!codes.has(code) || grouped.has(code) || value.countries.find((country) => country.code === code)?.continent !== continent.id) return false;
            grouped.add(code);
        }
    }
    return grouped.size === codes.size;
}
