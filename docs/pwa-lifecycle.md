# PWA lifecycle

## Installation and cache boundary

The generated manifest and worker use root identity, start URL and scope `/`, standalone display and charcoal theme `#0c1916`. Subpath hosting needs a coordinated change. The 192px and 512px manifest icons use purpose `any` and iOS has a 180px Apple touch icon. The existing artwork extends outside the maskable safe zone.

### Installation experience

**How to install GeoBattles** is available beside sign-in and in the signed-in account menu. A client owner retains a compatible `beforeinstallprompt` event and consumes it on the next explicit install action. A browser installation confirmation or an installed display mode hides the entry. A regular tab can still offer installation guidance if the same site has been installed elsewhere.

The manual guide uses Safari’s Share and Add to Home Screen controls on iPhone and iPad. Other browsers get guidance for their available menu options. Embedded browsers can use **Copy link** to move the current page, including an invitation query and fragment, to Safari or another regular browser. Native prompting depends on browser support and a trustworthy HTTPS or loopback origin.

Mobile suggestions appear on a return to the homepage or after a player's result is confirmed and the champion reveal has closed. The results card sits after the standings so it leaves room for rematch controls. Authentication, lobby admission, settings and game actions take priority. An impression or dismissal pauses automatic suggestions for 14 days. The account entry remains available during that time. The preference stores a visit flag and timestamps on this device.

### Viewport and cache

The document uses `viewport-fit=contain` and the opaque iOS status-bar style so the browser can reserve system-bar space. When a browser exposes safe-area insets, the relevant header, overlay, or bottom controls apply that inset at the edge they occupy. The installed Android header reserves additional top clearance if the reported inset and visual viewport offset are smaller than the status bar allowance. The shell uses dynamic viewport height with a CSS fallback. Standalone and fullscreen surfaces use the app’s settled visual viewport at scale 1. Keyboard editing and pinch zoom keep the last settled shell dimensions while form overlays use the visible rectangle. Installed Android and iOS status bars and gesture areas need verification in portrait and landscape on the device.

The worker precaches selected public build-time JS/CSS, images, icons, manifest and module-added build metadata. Explicit ignores exclude HTML and page payloads. `runtimeCaching: []` and no navigation fallback mean this worker does not cache authentication/API responses, WebSockets, private game payloads or Maps requests. It is not an offline gameplay/navigation shell; fresh offline navigation can fail.

Development worker generation and registration are disabled. Use a separate development origin/profile because disabling registration does not uninstall an older worker already controlling that origin.

## Update policy

Routine updates download quietly. The browser activates a waiting worker once its predecessor has no open GeoBattles tabs or app windows to control.

- `PwaUpdateNotice.client.vue` owns native `/sw.js` registration with root scope and `updateViaCache: "none"`. Module automatic registration is disabled.
- `skipWaiting: false` keeps a new worker waiting while old controlled clients remain. The app neither sends `SKIP_WAITING` nor presents a waiting-worker notice. Do not use DevTools skip-waiting for acceptance.
- `clientsClaim: true` can control the first uncached page after activation without reloading it.
- Returning to the foreground or reconnecting while visible checks for updates without polling. Offline failures keep the current worker and permit later checks.
- Nuxt automatic build checking and chunk-reload plugins are disabled with `checkOutdatedBuildInterval: false` and `emitRouteChunkError: false`. In the pinned Nuxt source, `"manual"` still includes a crawler reload path; it is not equivalent to `false`.
- A `vite:preloadError` shows a dismissible suggestion to refresh or reopen when the player is ready. The notice lets the failed import reject and leaves the current session in place. Failed destination imports still fail normally. User retry may not refetch a browser-cached failed import; reopening can be necessary.

The mounted Vue instance owns visibility, online and preload listeners. Render-only HMR retains them; actual unmount cleans them up. A late registration result must not attach new listeners after disposal. Teardown does not unregister the shared worker or leave a game.

Already-loaded older clients retain their executing JavaScript and may have different reload/update behavior. A new server/worker cannot retroactively change them. Close old clients before adopting the current policy. Browser/OS termination, manual reload, DevTools overrides and failures before the root mounts remain outside its guarantee.

## Acceptance

Use an approved persistent non-incognito profile at a stable trustworthy HTTPS/loopback origin, with two reviewed builds and no storage clearing between them.

1. Install/launch the starting build through actual browser/OS UI. Verify a controller appears without document reload and inspect the static-only cache boundary. Manifest validity alone is not installation evidence.
2. Keep an installed window and a sibling tab open. Serve the replacement at the same origin, foreground a client or request a registration update, and observe a waiting worker with no popup, reload or controller swap.
3. Close one client only: the replacement should remain waiting. Close all old tabs/app windows, including suspended instances as needed, then reopen. Verify the new version/controller and obsolete-cache cleanup.
4. Separately check quiet first/already-waiting workers, offline update failure/retry, the dismissible notice on a failed route asset, fullscreen notice accessibility, unsupported/denied worker storage and listener cleanup/HMR. Never force activation to turn a failure into a pass.

Record browser/OS, origin, starting/ending versions and observed results. See [testing](testing.md); ordinary browser suites block service workers and cannot establish this acceptance.
