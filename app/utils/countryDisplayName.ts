/** Presentation only: supported codes and region membership still come from the server. */
const englishRegions = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

export function countryDisplayName(code: string, fallback = code): string {
    if (!/^[A-Z]{2}$/.test(code)) return fallback;
    return englishRegions.of(code) || fallback;
}
