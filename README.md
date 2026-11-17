# GeoBattles

GeoBattles is an open-source interactive geolocation guessing game where players compete to identify locations from Google Street View panoramas.

Try the game at [geobattles.xyz](https://geobattles.xyz/). Repository changes are not necessarily deployed there.

## 🌍 About the Game

GeoBattles features a **Battle Royale** mode where players can play solo or compete against others to guess locations, with configurable round timers and guess limits.

The game offers real-time **multiplayer**, live statistics and interactive maps, with world, continent and country selection. Players mark ready before starting a game, and completed matches can be reviewed in a device-local Expedition Journal. Country Battle remains unfinished and disabled.

This repository contains the **Nuxt 4 frontend**, built with Vue, TypeScript, Tailwind and native HTML controls. The [Go backend](https://github.com/geobattles/geobattles-backend) is maintained separately.

### Supports also mobile devices!

GeoBattles has responsive desktop, phone and tablet layouts, including touch-friendly map controls. On compatible browsers it can be installed as a **Progressive Web App (PWA)** from an HTTPS site. Installation does not provide offline gameplay; playing still requires the backend and Google services. See [PWA installation and updates](docs/pwa-lifecycle.md) for browser requirements and update behavior.

## Production setup

To self-host the complete game with frontend, backend and PostgreSQL containers, follow the [backend's production setup](https://github.com/geobattles/geobattles-backend#production-setup) for the matching release.

The prebuilt frontend image is **`ghcr.io/geobattles/geobattles-frontend:latest`**. Use it with a compatible backend; for repeatable updates and rollback, optionally pin matching image tags or digests. Publishing an image does not update an already-running container.

The [checks workflow](.github/workflows/checks.yml) automatically runs formatting, type checking and the Nuxt build on pushes and pull requests. The [image publishing workflow](.github/workflows/build-publish.yml) is separate: dispatch it manually on `master` only after maintainer approval to publish `latest` and commit-SHA tags. `latest` means the last published image, not necessarily the current repository code.

Use HTTPS/WSS through a reverse proxy and keep the database private. Configure both browser-reachable and server-side API addresses as described in [setup and deployment](docs/setup-deployment.md). A frontend container alone is not the complete game.

## Development setup

### Prerequisites

- Node.js **24.22.3**, pinned in [.nvmrc](.nvmrc), and npm **11.19.1**.
- Git; nvm is recommended for selecting the pinned Node version.
- A compatible Go backend and a restricted Google Maps JavaScript API key for gameplay. Neither is needed for static checks or the frontend build.

Use npm and the checked-in `package-lock.json`; [package.json](package.json) defines the supported versions and commands.

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/geobattles/geobattles-frontend geo-frontend
    cd geo-frontend
    ```

2. Select the toolchain and install the locked dependencies:

    ```bash
    nvm install
    nvm use
    npm --version # 11.19.1
    npm ci
    ```

    If npm differs, follow the [contributor setup](CONTRIBUTING.md#toolchain-and-checks) to select the pinned version.

3. For local gameplay, create a private `.env` from `.env.example` **only if it does not already exist**, then configure:

    | Variable                   | Purpose                                                                                |
    | -------------------------- | -------------------------------------------------------------------------------------- |
    | `NUXT_PUBLIC_GMAPS_API`    | Browser Maps key, restricted to Maps JavaScript API and the website's referrers        |
    | `NUXT_PUBLIC_BACKEND_HOST` | Browser-reachable API/WebSocket base, such as `http://127.0.0.1:8080`                  |
    | `NUXT_BACKEND_SERVER_HOST` | Optional absolute API base for SSR authentication; empty falls back to the public base |

    Keep `.env` out of Git. Browser keys are public configuration; never put database passwords or signing secrets into `NUXT_PUBLIC_*` variables. Use a separate restricted backend Street View key, with API quotas and billing alerts.

The frontend can be installed and built independently of a backend checkout. Run the compatible backend separately for gameplay; its startup can migrate its database, so use an isolated development database. A relative public `/api` prefix requires a private absolute SSR base and a reverse proxy that strips the prefix and forwards WebSockets; see [setup and deployment](docs/setup-deployment.md).

### Project structure

| Location         | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `app/`           | Nuxt pages, components, styles, composables and client runtime owners |
| `public/`        | Public images, icons and other static assets                          |
| `nuxt.config.ts` | Nuxt modules, runtime configuration, build and PWA settings           |
| `docs/`          | Contributor, architecture and operations guides                       |
| `e2e/`, `tools/` | Optional integration/browser tooling and asset generators             |

Nuxt's `~` alias resolves to `app/`, while `~~` resolves to the repository root. See [architecture](docs/architecture.md) for the detailed layout.

## 🛠️ Development

Start the development server on **http://127.0.0.1:3000**:

```bash
npm run dev
```

Run formatting, type checking and the production build without a backend or Google key:

```bash
npm run check
```

For a local production-mode preview:

```bash
npm run build
npm run preview
```

`npm ci`, checks and builds prepare generated Nuxt output. Do not run them alongside a development server in the same checkout; use an isolated checkout or container instead. Separate opt-in socket/browser checks and gameplay acceptance are described in [testing](docs/testing.md).

## 🐳 Docker

The Dockerfile builds the Nuxt SSR application and runs its output as a non-root user on container port **3000**. Local environment files are excluded from the image; pass runtime configuration when starting the container, not through secret build arguments.

### Running locally with Docker

1. Build the frontend image:

    ```bash
    docker build --build-arg VERSION="$(git rev-parse HEAD)" -t geobattles-frontend:local .
    ```

2. Run it against your compatible backend. Replace both `https://api.example.com` values below with the appropriate API address reachable from your browser and container; `.env` supplies the restricted browser Maps key:

    ```bash
    docker run --rm --name geobattles-frontend-local \
      -p 127.0.0.1:3000:3000 \
      --env-file .env \
      -e NUXT_PUBLIC_BACKEND_HOST=https://api.example.com \
      -e NUXT_BACKEND_SERVER_HOST=https://api.example.com \
      geobattles-frontend:local
    ```

    To use the prebuilt image instead, skip the build and replace the final image reference with `ghcr.io/geobattles/geobattles-frontend:latest`.

Do not use `127.0.0.1` inside the frontend container to address a separate backend. When both containers share a Docker network, the private SSR base can instead be `http://backend:8080`; the public base must still be reachable by the browser. These settings do not create a reverse proxy or start the backend.

For the complete stack, use the [backend setup instructions](https://github.com/geobattles/geobattles-backend#production-setup), or its `docs/local-lan-deployment.md` from the matching release for a trusted-network development preview. This example publishes only to the local computer; a phone needs the separately configured LAN gateway described in that guide. An HTTP LAN preview is not production HTTPS hosting.

## Contributing and documentation

- [Contributing](CONTRIBUTING.md): toolchain, feature branches, checks and devcontainer workflow.
- [Documentation index](docs/README.md): architecture, recovery, layouts, regions, PWA and deployment.
- [Dependency security](docs/dependency-security.md): dependency findings and update policy.
- [Security reporting](SECURITY.md): private vulnerability disclosure.
