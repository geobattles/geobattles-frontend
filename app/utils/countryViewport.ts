import data from "~/assets/country-viewports.json";

/** Public outline only; east < west denotes an antimeridian crossing. */
export type CountryViewport = { north: number; south: number; west: number; east: number };

/** World, multiple countries and any unknown code retain the ordinary world view. */
export const getCountryViewport = (codes: readonly string[] = []): CountryViewport | null => {
    const distinct = [...new Set(codes)];
    const code = distinct[0];
    if (distinct.length !== 1 || !code || !Object.hasOwn(data.countries, code)) return null;
    return { ...data.countries[code as keyof typeof data.countries] };
};
