# Testing and release acceptance

Routine `npm run check` runs formatting, typecheck and build without a backend or browser. Application unit tests and new test frameworks remain opt-in. The existing optional socket/browser suites use real HTTP, native WebSockets and rendered controls; do not manufacture provider responses, phases, scores or snapshots.

## Two-player match in CI

From the frontend checkout on Linux or WSL, with the pinned Node/npm and Go
toolchains and Docker available, run:

```sh
npm run test:e2e:match
```

The runner finds the sibling `../geo-backend` checkout. Set
`GEOBATTLES_BACKEND_DIR` to choose a different checkout. It prints both Git
revisions, stages the frontend sources in a temporary directory, and installs
the locked dependencies and Chromium. A disposable PostgreSQL container hosts
the fixture server and database. Only the API is published on a random loopback
port. The runner stops its services and removes its temporary files on exit.

Each repository's multiplayer PR check pins the sibling checkout by full
commit SHA. Make the pinned commits available in the corresponding upstream
repositories before enabling the checks. Update a pin in a reviewed change
when adopting a new sibling revision.

The Go `matchfixture` build supplies two fixed locations. The Nuxt
`--envName matchfixture` build uses a local interactive atlas in place of the
Google SDK. Two guest contexts use the real HTTP API, WebSockets, guess
controls, clock and scoring. The guest closes the gameplay document, finds
the retained seat in round two and returns. Both clients must display 10,000
points for Atlas and 5,000 for Nova. The browser proxy allows only the two
loopback origins. The Maps-backed suites below cover the real provider.

To save player-visible screenshots, set `GEOBATTLES_MATCH_ARTIFACTS` to an
absolute output directory before running the command. The fixture uses
disposable guest identities and writes screenshots only when requested.

## Isolation and prerequisites for the socket and provider suites

Use the pinned Node/npm toolchain and installed Playwright 1.65.1. Install its browser binaries only as part of explicitly scoped tooling setup. These suites use existing services: verify the backend uses an approved isolated development database and credentials before running. A loopback URL alone does not establish database isolation.

```sh
export GEOBATTLES_E2E_TARGET=isolated-local
export GEOBATTLES_BASE_URL=http://127.0.0.1:3000
export GEOBATTLES_API_URL=http://127.0.0.1:8080
```

Both URLs require literal loopback HTTP with explicit ports (`localhost`, `127.0.0.1` or `[::1]`). The frontend is origin-only. The backend accepts an origin or exactly `/api`, for example `http://127.0.0.1:8088/api` behind an approved local gateway. `/api/`, other paths, encoded/dot paths, aliases, credentials, queries and fragments are rejected. The socket preserves the optional prefix.

Do not print/source `.env`, reuse personal cookies or put keys/tokens in commands. Browser players use independent nonpersistent contexts and real UI registration. Guest/token rows remain in the development database; do not invent cleanup endpoints or reset unrelated lobbies.

## Static and collection checks

With the explicit local settings above, these commands launch no browser and make no application/provider requests:

```sh
node --check tools/socket-smoke.mjs
node --check e2e/support/safety.mjs
node --check e2e/support/network-guard.mjs
npm exec --no -- tsc --noEmit --project e2e/tsconfig.json
npm run test:e2e -- --list
GEOBATTLES_E2E_MAPS=1 npm run test:e2e -- --list
```

Collection still enforces configuration policy. Do not override reporters/output paths, enable debugging/traces or add retries to bypass guards. Use the actual collection output rather than a fixed historical test count.

## Keyless integration

After local runtime approval:

```sh
npm run test:socket
npm run test:e2e
```

The native socket harness checks guest/create/join, admission, readiness, settings authorization/preservation, host handoff and reclaim, snapshot recovery, resumable leave, the 90-second return window and exact-room disposal. Default execution sends no START. `GEOBATTLES_E2E_READY_REJECTION=1 npm run test:socket` adds one unready START rejection probe only after independently confirming that the backend has no Maps key. It cannot be combined with Maps mode; the native harness refuses Maps mode entirely.

Browser projects `keyless-chromium` and `keyless-firefox` collect `*.keyless.spec.ts`, including lobby and region scenarios. They exercise actual controls, independent identities, readiness/settings, reload/recovery and region selection without START/provider access. Chromium checks touch capability; Firefox coarse-pointer/responsive coverage is not full mobile-device emulation. Service workers are blocked, so these suites do not test PWA installation/update.

## Explicit Maps suite

### Simple presets

After setting the isolated-local target and URLs above, use these POSIX-shell npm shortcuts. They reuse the existing scenarios and guards, without a separate framework:

| Command                          | Purpose                                                                                  | Provider use                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `npm run test:socket`            | Membership, host reclaim, reconnect, return-window expiry, settings and leave            | None; leave readiness-rejection opt-in disabled |
| `npm run test:e2e:keyless`       | Lobby/settings controls and waiting-room reload/offline recovery in Chromium and Firefox | None                                            |
| `npm run test:e2e:maps:recovery` | Two players: real round, PLAYING disconnect/reconnect, map retry, rematch and journals   | Up to 2 starts / 10 conservative grants         |
| `npm run test:e2e:maps:all`      | Recovery preset plus three players, two rounds and MID-ROUND reload                      | Up to 4 starts / 24 conservative grants         |

For a focused three-player check, `npm run test:e2e:maps:multiround` runs only the two-round match, MID-ROUND reload and journals, with an allocation of 2 starts / 14 conservative grants. Recovery must restore the visible debrief with gameplay guessing unavailable and no recovery dialog before Next round.

The Maps presets can spend quota: obtain approval before running them. They require the same isolated-local configuration and do not start or deploy services. Paid scenarios use Netherlands, one guess per player per round and a 90-second timer. Append `-- --list` to inspect collection without launching browsers or making provider calls. Keep `GEOBATTLES_E2E_READY_REJECTION=0` for these presets.

Each invocation stops on its first failure and has no automatic retries. A failed provider request still consumes part of the allocation; retain its result and reconcile usage before a separately approved rerun. A provider HTTP failure is not a clean acceptance pass, nor by itself proof of a game-state defect. Offline/online recovery and page reload are different checks; these presets do not prove recovery after a backend restart or physical-device sleep.

Paid execution needs separate approval of the remaining shared allocation, correctly restricted app keys and successful keyless checks. The following documents CLI policy, not permission to run it:

```sh
GEOBATTLES_E2E_MAPS=1 GEOBATTLES_E2E_MAPS_SCOPE=all GEOBATTLES_E2E_ROUND_BUDGET=4 GEOBATTLES_E2E_MAP_LOAD_BUDGET=24 npm run test:e2e -- --project=maps
```

`e2e/support/safety.mjs` is authoritative for the plan:

| Scope           | Coverage                                                                             | Accepted starts | Conservative map/panorama grants |                     START permits |
| --------------- | ------------------------------------------------------------------------------------ | --------------: | -------------------------------: | --------------------------------: |
| `recovery`      | Two players, completion/replay, PLAYING recovery, pre-initialization Maps-only retry |               2 |                               10 | 4, including two rejection probes |
| `all` (default) | Recovery case plus three players/two rounds and MID-ROUND reload                     |               4 |                               24 | 6, including two rejection probes |

Configured ceilings per invocation are 4 starts and 24 grants. Grants count authorization, not exact SDK constructors, backend metadata requests or billable units. Scope `recovery` selects only `game.maps.spec.ts`. Scope `multiround` selects only `multiround.maps.spec.ts` and requires 2 starts, 14 grants and 2 START permits. Each focused scope requires its own approved/reconciled allocation; CLI filtering does not reduce reservations. One ledger/halt flag spans the invocation. Reservations are not refunded after failure; new processes do not reset a real spending allowance.

Keep one worker/project, no retries/repetition/shards/replacement workers, and first-failure stop. Stop on unexpected provider/network/JS/protocol failure; do not retry with another country or bypass a selector. Already in-flight requests cannot be recalled. The real country-picker path selects NL; this limits variability without guaranteeing provider availability.

Maps-only retry aborts one initial peer SDK script before any peer view construction, then requires an explicit Retry map while preserving identity/socket/game/round/clock and START/auth/navigation counts. It is not permission for post-initialization retries. Real panorama status must be `OK`; initialization alone is insufficient. Journal scores must match complete own-player authoritative result rows, including omitted-zero semantics, rather than substring guesses or UI-derived expectations.

## Network and artifact privacy

The context-specific native proxy restricts exact configured loopback authorities, including redirect destinations. External CONNECT is HTTPS-only to a finite Google host set, only during permitted unhalted Maps execution. It does not intercept TLS or act as a machine-wide firewall. Do not widen host allowlists to salvage a paid failure.

Trace, video, automatic screenshots, HAR, downloads and auth storage-state output are off. The reporter preserves curated diagnostics and masked failure screenshots only, in a fresh private directory outside the checkout (directories 0700, files 0600). It suppresses arbitrary call logs, URLs, bodies and credentials; do not publish these directories.

Native Playwright error context can exist transiently before lifecycle cleanup. Completion/teardown/exit remove unknown raw artifacts, but SIGKILL, host failure or filesystem errors may prevent cleanup. Quarantine/delete interrupted private output before reuse. `PLAYWRIGHT_NO_COPY_PROMPT` alone does not prevent error-context files. Keep policy checks, reporter and cleanup hooks enabled.

A narrow expected image-cancellation classification does not excuse script/fetch, HTTP, auth/quota or arbitrary provider failures. Uncaught JS remains fatal. Failure cleanup closes only owned contexts; server leases may remain until grace expiry.

## Release acceptance

Record the exact artifact, environment, commands and observed limits for each release. The guides do not certify a current deployment.

- Check authenticated SSR/hard reloads, signup/login/refresh/logout and identity changes; include unknown logout outcomes and request isolation.
- Exercise independent multiplayer clients, intentional/cancelled leave, reconnect within/after grace, duplicate identity, host transfer and WAITING/PLAYING/MID-ROUND/FINISHED recovery.
- With explicit Maps scope, complete rounds, next round and replay; verify guesses, exact-zero/no-guess states, authoritative rankings, clocks and complete journal recording/deduplication/clear/storage failure.
- Verify retained map/camera ownership, Maps-only retry, visible result fitting, mobile focus/fullscreen, attribution clearance, every score row and desktop/mobile transitions. Physical-device suspend, keyboard and safe areas need real-device checks.
- Exercise [PWA install/update](pwa-lifecycle.md#acceptance) separately in a persistent profile; ordinary E2E blocks workers.
- Review [dependency findings](dependency-security.md), generated runtime/image exposure and the [deployment gates](setup-deployment.md#release-gates). Build or HTTP success does not establish gameplay, persistence, load behavior or security certification.
