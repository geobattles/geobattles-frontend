#!/usr/bin/env node
/**
 * Rebuild the local public-domain Natural Earth backdrop without runtime fetching.
 * Download the source documented in public/globe/README.md to a local file, then:
 * node tools/generate-land-map.mjs /absolute/path/to/ne_110m_land.geojson
 * Its expected SHA-256 is checked before any write. No network/dependencies.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

if (process.argv.length !== 3) throw new Error("Usage: node tools/generate-land-map.mjs <local-natural-earth-geojson>");
const source = readFileSync(process.argv[2]);
const expected = "9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9";
if (createHash("sha256").update(source).digest("hex") !== expected) throw new Error("Source hash differs from the documented Natural Earth dataset");
const features = JSON.parse(source).features;
const paths = [];
const epsilonSquared = 0.22 ** 2;
function simplify(points) {
    const keep = new Set([0, points.length - 1]);
    const pending = [[0, points.length - 1]];
    while (pending.length) {
        const [first, last] = pending.pop();
        const start = points[first],
            end = points[last];
        const dx = end[0] - start[0],
            dy = end[1] - start[1];
        let distance = epsilonSquared,
            furthest = -1;
        for (let i = first + 1; i < last; i++) {
            const point = points[i];
            const ratio = dx || dy ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy))) : 0;
            const squared = (point[0] - start[0] - ratio * dx) ** 2 + (point[1] - start[1] - ratio * dy) ** 2;
            if (squared > distance) {
                distance = squared;
                furthest = i;
            }
        }
        if (furthest !== -1) {
            keep.add(furthest);
            pending.push([first, furthest], [furthest, last]);
        }
    }
    const result = [...keep].sort((a, b) => a - b).map((index) => points[index]);
    return result.length < 4 ? points : result;
}
for (const feature of features) {
    const geometry = feature.geometry;
    if (!["Polygon", "MultiPolygon"].includes(geometry.type)) throw new Error("Unexpected Natural Earth geometry");
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    for (const polygon of polygons) {
        const d = polygon
            .map((ring) => {
                const points = ring.map(([longitude, latitude]) => {
                    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180.000001 || Math.abs(latitude) > 90)
                        throw new Error("Invalid land coordinate");
                    return [((longitude + 180) / 360) * 1024, ((90 - latitude) / 180) * 512];
                });
                return (
                    simplify(points)
                        .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
                        .join("") + "Z"
                );
            })
            .join("");
        if (!/^[MLZ\d.,-]+$/.test(d)) throw new Error("Invalid generated path");
        paths.push(`<path d="${d}"/>`);
    }
}
const output = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512" width="1024" height="512">\n<title>Natural Earth land outline</title>\n<desc>Public-domain Natural Earth 1:110m land polygons; simplified local equirectangular illustration. Source and terms in README.md.</desc>\n<rect width="1024" height="512" fill="#0b2839"/>\n<g fill="#4d8c86" stroke="#95c8b1" stroke-opacity=".4" stroke-width=".45" fill-rule="evenodd">\n${paths.join("\n")}\n</g>\n</svg>\n`;
writeFileSync(fileURLToPath(new URL("../public/globe/natural-earth-land.svg", import.meta.url)), output);
console.log(`Restored ${paths.length} complete land polygons from the verified source (${Buffer.byteLength(output)} bytes).`);
