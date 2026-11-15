# PWA lifecycle

## Installation and cache boundary

The generated manifest/worker use root identity, start URL and scope `/`, standalone display and charcoal theme `#181818`. Subpath hosting needs a coordinated change. PNG icons live in `public/icons/`; manifest icons have purpose `any`, not maskable. Installation uses native browser/OS UI.

The worker precaches selected public build-time JS/CSS, images, icons, manifest and module-added build metadata. Explicit ignores exclude HTML and page payloads. `runtimeCaching: []` and no navigation fallback mean this worker does not cache authentication/API responses, WebSockets, private game payloads or Maps requests. It is not an offline gameplay/navigation shell; fresh offline navigation can fail.

Development worker generation and registration are disabled. Use a separate development origin/profile because disabling registration does not uninstall an older worker already controlling that origin.

## Update policy

Finish playing, close **all** GeoBattles tabs and installed app windows, then reopen. One idle tab cannot decide that another client is safe to interrupt.

- `PwaUpdateNotice.client.vue` owns native `/sw.js` registration with root scope and `updateViaCache: "none"`. Module automatic registration is disabled.
- `skipWaiting: false` keeps a new worker waiting while old controlled clients remain. The app does not send `SKIP_WAITING`; dismissing the notice does not activate or unregister it. Do not use DevTools skip-waiting for acceptance.
- `clientsClaim: true` can control the first uncached page after activation without reloading it. Controller changes synchronize notice state without game/session actions.
- Foreground/update events check for updates without polling. Offline failures keep the current worker and permit later checks.
- Nuxt automatic build checking and chunk-reload plugins are disabled with `checkOutdatedBuildInterval: false` and `emitRouteChunkError: false`. In the pinned Nuxt source, `"manual"` still includes a crawler reload path; it is not equivalent to `false`.
- The native `vite:preloadError` notice does not prevent rejection, reload, retry navigation or tear down membership. Failed destination imports still fail normally. User retry may not refetch a browser-cached failed import; reopening can be necessary.

The mounted Vue instance owns service-worker/visibility/preload listeners. Render-only HMR retains them; actual unmount cleans them up. A late registration result must not attach new listeners after disposal. Teardown does not unregister the shared worker or leave a game.

Already-loaded older clients retain their executing JavaScript and may have different reload/update behavior. A new server/worker cannot retroactively change them. Close old clients before adopting the current policy. Browser/OS termination, manual reload, DevTools overrides and failures before the root mounts remain outside its guarantee.

## Acceptance

Use an approved persistent non-incognito profile at a stable trustworthy HTTPS/loopback origin, with two reviewed builds and no storage clearing between them.

1. Install/launch the starting build through actual browser/OS UI. Verify a controller appears without document reload and inspect the static-only cache boundary. Manifest validity alone is not installation evidence.
2. Keep an installed window and a sibling tab open. Serve the replacement at the same origin, foreground a client or request a registration update, and observe a waiting worker plus dismissible notice without reload/controller swap.
3. Close one client only: the replacement should remain waiting. Close all old tabs/app windows, including suspended instances as needed, then reopen. Verify the new version/controller and obsolete-cache cleanup.
4. Separately check first/already-waiting notices, offline update failure/retry, failed route assets, fullscreen notice accessibility, unsupported/denied worker storage and listener cleanup/HMR. Never force activation to turn a failure into a pass.

Record browser/OS, origin, starting/ending versions and observed results. See [testing](testing.md); ordinary browser suites block service workers and cannot establish this acceptance.
