# Native state and resource ownership

Use keyed Nuxt `useState` for serializable request-scoped data and ordinary Vue refs/computed values for local presentation. Existing `use*Store` functions are compatibility facades, not Pinia stores or a custom state engine. Do not put tokens, promises, sockets, SDK objects or DOM handles into serialized state or module-global mutable caches.

## Ownership map

| Owner                                                       | Data and lifetime                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `composables/auth.ts`, `runtime/auth.ts`                    | Per-app/request auth revision and coordination; tokens remain in scoped cookies/request arguments |
| `lobbyState.ts`, `lobby.ts`, mode/result/player composables | Serializable membership, settings, phase and score data; setup-captured actions                   |
| `socketState.ts`, `requestState.ts`                         | Connection presentation and command-scoped pending/errors, not transport objects                  |
| `runtime/socket.ts`                                         | One socket, ordered dispatch, admission/retry/heartbeat/ACK deadlines and cleanup                 |
| `runtime/google.ts`                                         | Lazy SDK loading, map/panorama, host refs, initialization waits and resource diagnostics          |
| `runtime/battleRoyale.ts`                                   | Markers, lines, frame/round permissions and overlay cleanup                                       |
| `runtime/ui.ts`                                             | Map-host movement, layout observation, fullscreen bindings and DOM listeners                      |
| Components and client plugins                               | Their own watchers, timers, audio, event subscriptions and unmount/HMR disposal                   |

The game-runtime client plugin constructs an idle owner once per Nuxt app. Construction is not permission to open a socket or load Maps. Capture composable dependencies synchronously during setup; asynchronous/event callbacks use those captured refs/actions instead of creating composables outside Nuxt context. Keep calculations independent of eager mode/runtime construction to avoid dependency cycles.

## SSR boundary

`<ClientOnly>` excludes child rendering, not the containing page's script setup. SSR pages must use data-only accessors such as `useSocketState`; immediate client-runtime access belongs in a `.client.vue` component. `Gameplay/Session.client.vue` owns runtime-backed gameplay composition while the route page retains its SSR shell, title, leave guard and fullscreen container.

The universal auth plugin provides a separate owner for each Nuxt app/SSR request. Never share authenticated mutable state across requests. Private `NUXT_BACKEND_SERVER_HOST` is the server's absolute auth origin; browser requests use public configuration. Keep initial identity-dependent markup hydration-safe without delaying privacy gates.

## Cleanup and asynchronous work

Every asynchronous continuation must still own its request/session, resource generation, component lifetime and authoritative phase before publishing results. Cleanup revokes permission before advancing generations. A retained phase, connected DOM node or resolved SDK import alone cannot authorize new resources.

`mapView` permits a map in active or result phases; `activeRound` permits a panorama only for active play. Applied authoritative START/snapshots/results grant them. Cleanup does not. Socket state application and admission must not wait on SDK rendering.

Keep the same map/panorama objects through layout changes; move the existing host between mounted phase slots. Reject self/ancestor insertions and wait for connected nonzero layout before framing. Terminal session cleanup detaches session resources; successful page replacement also disposes page-owned bindings. Failed/cancelled navigation must preserve the still-owned session.

Unmount/HMR must stop owned watchers/listeners and invalidate late work. Removing a script cannot cancel JavaScript already in flight, and Google's loaded global SDK is not unloadable. See [runtime recovery](frontend-recovery.md) and [region camera behavior](region-settings.md#gameplay-starting-camera).
