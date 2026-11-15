# Local geography attribution

`natural-earth-land.svg` is derived from Natural Earth's public-domain 1:110m land polygons.

- Project/authors: Natural Earth; Tom Patterson, Nathaniel Vaughn Kelso and contributors.
- Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
- License/terms: https://www.naturalearthdata.com/about/terms-of-use/
- Source SHA-256: `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`
- Adaptation: 1024 × 512 equirectangular SVG. Polygon outlines simplified with a 0.22-pixel Douglas–Peucker tolerance and coordinates rounded to one decimal place. Local ocean/land styling; no political boundaries in the backdrop.
- The region picker uses these land paths as a locally bundled backdrop. No geography CDN or map API is called at runtime.
- Regenerate from a local copy of the documented GeoJSON with `node tools/generate-land-map.mjs /absolute/path/to/ne_110m_land.geojson`. The generator verifies the source SHA-256 before writing, preserves all source polygons and avoids manual copying of long SVG path data. To refresh the picker asset, run `node tools/generate-region-map.mjs` with a matching-release backend clone at `../geo-backend` relative to the frontend root. The region generator accepts only optional `--check`, not a backend path argument. See [region generation](../../docs/region-settings.md#local-artwork). Normal frontend installation/build uses committed assets and does not require that sibling checkout. Region generation fails on malformed/truncated backdrop paths rather than silently omitting land.

Preserve the source, author, public-domain terms and hash when redistributing or regenerating this asset.
