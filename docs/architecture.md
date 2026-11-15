# Frontend architecture

GeoBattles uses Nuxt 4.6.4, Vue, strict TypeScript, Tailwind 3 and native HTML controls. The application has no Pinia, PrimeVue or Three.js landing globe. [package.json](../package.json) defines the pinned dependencies.

## Source layout

| Location                                             | Responsibility                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `app/app.vue`, `app/pages/`                          | SSR route shell, navigation and page composition                      |
| `app/components/`                                    | Domain UI and small native controls in `Ui/`                          |
| `app/composables/`                                   | Request-scoped data, captured actions, socket handlers and Vue timers |
| `app/services/`                                      | HTTP authentication and lobby factories                               |
| `app/plugins/auth-runtime.ts`, `app/runtime/auth.ts` | Per-Nuxt-app authentication coordination, including SSR               |
| `app/plugins/game-runtime.client.ts`, `app/runtime/` | Client socket, Google, overlay and DOM resource ownership             |
| `app/types/`, `app/utils/`                           | Application/wire types and pure helpers                               |
| `app/assets/`, `public/`                             | Bundled application data/styles and public assets                     |
| `e2e/`, `tools/`                                     | Optional browser/protocol checks and asset generators                 |

Nuxt's default `app/` layout makes `~` app-relative and `~~` root-relative. Configuration, Docker and documentation stay at the root. TypeScript references Nuxt's generated app/server/shared/Node projects; Google Maps globals belong to the app project. Keep strict indexed-access checks. Do not create a shared/server layer without actual server-side responsibilities.

## Backend contract

Protected HTTP sends the raw JWT in `Authorization`, without `Bearer`. The socket connects to `/lobbySocket?id=…` using subprotocols `["json", token]`. A configured `/api` proxy prefix also applies to the socket. [Setup](setup-deployment.md) distinguishes public browser and private SSR origins.

The backend owns membership, host, readiness, round numbers, scores and deadlines. Phases are `WAITING`, `PLAYING`, `MID-ROUND`, `FINISHED`; `STARTING` is client countdown presentation. Waiting uses `/lobby/:id`, nonwaiting play uses `/gameplay-:id`.

- A complete own-member `JOINED_LOBBY` snapshot acknowledges admission, not a WebSocket open or SDK load.
- `setReady` carries an explicit boolean. Initial play/replay requires all retained members connected and ready; next-round progression does not. Settings changes preserve Ready values. Transport/match lifecycle rules remain separate.
- Supplied envelope `seq` must be a positive safe integer. Gaps are valid for private replies; each new connection generation resets its fence. Omitted sequence fields retain legacy compatibility.
- `gameId` identifies a successful match, remains stable across rounds/recovery, and changes on successful replay. Pending or failed replay does not erase prior results.
- Full snapshots replace authoritative state. Raw attempts, scored best results and aggregate totals are distinct; never add recovered totals a second time.
- `timeRemaining` is milliseconds and zero is valid. The clock continues during disconnection. In-memory lobbies do not survive a backend restart.

See [runtime recovery](frontend-recovery.md) for ownership and cancellation rules. Cross-repository changes must update backend DTOs, frontend types/handlers and protocol verification together.

## Expedition Journal

`app/plugins/match-journal.client.ts` observes applied completion state and calls `useMatchJournal().recordCompletedGame`. Recording requires the current authenticated player, server game ID, FINISHED phase, complete raw/scored history, finalized answers and consistent totals. Answers come from authoritative `ROUND_RESULT`, member snapshots or `GAME_END`, never inferred guesses or Maps queries. Historical archives exclude the active PLAYING answer and must not appear in public HTTP projections.

The identity-specific, versioned device document stores only that player's match/guess data, not other players' names, credentials or cookies. It is bounded to 30 whole matches and a conservative 2 MiB serialized size. Invalid documents expose no rows and require explicit clearing. Storage failures can retain bounded session-only history with a visible disclosure; failed removal must not claim deletion.

Every public projection is gated by the current authenticated identity, including during logout/switch. Browser storage is read only after mount. A client-app processed-pair guard prevents repeated FINISHED snapshots from restoring a just-cleared entry; it is not a cross-reload/device tombstone. Cross-tab storage removal does not erase another tab's session-only rows. Incomplete histories stay retryable rather than receiving fabricated answers or scores.

A real zero-distance/zero-axis guess remains valid. A no-guess row is distinct from zero points. Omitted `total` means zero only on a valid existing authoritative row; signed bonuses/penalties remain intact. Country Battle is unfinished and excluded from completed journal recording.

## Change placement

Use focused composables for serializable data and explicit client owners for sockets, SDK/DOM handles, observers and timers. Keep transport out of view templates and generated Nuxt files out of source changes. Preserve [native ownership](native-state.md), [layout contracts](layout-controls.md) and [PWA policy](pwa-lifecycle.md). Build success alone does not establish runtime acceptance.
