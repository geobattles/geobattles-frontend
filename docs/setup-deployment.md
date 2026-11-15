# Setup and deployment

## Local development

Install and check with the pinned toolchain in [CONTRIBUTING.md](../CONTRIBUTING.md). Runtime work is separately scoped: use only an approved isolated backend/database and preserve existing services and private configuration. Backend startup can auto-migrate schemas.

For local runtime, copy `.env.example` to ignored `.env` only if it does not already exist. Keep credentials out of Git, logs, screenshots and Docker build arguments. `npm run dev` binds to `127.0.0.1:3000`; the example API uses `http://127.0.0.1:8080`. Another device's loopback is not your development machine.

| Variable                   | Meaning                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_BACKEND_HOST` | Browser-reachable HTTP/WebSocket base, such as `http://127.0.0.1:8080` or `/api`  |
| `NUXT_BACKEND_SERVER_HOST` | Private absolute SSR authentication API base; empty falls back to the public base |
| `NUXT_PUBLIC_GMAPS_API`    | Public browser Maps key; blank for checks                                         |

For same-origin reverse-proxy hosting, public `/api` and private `http://backend:8080` are an example pair, with `backend` replaced by the reachable private service name. The proxy must strip `/api` and forward WebSocket upgrades. Environment settings do not create the proxy. Relative `/api` cannot be fetched directly by Node SSR, so provide the private absolute base. Never expose private container names or secrets through public runtime configuration.

Restrict browser Maps keys by allowed APIs and website referrers. Keep backend keys separate and restricted. Starting services with keys for manual play does not authorize automated paid rounds or experiments.

## Devcontainer

The devcontainer builds on `node:24.22.3-alpine`, pins npm 11.19.1, adds Bash/Git/SSH tooling and runs as non-root `node`. Creation runs `npm ci`, which prepares Nuxt, without starting services or forwarding ports automatically. Use a separate checkout if host development owns generated files.

A separately approved tooling-only check is:

```bash
docker build -t geobattles-frontend-devcontainer:local-check .devcontainer
docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges   geobattles-frontend-devcontainer:local-check   bash -lc 'node --version && npm --version && git --version && id && test "$(id -u)" != 0'
```

Image construction downloads tools. The final probe has no network, app mount or published port; it does not verify VS Code attachment, application builds or gameplay.

## Production-mode local check

Build only in an inactive isolated checkout/container when another dev server owns `.nuxt`. Docker builder/runtime use Node 24.22.3 and npm 11.19.1; the builder prepares Nuxt after copying the app, and runtime copies `.output` rather than the entire builder dependency tree. Preserve `.dockerignore` credential exclusions.

For a separately approved keyless HTTP-only check:

```bash
docker build --build-arg VERSION=local-check -t geobattles-frontend:local-check .
docker run --rm --name geobattles-frontend-local-check -p 127.0.0.1:3001:3000   -e NUXT_PUBLIC_GMAPS_API=   -e NUXT_PUBLIC_BACKEND_HOST=http://127.0.0.1:9   -e NUXT_BACKEND_SERVER_HOST=http://127.0.0.1:9   geobattles-frontend:local-check
```

Choose a free alternate port. From another terminal, `curl --fail http://127.0.0.1:3001/` checks the HTTP shell without executing JavaScript. Stop only the container you created. Do not open a browser as part of this check. It does not verify authentication, hydration, multiplayer, Maps or PWA updates.

## Release gates

Branch/PR checks do not publish. The image workflow is manual and master-only; dispatch, deployment, registry writes and production access need explicit approval. Confirm the reviewed revision, clean installation/checks, dependency findings, exact image and rollback plan.

Use the [backend repository](https://github.com/geobattles/geobattles-backend) and its `docs/production-release.md` from the matching release for paired versions, HTTPS/WSS, backup/restore and operational controls. Do not assume the backend default branch already contains that release's documents. A local LAN Compose stack is not a production recipe. Verify browser/SSR routing, [gameplay acceptance](testing.md#release-acceptance) and [PWA updates](pwa-lifecycle.md) on the intended artifact. Builds and HTTP readiness are not release certification.
