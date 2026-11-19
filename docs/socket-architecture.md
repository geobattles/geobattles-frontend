# Frontend socket architecture

The client uses one authenticated native WebSocket for the current lobby. It keeps the same connection when switching between that lobby's waiting room and gameplay. The Go backend is authoritative for membership, readiness, phase, rounds, deadlines and scores.

```text
Membership  Committed route + identity → Lobby session → Connection owner
Commands    Lobby / game UI → Typed actions → Connection owner → Go backend
Events      Go backend → Connection owner → Protocol decoder → Game event handlers
View        Game event handlers → Nuxt state → Lobby / game UI
Effects     Game event handlers → Phase routing and Maps/UI (after state applies)
```

The backend's events return over the same socket. The UI reads connection status but cannot send raw frames. Game handlers do not wait for Maps before admitting a player or applying the next event.

## Ownership

| Module                                                                                                            | Owns                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`game-runtime.client.ts`](../app/plugins/game-runtime.client.ts)                                                 | Composes one set of client owners per Nuxt app and wires effects and teardown. Construction does not open a socket or load Maps.                                       |
| [`lobbySession.ts`](../app/runtime/lobbySession.ts)                                                               | Join intent, committed route and membership, phase navigation, deliberate leave/switch and authentication invalidation.                                                |
| [`socket.ts`](../app/runtime/socket.ts)                                                                           | The browser socket, one active attempt, shared readiness, retry/heartbeat deadlines, ordered delivery and sequence fencing.                                            |
| [`socketProtocol.ts`](../app/runtime/socketProtocol.ts) and [`socketTypes.ts`](../app/types/socketTypes.ts)       | Frame classification, wire types and critical message-shape validation. Unknown event types remain compatible; handlers validate game transitions and nested archives. |
| [`socketActions.ts`](../app/runtime/socketActions.ts) and [`requestState.ts`](../app/composables/requestState.ts) | Typed player actions and command-specific pending state, error handling and Ready acknowledgement timeout. A successful send is not an acknowledgement.                |
| [`socketHandlers.ts`](../app/composables/socketHandlers.ts)                                                       | Applies lobby snapshots and round events, settles matching commands, and requests client effects after state is applied.                                               |
| [`roundClock.ts`](../app/runtime/roundClock.ts)                                                                   | Owns the server-derived deadline and keeps its ceiling distinct from the visible countdown.                                                                            |

## Lifecycle and recovery

1. A committed route enters a session and starts admission. Auth preparation, retries and offline time share one absolute 30-second client window. The backend membership grace window is separate.
2. A complete own-player `JOINED_LOBBY` snapshot must be applied before the connection becomes ready. On recovery the matching immediately following `REJOIN_ROUND` is not applied twice.
3. Frames apply in order for the current attempt. A supplied `seq` must increase; gaps are expected and the fence resets on a new socket. Legacy frames may omit it. Do not treat the sequence as a replay log.
4. A network drop discards the attempt, not the committed route. An admitted socket starts normal retry backoff without waiting for an HTTP lobby-list check. Reconnect restores the server's state; it does not resend Ready, Start or Guess. A late snapshot cannot extend a known deadline. With a server match ID, the ceiling survives terminal expiry and deliberate Retry for the same player, lobby, match and round. Legacy servers without the ID can only preserve the ceiling while the preceding round is still known; a replay may otherwise be indistinguishable. A phase redirect never starts another admission attempt.
5. Committed leave/switch and deliberate logout can send `disconnect` before closing. Cancelled navigation, browser refresh and network loss are not leave. A sent frame is not proof that the server removed the player.

## Where to add a change

- **Player action:** add its wire shape in `socketTypes.ts` and a named method in `socketActions.ts`. Keep gameplay/UI policy out of `socket.ts`. If the action changes authoritative state, settle it from the server's response or an explicit lifecycle reset rather than from `send()`.
- **Server event:** add its payload type, validate the wire shape in `socketProtocol.ts`, and handle it in `socketHandlers.ts`. Keep lobby/phase/match identity checks next to state application. Document compatibility if a field can be absent on older servers.
- **Navigation or rendering:** call the current owner through the client runtime. Keep side effects generation-scoped; a Maps-only retry must not reconnect the socket, send Start or reset the round clock.

Routes, credentials, the optional `/api` prefix and the backend protocol are unchanged. Use [runtime recovery](frontend-recovery.md) for detailed recovery rules and the [testing guide](testing.md) for runtime acceptance.
