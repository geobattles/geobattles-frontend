# Runtime recovery

## Authentication and route ownership

The universal auth owner coordinates revision-scoped bootstrap/refresh and token issuance per Nuxt app or SSR request. Stale responses cannot revive a superseded identity. Token-purpose inspection supports compatibility/UI decisions; only the backend verifies signatures and authorizes access.

Logout clears local state immediately and uses the existing raw access token without refresh. Its ten-second deadline and uncertain-revocation latch fail closed: a timeout/unknown server outcome does not permit new issuance in that client app. Browser abort does not prove server cancellation. This coordination is not distributed across tabs/devices/reloads; reloading is not evidence that server revocation finished.

Create/join intents are separate from socket generations and must remain current before requests, after responses and before navigation. Successful committed navigation owns membership switching/leaving. Confirmation guards only decide; a failed, cancelled or superseded route must not tear down the previous session. Automatic phase navigation uses an exact local history-state operation ticket, not same-path inference, and cannot restart expired admission. Deliberate user retry can establish a new admission attempt.

## Socket lifecycle

A single absolute 30-second admission/recovery window includes authentication, retries, offline time and suspended timers. Same-lobby callers share readiness; backoff never grants a fresh window. A complete own JOINED snapshot with connected membership establishes readiness in every phase. Its matching immediate REJOIN companion must not restore the same countdown/markers twice.

Terminal failure releases session resources and awaits explicit retry. The server's grace deadline is independent; the client window does not guarantee readmission. Browser WebSocket errors cannot reveal an HTTP 401/409 rejection body. A bounded public lobby-list probe can establish a missing exact lobby only after a successful response; offline/probe failures must not be relabeled as confirmed absence.

Transport loss retains the server's bounded lease; intentional leave/switch/logout sends `disconnect` before closing. Sending is not a removal acknowledgement. Host transfers to the longest-present connected participant; returning hosts do not reclaim it automatically. Runtime-owned online/offline presentation listeners remain useful even after a terminal socket attempt ends.

Ready, start and guess have command-specific pending state. An authoritative matching snapshot acknowledges Ready; an error settles only its named command. Recovery/phase ownership changes may reset all pending commands. Never turn a local send into an optimistic server acknowledgement or automatically retry a provider error.

## Round restoration

Apply membership, phase, round, raw attempts, scored best rows, history and totals as one authoritative snapshot. Restore PLAYING with its remaining deadline; MID-ROUND/FINISHED must not start a countdown or panorama. New game history clears only after successful first-round START.

The backend deadline remains authoritative. START and recovery provide `timeRemaining` in milliseconds, including valid zero. Same-game/round/phase updates may shorten the client deadline but must not extend it. Presentation uses wall-clock elapsed time and refreshes on resume; network latency means it is not an exact synchronized clock.

Score presence requires a real attempt and finite distance, not truthiness: zero metres and zero coordinates are valid. Best geometry is selected by distance, not capped score. Disconnected/removed members' scored history remains available. Incomplete finalized history must not become a journal entry.

## Maps-only recovery

Maps failures are separate from transport recovery. Explicit **Retry map** does not send START, refresh auth, rejoin, reset the deadline or reload the document. Lazy script/library waits are bounded and single-flight; a retry needs a current authoritative view grant. Old callbacks cannot settle a newer attempt. Preserve healthy objects and live camera/draft state; rebuild only interrupted bindings/overlays.

Map initialization is not proof of tile completeness. Panorama readiness requires native status `OK`. Configuration/authorization failures have distinct feedback rather than endless retry. Missing browser key blocks start locally without a provider request; a nonblank key is not proof that it is valid or within quota.

Result framing retains the authoritative answer and actual scored player locations, excluding timeout placeholders. Refit those bounds after the existing host becomes visible/nonzero, reparenting or resizing, with 50px padding and minimum zoom 0. Gameplay country framing is a separate one-shot contract in [regions](region-settings.md); subsequent layout changes preserve the live camera. Do not recreate SDK objects to fix layout.

## Diagnostics and verification

**About → Game diagnostics** and recovery Details expose allowlisted build/status, phase/round, retries and resource timing/counts. They must not copy names, player IDs, lobby codes, coordinates, tokens, URL queries, runtime configuration or raw provider errors. Clipboard denial has a selectable fallback; no automatic telemetry is uploaded.

**Check server** explicitly requests `/readyz` and `/version` without credentials/cache/redirects, with a four-second abort. Readiness is not full gameplay/provider availability.

Use the [testing guide](testing.md) for authenticated hard reloads, all recovery phases, late callbacks, deliberate leave versus transport loss, exact-zero scores and Maps retry acceptance. Source guards and builds do not prove those runtime paths.
