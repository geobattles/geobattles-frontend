#!/usr/bin/env node
/** Derive gameplay camera bounds from the existing public country outlines.
 * No network, backend checkout, sampling geometry or answer coordinates.
 * Run: node tools/generate-country-viewports.mjs [--check]
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = "app/assets/region-map.json";
const output = resolve(root, "app/assets/country-viewports.json");
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--check")) throw new Error("Usage: node tools/generate-country-viewports.mjs [--check]");
const bytes = readFileSync(resolve(root, source));
const map = JSON.parse(bytes.toString());
if (map.version !== 1 || map.projection !== "equirectangular" || map.width !== 1024 || map.height !== 512) throw new Error("Unsupported country-map projection");
if (!Array.isArray(map.countries) || !map.countries.length) throw new Error("Missing countries");
const round = (value) => Number(value.toFixed(6));
const longitude = (x) => round((((x / map.width) * 360) % 360) - 180);
const countries = {};
for (const { code, bounds } of [...map.countries].sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0))) {
    if (typeof code !== "string" || !/^[A-Z]{2}$/.test(code) || Object.hasOwn(countries, code)) throw new Error("Invalid or duplicate country code");
    if (!bounds || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) throw new Error(`${code}: invalid bounds`);
    const { x, y, width, height } = bounds;
    if (x < 0 || x >= map.width || y < 0 || width <= 0 || width >= map.width || height <= 0 || y + height > map.height) throw new Error(`${code}: out-of-range bounds`);
    // x + width may exceed the world width: east < west preserves that crossing.
    countries[code] = {
        north: round(90 - (y / map.height) * 180),
        south: round(90 - ((y + height) / map.height) * 180),
        west: longitude(x),
        east: longitude(x + width),
    };
}
const data = {
    version: 1,
    source,
    sourceSha256: createHash("sha256").update(bytes).digest("hex"),
    projection: { name: map.projection, width: map.width, height: map.height },
    countries,
};
// Only four coordinates per country; no SVG geometry ships with gameplay.
const text = `${JSON.stringify(data, null, 4)}\n`;
if (args.includes("--check")) {
    if (readFileSync(output, "utf8") !== text) throw new Error("Country viewports are stale; regenerate them");
    console.log(`Country viewports verified: ${Object.keys(countries).length} countries`);
} else {
    writeFileSync(output, text);
    console.log(`Generated ${Object.keys(countries).length} country viewports`);
}
