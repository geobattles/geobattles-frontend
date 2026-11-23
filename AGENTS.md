# Agent contribution guide

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the relevant [documentation](docs/README.md) before editing. Preserve unrelated work and start scoped feature branches from public `master`.

- Use Node 24.22.3, npm 11.19.1 and Nuxt 4.6.4; `package.json` is authoritative. Install with `npm ci`; verify with `npm run check`. Do not write generated output in a checkout owned by a running dev server.
- Application code lives in `app/`. Use request-scoped, serializable Nuxt `useState` and native Vue composables. Keep WebSockets, Maps objects, DOM listeners and timers in explicit client owners with teardown. Existing `use*Store` names are facades, not a state framework.
- Keep native accessible controls and the charcoal/green dark-only UI. Do not add Pinia, PrimeVue, Three.js or heavy replacement state/UI libraries.
- Preserve raw-JWT HTTP `Authorization`, WebSocket subprotocols `["json", token]`, backend authority and existing wire contracts. Scope dependency, gameplay and protocol changes explicitly; never force-upgrade the lockfile.
- Preserve SSR/private-versus-public runtime configuration. `NUXT_PUBLIC_*` is browser-visible. Never print, log or commit secrets. Use the configured browser Maps key for requested manual gameplay and Android PWA play checks. Leave Google keys blank for routine automated checks.
- Do not start services or browsers, use paid APIs, access production, publish, deploy or make remote writes unless requested and approved. Backend startup can migrate its database. A manual release workflow is not permission to dispatch it.
- Application unit tests and new test frameworks are opt-in. Existing optional socket/browser suites require isolated local scope and explicit Maps budgets; see [testing](docs/testing.md).
- Do not commit, push or open PRs unless requested. Report actual checks and limits, not inferred runtime success. Keep internal task/session records outside the public repository; public docs describe the current product and contributor workflows.
