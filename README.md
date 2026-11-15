# GeoBattles

GeoBattles is an open-source location-guessing game built around Google Street View. Play Battle Royale solo or with friends, compare guesses and distances, and review completed games in a device-local Expedition Journal.

The public game is at [geobattles.xyz](https://geobattles.xyz/). Repository changes are not necessarily deployed there. Country Battle remains unfinished and disabled.

## Contribute

The frontend uses Nuxt 4.6.4, Vue, TypeScript, Tailwind 3 and native HTML controls. Use Node 24.22.3 and npm 11.19.1; [package.json](package.json) is authoritative for dependency and toolchain requirements.

```bash
git clone https://github.com/geobattles/geobattles-frontend.git
cd geobattles-frontend
nvm install
nvm use
npm --version # 11.19.1
npm ci
npm run check
```

Checks run formatting, type checking and production compilation. They need no Google key, backend or browser. Use a separate checkout if a running development server owns `.nuxt`: installation also prepares Nuxt output.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for master-based feature branches and review requirements, or browse the [documentation index](docs/README.md).

## Run locally

For an explicitly approved runtime session, copy `.env.example` to an ignored `.env` without overwriting an existing file, configure the separate Go backend, then run `npm run dev`. The development server binds to `http://127.0.0.1:3000`.

- `NUXT_PUBLIC_BACKEND_HOST` is the browser-reachable API/WebSocket base.
- `NUXT_BACKEND_SERVER_HOST` is the private absolute API base used by SSR authentication. Empty falls back to the public base. A relative public `/api` requires a private absolute base and a reverse proxy that strips the prefix and forwards WebSocket upgrades.
- `NUXT_PUBLIC_GMAPS_API` is browser-visible. Restrict its APIs and website referrers; use a separate restricted backend key. Leave it blank for ordinary checks.

Backend startup can migrate its database. Services, browser gameplay and paid Maps calls are separate from routine checks. See [setup and deployment](docs/setup-deployment.md) and [testing](docs/testing.md) before running them.

## Gameplay and limitations

Each player marks ready before initial play or replay; ordinary next rounds do not require another Ready Check. Recovery is bounded and the server clock keeps running during disconnection. Use separate browser profiles for distinct players; tabs normally share identity cookies. In-memory lobbies do not survive backend restarts.

The journal stores complete authoritative finished games for the current identity on this device. It is not a cloud backup or global leaderboard. Mobile layouts and PWA installation are supported, but physical-device behavior and installed-client updates need their own [acceptance checks](docs/testing.md#release-acceptance).

## Release and security

Use [setup and deployment](docs/setup-deployment.md) and the [backend repository](https://github.com/geobattles/geobattles-backend), selecting `docs/production-release.md` from the matching release, for coordinated versions, database backup/restore, HTTPS/WSS and rollback. A local LAN stack is not a production recipe. Image publication is manual, master-only and requires explicit maintainer approval.

Review [dependency security](docs/dependency-security.md); the documented audit has residual findings, not a zero-risk result. Report vulnerabilities privately through [SECURITY.md](SECURITY.md).
