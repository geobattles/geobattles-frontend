# Runtime recovery

## Authentication and route ownership

The universal auth owner coordinates revision-scoped bootstrap/refresh and token issuance per Nuxt app or SSR request. Stale responses cannot revive a superseded identity. Token-purpose inspection supports compatibility/UI decisions; only the backend verifies signatures and authorizes access.

Logout clears local state immediately and uses the existing raw access token without refresh. Its ten-second deadline and uncertain-revocation latch fail closed: a timeout/unknown server outcome does not permit new issuance in that client app. Browser abort does not prove server cancellation. This coordination is not distributed across tabs/devices/reloads; reloading is not evidence that server revocation finished.

Create/join intents are separate from socket generations and must remain current before requests, after responses and before navigation. Successful committed navigation owns membership switching/leaving. Confirmation guards only decide; a failed, cancelled or superseded route must not tear down the previous session. Automatic phase navigation uses an exact local history-state operation ticket, not same-path inference, and cannot restart expired admission. Deliberate user retry can establish a new admission attempt.

## Socket lifecycle

A single absolute 30-second admission/recovery window includes authentication, retries, offline time and suspended timers. Same-lobby callers share readiness; backoff never grants a fresh window. A complete own JOINED snapshot with connected membership establishes readiness in every phase. Its matching immediate REJOIN companion must not restore the same countdown/markers twice.

An admitted socket that drops enters recovery right away; the first reconnection does not wait for the public lobby list. Normal bounded backoff still applies. If a connection fails before admission, the browser cannot read its HTTP 401/409 rejection body. An attempt-owned lobby-list check can establish a missing lobby only from a successful response for the exact ID. An offline or failed check is not proof of absence. Replacing or cancelling the attempt aborts its check.

Terminal failure releases session resources and awaits explicit retry. The server's membership grace period is a separate 30 seconds from server detection of the drop; the frontend cannot extend it or guarantee readmission.

Lobby and game routes show a cancellable join panel instead of empty controls. On the waiting-lobby page, allow at least two seconds for the join animation while admission runs in parallel; show the lobby once both the display minimum and server confirmation are satisfied. This does not delay recoveries, connection errors or entry into an active round. A transient loss keeps the last confirmed view visible with an amber connection banner; server actions remain gated and the round clock continues. A successful snapshot clears the interruption. A terminal failure uses the red dropped-signal panel with recovery actions; map loading and map retry remain independent. The banner reports changes without announcing every retry second, and decorative motion respects reduced-motion settings.

Show transient feedback inside an open settings dialog without discarding its draft. Announce failure before admission and move focus to Home if the joining Cancel control had focus. During compact gameplay, keep the dismissed recovery shortcut in the map's focus scope; give Maps recovery controls priority over the brief restored strip. A manual retry that loses route ownership must not produce a stale error toast.

Transport loss retains the server's bounded lease; intentional leave/switch/logout sends `disconnect` before closing. Sending is not a removal acknowledgement. Host transfers to the longest-present connected participant; returning hosts do not reclaim it automatically. Runtime-owned online/offline presentation listeners remain useful even after a terminal socket attempt ends.

Ready, start and guess have command-specific pending state. An authoritative matching snapshot acknowledges Ready; an error settles only its named command. Recovery/phase ownership changes may reset all pending commands. Never turn a local send into an optimistic server acknowledgement or automatically retry a provider error.

## Round restoration

Apply membership, phase, round, raw attempts, scored best rows, history and totals as one authoritative snapshot. Restore PLAYING with its remaining deadline; MID-ROUND/FINISHED must not start a countdown or panorama. New game history clears only after successful first-round START.

While submitting a guess, keep the draft and freeze its location until the ordered result or command error arrives. On transport recovery, compare the saved player, lobby, match and round with the restored snapshot. Restore the draft only when the player still has a guess available and the snapshot contains no attempt newer than the one recorded before the send. Resubmission requires a new player action.

The backend deadline remains authoritative. START and recovery provide `timeRemaining` in milliseconds, including valid zero. Same-game/round/phase updates may shorten the client deadline but must not extend it. On terminal expiry the countdown is hidden; the limit is kept in memory across deliberate Retry only when a server game ID can distinguish the same round from a replay. A different identity, lobby, game or round never inherits it. Presentation uses wall-clock elapsed time and refreshes on resume; network latency means it is not an exact synchronized clock.

Score presence requires a real attempt and finite distance, not truthiness: zero metres and zero coordinates are valid. Best geometry is selected by distance, not capped score. Disconnected/removed members' scored history remains available. Incomplete finalized history must not become a journal entry.

## Maps-only recovery

Maps failures are separate from transport recovery. Explicit **Retry map** does not send START, refresh auth, rejoin, reset the deadline or reload the document. Lazy script/library waits are bounded and single-flight; a retry needs a current authoritative view grant. Old callbacks cannot settle a newer attempt. Preserve healthy objects and live camera/draft state; rebuild only interrupted bindings/overlays.

Map initialization is not proof of tile completeness. Panorama readiness requires native status `OK`. Configuration/authorization failures have distinct feedback rather than endless retry. Missing browser key blocks start locally without a provider request; a nonblank key is not proof that it is valid or within quota.

Result framing retains the authoritative answer and actual scored player locations, excluding timeout placeholders. Refit those bounds after the existing host becomes visible/nonzero, reparenting or resizing, with 50px padding and minimum zoom 0. Gameplay country framing is a separate one-shot contract in [regions](region-settings.md); subsequent layout changes preserve the live camera. Do not recreate SDK objects to fix layout.

## Diagnostics and verification

**About → Game diagnostics** and recovery Details expose allowlisted build/status, phase/round, retries and resource timing/counts. They must not copy names, player IDs, lobby codes, coordinates, tokens, URL queries, runtime configuration or raw provider errors. Clipboard denial has a selectable fallback; no automatic telemetry is uploaded.

**Check server** explicitly requests `/readyz` and `/version` without credentials/cache/redirects, with a four-second abort. Readiness is not full gameplay/provider availability.

Use the [testing guide](testing.md) for authenticated hard reloads, all recovery phases, late callbacks, deliberate leave versus transport loss, exact-zero scores and Maps retry acceptance. Source guards and builds do not prove those runtime paths.
