export interface CatalogCountry {
    code: string;
    name: string;
    continent: string;
    center: { lat: number; lng: number };
    spanKm: number;
}

export interface CatalogContinent {
    id: string;
    name: string;
    codes: string[];
}

/** Public, keyless /countryCatalog response; codes are backend-supported only. */
export interface CountryCatalog {
    countries: CatalogCountry[];
    continents: CatalogContinent[];
    scoring: {
        worldSpanKm: number;
        worldHalfKm: number;
        minimumHalfKm: number;
        perfectMeters: number;
    };
}

export type RegionPickerMode = "world" | "continents" | "country" | "custom";

/** A shortest wrapped extent in the local 1024 × 512 projection. */
export interface RegionMapBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
