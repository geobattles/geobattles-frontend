# Copilot instructions

Read [AGENTS.md](../AGENTS.md), [CONTRIBUTING.md](../CONTRIBUTING.md) and the relevant [docs](../docs/README.md). Preserve unrelated edits and use scoped branches from public `master`.

- Use Node 24.22.3/npm 11.19.1/Nuxt 4.6.4; `package.json` is authoritative. Preserve the lockfile. `npm run check` runs formatting, typecheck and build, not gameplay verification. Keep generated output separate from live development servers.
- Nuxt application code is under `app/`; `~` targets it and `~~` targets the root. Use serializable request-scoped `useState` and native Vue composables, not Pinia or a homemade store framework.
- Explicit client owners manage sockets, SDK objects, DOM listeners and timers. Capture composable dependencies during setup and clean up asynchronous resources. A page's `<ClientOnly>` does not guard its own script setup.
- Use native accessible controls, local SVG icons and charcoal/green dark-only styles. Do not introduce PrimeVue, Pinia, Three.js or heavy replacements. Preserve desktop behavior during mobile changes.
- Preserve raw-JWT HTTP `Authorization`, WebSocket `["json", token]` and backend-authoritative lifecycle/scoring. Do not change dependencies or wire contracts outside scope.
- Browser API URLs must be reachable by the browser. Private absolute `NUXT_BACKEND_SERVER_HOST` serves SSR; a public relative `/api` requires it and a correctly configured proxy. Never expose internal service names or secrets through `NUXT_PUBLIC_*`.
- Never read out, commit or log secrets/private payloads. Keep browser Maps keys blank for checks and restrict real keys by API/referrer.
- No unrequested service/browser startup, paid calls, production access, commits, remote writes, workflow dispatch, publication or deployment. Backend startup can migrate its database.
- New application unit tests/frameworks are opt-in. Existing optional socket/browser suites require approved isolated local services and explicit Maps limits. Report actual results and unverified behavior. Keep internal session records outside the public repository.
