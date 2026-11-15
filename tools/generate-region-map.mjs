#!/usr/bin/env node
/**
 * Generate the local region-picker illustration; no network or dependencies.
 * Run from the frontend: node tools/generate-region-map.mjs [--check]
 * Requires the sibling geo-backend checkout. --check compares without writing.
 *
 * Country outlines: ../geo-backend/assets/full/countries2.json, the existing
 * game boundary asset, restricted to authoritative countryDB.json codes and
 * grouped by ISO_A2_EH exactly like pkg/logic/allPolygons.go. These simplified
 * outlines are for selection, not a claim of political authority or imagery
 * coverage. Scoring/sampling still use the backend's actual playable areas.
 * Preserve polygon grouping and interior holes with evenodd fill.
 *
 * Backdrop: public/globe/natural-earth-land.svg, only its land paths. It derives
 * from Natural Earth's public-domain 1:110m land data (Tom Patterson, Nathaniel
 * Vaughn Kelso and contributors). See public/globe/README.md for original source,
 * source SHA-256 and terms: https://www.naturalearthdata.com/about/terms-of-use/.
 * No political borders are inferred from this backdrop. Invalid/truncated SVG
 * paths fail generation rather than silently omitting a continent. Restore the
 * source with tools/generate-land-map.mjs and its hash-verified local dataset.
 *
 * Projection: 1024 x 512 equirectangular, longitude/latitude -> x/y. Unwrap each
 * ring along its shortest longitude edges BEFORE simplifying. Clip translated
 * copies to the antimeridian/world edges; never connect 179E straight to 179W.
 * Douglas-Peucker tolerance is at most 0.14 projected pixels, reduced for tiny
 * rings; output coordinates retain three decimals. A country bounding box may
 * extend past x=1024 to describe its shortest wrapped extent for local zoom.
 *
 * Provenance hashes identify the exact local metadata/boundary/backdrop inputs.
 * No timestamps or absolute machine paths enter the deterministic output.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendAssets = resolve(root, "../geo-backend/assets");
const outputPath = resolve(root, "app/assets/region-map.json");
const width = 1024;
const height = 512;
const tolerance = 0.14;
const arguments_ = process.argv.slice(2);
if (arguments_.some((argument) => argument !== "--check")) throw new Error("Usage: node tools/generate-region-map.mjs [--check]");
const check = arguments_.includes("--check");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const round = (number) => Number(number.toFixed(3));
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
const samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];

function projectRing(ring, source) {
    if (!Array.isArray(ring) || ring.length < 3) throw new Error(`${source}: a ring needs at least three coordinates`);
    const points = [];
    let previousLongitude;
    for (const coordinate of ring) {
        if (!Array.isArray(coordinate) || coordinate.length !== 2 || !coordinate.every(Number.isFinite)) throw new Error(`${source}: invalid coordinate`);
        let [longitude, latitude] = coordinate;
        if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) throw new Error(`${source}: coordinate outside longitude/latitude range`);
        if (previousLongitude !== undefined) {
            while (longitude - previousLongitude > 180) longitude -= 360;
            while (longitude - previousLongitude < -180) longitude += 360;
        }
        previousLongitude = longitude;
        const point = [((longitude + 180) / 360) * width, ((90 - latitude) / 180) * height];
        if (!points.length || !samePoint(point, points.at(-1))) points.push(point);
    }
    if (samePoint(points[0], points.at(-1))) points.pop();
    if (points.length < 3) throw new Error(`${source}: degenerate ring`);
    if (Math.abs(points[0][0] - points.at(-1)[0]) > width / 2) throw new Error(`${source}: unsupported globe-winding ring`);
    return points;
}

function distanceSquared(point, start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const t = dx || dy ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy))) : 0;
    return (point[0] - start[0] - t * dx) ** 2 + (point[1] - start[1] - t * dy) ** 2;
}

function simplifyLine(points, epsilon) {
    const keep = new Set([0, points.length - 1]);
    const pending = [[0, points.length - 1]];
    while (pending.length) {
        const [first, last] = pending.pop();
        let furthest = -1;
        let largest = epsilon * epsilon;
        for (let index = first + 1; index < last; index++) {
            const distance = distanceSquared(points[index], points[first], points[last]);
            if (distance > largest) {
                largest = distance;
                furthest = index;
            }
        }
        if (furthest !== -1) {
            keep.add(furthest);
            pending.push([first, furthest], [furthest, last]);
        }
    }
    return [...keep].sort((a, b) => a - b).map((index) => points[index]);
}

function simplifyRing(points) {
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const epsilon = Math.min(tolerance, (Math.max(...xs) - Math.min(...xs)) / 30, (Math.max(...ys) - Math.min(...ys)) / 30);
    let opposite = 1;
    for (let index = 2; index < points.length; index++) {
        if (distanceSquared(points[index], points[0], points[0]) > distanceSquared(points[opposite], points[0], points[0])) opposite = index;
    }
    const simplified = [...simplifyLine(points.slice(0, opposite + 1), epsilon).slice(0, -1), ...simplifyLine([...points.slice(opposite), points[0]], epsilon).slice(0, -1)];
    return simplified.length >= 3 ? simplified : points;
}

function clipEdge(points, edge, keepRight) {
    const clipped = [];
    const inside = (point) => (keepRight ? point[0] >= edge : point[0] <= edge);
    for (let index = 0; index < points.length; index++) {
        const start = points[(index + points.length - 1) % points.length];
        const end = points[index];
        if (inside(start) !== inside(end)) {
            const t = (edge - start[0]) / (end[0] - start[0]);
            clipped.push([edge, start[1] + t * (end[1] - start[1])]);
        }
        if (inside(end)) clipped.push(end);
    }
    return clipped;
}

function ringPaths(points) {
    const xs = points.map((point) => point[0]);
    const paths = [];
    for (let tile = Math.floor(Math.min(...xs) / width); tile <= Math.floor(Math.max(...xs) / width); tile++) {
        const shifted = points.map(([x, y]) => [x - tile * width, y]);
        const clipped = clipEdge(clipEdge(shifted, 0, true), width, false).map(([x, y]) => [round(x), round(y)]);
        const distinct = clipped.filter((point, index) => !index || !samePoint(point, clipped[index - 1]));
        if (distinct.length > 1 && samePoint(distinct[0], distinct.at(-1))) distinct.pop();
        if (distinct.length < 3) continue;
        const area = distinct.reduce((sum, point, index) => {
            const next = distinct[(index + 1) % distinct.length];
            return sum + point[0] * next[1] - next[0] * point[1];
        }, 0);
        if (Math.abs(area) < 0.000001) continue;
        for (let index = 0; index < distinct.length; index++) {
            if (Math.abs(distinct[index][0] - distinct[(index + 1) % distinct.length][0]) > width / 2) throw new Error("A path crosses the whole map");
        }
        paths.push(`${distinct.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join("")}Z`);
    }
    return paths;
}

function boundsForRings(rings) {
    const intervals = [];
    let top = height;
    let bottom = 0;
    for (const ring of rings) {
        const xs = ring.map((point) => point[0]);
        const left = Math.min(...xs);
        const right = Math.max(...xs);
        const start = modulo(left, width);
        const end = start + right - left;
        intervals.push([start, Math.min(width, end)]);
        if (end > width) intervals.push([0, end - width]);
        for (const [, y] of ring) {
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const interval of intervals) {
        const previous = merged.at(-1);
        if (previous && interval[0] <= previous[1]) previous[1] = Math.max(previous[1], interval[1]);
        else merged.push([...interval]);
    }
    let largestGap = -1;
    let left = 0;
    for (let index = 0; index < merged.length; index++) {
        const nextStart = index + 1 < merged.length ? merged[index + 1][0] : merged[0][0] + width;
        const gap = nextStart - merged[index][1];
        if (gap > largestGap) {
            largestGap = gap;
            left = modulo(nextStart, width);
        }
    }
    return { x: round(left), y: round(top), width: round(width - largestGap), height: round(bottom - top) };
}

const databaseBytes = readFileSync(resolve(backendAssets, "countryDB.json"));
const database = JSON.parse(databaseBytes.toString());
const codes = Object.keys(database.countries).sort();
// Object keys are authoritative: legacy metadata has SK.ccode="SG". Do not
// rewrite or use that redundant field to choose a different country's geometry.
if (!codes.length || codes.some((code) => !/^[A-Z]{2}$/.test(code))) throw new Error("Invalid authoritative country codes");
const outlineBytes = readFileSync(resolve(backendAssets, "full/countries2.json"));
const outlines = new Map(codes.map((code) => [code, []]));
for (const feature of JSON.parse(outlineBytes).features) {
    const code = feature.properties.ISO_A2_EH;
    if (!outlines.has(code)) continue;
    const geometry = feature.geometry;
    if (!["Polygon", "MultiPolygon"].includes(geometry.type)) throw new Error(`${code}: unsupported country outline`);
    outlines.get(code).push(...(geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates));
}
let sourceRings = 0;
let sourcePoints = 0;
const countries = codes.map((code) => {
    const polygons = outlines.get(code);
    if (!polygons?.length) throw new Error(`${code}: missing country outline`);
    const paths = [];
    const allRings = [];
    for (const rings of polygons) {
        if (!Array.isArray(rings) || !rings.length) throw new Error(`${code}: missing outline rings`);
        const projected = rings.map((ring) => projectRing(ring, code));
        sourceRings += rings.length;
        sourcePoints += rings.reduce((sum, ring) => sum + ring.length, 0);
        allRings.push(...projected);
        const path = projected.flatMap((ring) => ringPaths(simplifyRing(ring))).join("");
        if (path) paths.push({ d: path });
    }
    if (!paths.length) throw new Error(`${code}: no drawable country outline`);
    // One compound path per country keeps the interactive map's DOM small.
    // GeoJSON polygons are disjoint; each retained ring still uses evenodd fill.
    return { code, paths: [{ d: paths.map((path) => path.d).join("") }], bounds: boundsForRings(allRings) };
});

function validLandPath(path) {
    // Generated absolute M/L coordinate pairs only; each ring needs three points and Z.
    const coordinate = "-?\\d+(?:\\.\\d+)?";
    const pair = `\\s*${coordinate}\\s*,\\s*${coordinate}\\s*`;
    const ring = `M${pair}(?:L${pair}){2,}Z\\s*`;
    return new RegExp(`^\\s*(?:${ring})+$`).test(path) && [...path.matchAll(new RegExp(coordinate, "g"))].every(([number]) => Number.isFinite(Number(number)));
}

const landBytes = readFileSync(resolve(root, "public/globe/natural-earth-land.svg"));
const landGroup = landBytes.toString().match(/<g\b[^>]*fill-rule="evenodd"[^>]*>([\s\S]*?)<\/g>/)?.[1];
if (!landGroup) throw new Error("Natural Earth land group not found; inspect the source SVG before regenerating");
const pathElement = /<path\s+d="([^"]+)"\s*\/>/g;
const sourceLand = [...landGroup.matchAll(pathElement)].map((match) => match[1]);
const land = sourceLand;
// Never silently omit a malformed path element from the generated land group.
if (landGroup.replace(pathElement, "").trim() || !land.length || land.some((path) => !validLandPath(path))) {
    throw new Error("Unexpected Natural Earth land path data");
}

const asset = {
    version: 1,
    projection: "equirectangular",
    width,
    height,
    simplificationPixels: tolerance,
    sources: {
        countryDatabase: "../geo-backend/assets/countryDB.json",
        countryDatabaseSha256: digest(databaseBytes),
        countryOutlines: "../geo-backend/assets/full/countries2.json",
        countryOutlinesSha256: digest(outlineBytes),
        land: "public/globe/natural-earth-land.svg",
        landSha256: digest(landBytes),
        landAttribution: "Natural Earth, public domain; see public/globe/README.md",
        landPaths: land.length,
    },
    land,
    countries,
};
const output = `${JSON.stringify(asset, null, 4)}\n`;
if (check) {
    if (readFileSync(outputPath, "utf8") !== output) throw new Error("region-map.json is stale; run node tools/generate-region-map.mjs");
} else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output);
}
console.log(
    `${check ? "Verified" : "Generated"} app/assets/region-map.json: ${countries.length} countries, ${sourceRings} source rings, ${sourcePoints} source points, ${Buffer.byteLength(output)} bytes`
);
console.log(`SHA-256 ${digest(output)}`);
