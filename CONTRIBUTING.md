# Contributing

## Start a scoped change

Create a feature branch from the current public `master` in your clone or fork:

```bash
git switch master
git switch -c feat/your-change
```

Update your local master from the intended public upstream before branching. Preserve unrelated edits; do not reset another contributor's work. Keep dependency upgrades, gameplay changes and cross-repository protocol changes separately reviewable. Discuss broad changes with maintainers before implementation.

## Toolchain and checks

Use Node 24.22.3 and npm 11.19.1. The pins in [package.json](package.json) and `.nvmrc` govern setup.

```bash
nvm install
nvm use
node --version # v24.22.3
npm --version # 11.19.1
npm ci
npm run check
```

If necessary, install the pinned npm after selecting Node: `npm install --global npm@11.19.1`. The `packageManager` field records the version; it does not install it.

`check` runs formatting, typecheck and build, stopping on failure. No backend, credentials, Google key or browser is required. Both `npm ci` and checks can write generated Nuxt output: use an isolated checkout/container when a live server owns `.nuxt`. Do not stop or restart someone else's services without permission. Never edit generated `.nuxt` files.

Format only deliberately changed files with the installed Prettier, for example `./node_modules/.bin/prettier --write README.md`. The repository-wide `npm run format` is appropriate only when that broader scope is intended.

Application unit tests and new test frameworks require explicit agreement. Existing socket integration and browser E2E are optional, separate from routine checks, and keyless by default. They require approved isolated local services; Maps scenarios also require explicit spending limits. See [testing](docs/testing.md).

## Architecture conventions

- Nuxt 4.6.4 uses the default `app/` directory. `~` resolves there; `~~` resolves to the repository root. Configuration, public assets and tooling stay at the root.
- Use serializable request-scoped Nuxt state and focused Vue composables. Existing `use*Store` names are compatibility facades, not Pinia. Keep sockets, SDK objects, DOM handles and timers in explicit client owners with cleanup.
- Use native accessible Vue/HTML controls, local SVG icons and the charcoal/green dark-only theme. Do not add Pinia, PrimeVue or heavy replacement state/UI libraries.
- Preserve raw-JWT HTTP `Authorization` and WebSocket subprotocols `["json", token]`. Backend state owns membership, readiness, scores and match lifecycle.
- Keep strict typing and Nuxt project references, including indexed-access checks. Do not silence errors by disabling SSR, checks or warnings.

See [architecture](docs/architecture.md), [native state](docs/native-state.md) and [layout and controls](docs/layout-controls.md).

## Runtime and optional devcontainer

[Setup and deployment](docs/setup-deployment.md) covers local configuration, browser versus SSR origins, Docker and the devcontainer. Never commit secrets or private environment files. Browser-exposed Maps keys need API/referrer restrictions, not claims of secrecy. Backend startup can auto-migrate its database; use only an approved isolated development database.

The devcontainer uses Node 24.22.3/npm 11.19.1, runs as non-root `node`, and installs locked dependencies with `npm ci`. It does not start the app/browser or automatically forward ports. Use a separate checkout if the host's generated directories are live.

## Review and publication

Before submitting, inspect `git status --short --branch`, the complete diff and untracked files. Run the applicable checks; stage explicit paths and inspect `git diff --cached --check` and the staged file list. Keep environment files, generated output, browser artifacts, internal work logs and local backups out of Git. Do not use blanket `git clean -fdx` to remove private data.

Describe purpose, behavior changes, actual check results, warnings, unverified behavior and rollback in the PR. A build is not gameplay evidence. Preserve licensing and asset attribution.

Branch/PR validation runs `npm ci` and `npm run check` without publishing. Image publication is a manual `workflow_dispatch` on `master` and still requires explicit maintainer approval. Pushing, remote writes, deployment and paid provider usage are distinct operations, not consequences of a successful local check.
