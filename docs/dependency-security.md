# Dependency security

## Documented assessment

The 2026-11-15 online, development-inclusive npm audit reported **14 affected package records: 8 moderate and 6 low, with no high or critical findings**. These are propagated package records, not fourteen independent vulnerabilities. Three underlying advisories remain. Re-run the audit before release; this is not a live registry report or a zero-risk claim.

The lockfile uses the compatible `@vercel/nft` 1.11.2 tracing branch with glob 14.0.6/minimatch 11.0.8. Its caller-declared changes remove that affected tracing branch without changing the direct pins. [package.json](../package.json) remains authoritative, including Nuxt 4.6.4 and PWA module 1.1.1.

## Residual advisories

| Advisory                                                                                                           | Remaining dependency path                                               | Constraint at assessment                                |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), moderate glob cancellation bypass        | Workbox 7.4.1 → glob 11.1.0                                             | Fix begins at 14.0.2, outside Workbox's `^11.0.1` range |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderate minimatch pattern amplification | Workbox glob and Archiver 8.0.0 → readdir-glob 3.0.0 → minimatch 10.2.6 | Fix begins at 11.0.1, outside those caller ranges       |
| [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), low deepmerge prototype poisoning        | Rollup node-resolve 16.0.3 → deepmerge 4.3.1, through Nitro/Workbox     | No patched deepmerge release listed at assessment       |

Moderate records: `@vite-pwa/nuxt`, `archiver`, `glob`, `minimatch`, `nitropack`, `readdir-glob`, `vite-plugin-pwa`, `workbox-build`. Low records: `@nuxt/nitro-server`, `@nuxt/vite-builder`, `@nuxt/vite-server`, `@rollup/plugin-node-resolve`, `deepmerge`, `nuxt`.

## Exposure and limits

The inspected Workbox path scans repository-controlled static patterns without an AbortSignal. Glob's optimization settings still make untrusted patterns relevant. Nitro's inspected Azure archive path uses a fixed build-directory pattern; the repository Docker runtime uses the generated Node server, not that packaging preset. The inspected Rollup merge copies hard-coded defaults rather than HTTP/player input. These observations limit identified paths; they do not patch the dependencies or certify all callers.

`--omit=dev` reported zero because the framework/build tooling is declared under development dependencies. Nuxt/Nitro generate deployed server code, so this filtered count does not prove the server, service worker, container OS or deployment is vulnerability-free. Docker copies `.output`, not all builder dependencies, but generated bundles and embedded copies still need inspection. No comprehensive production exploit assessment is claimed.

## Reassessment procedure

Use Node 24.22.3/npm 11.19.1 and explicitly online auditing; offline empty output is not a clean result:

```bash
npm audit --offline=false --include=dev --package-lock-only --ignore-scripts --json
npm audit --offline=false --omit=dev --package-lock-only --ignore-scripts --json
```

Run network/package changes only within their approved scope. Inspect actual caller ranges, advisory IDs, generated artifacts and registry integrity before proposing an update. Keep direct pins/lockfile changes reviewable. Do not use force fixes, incompatible overrides or framework downgrades to improve a count.

Monitor Workbox's glob range, Archiver's readdir-glob range and deepmerge/node-resolve fixes. For an accepted update, perform clean installation, formatting/type/build checks and a fresh image assessment in isolation from live generated output. Inspect runtime packages and OS exposure separately; include PWA transition checks for module changes. Report remaining findings through the release review and use [private security reporting](../SECURITY.md) for vulnerabilities.
