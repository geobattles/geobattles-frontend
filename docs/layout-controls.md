# Layout and controls

## Shared UI

Night Atlas uses pine ink `#0c1916` for the field and `#162a23` for instruments. Primary actions shade from leaf `#b4e587` to fern `#82c879`; cool jade `#70d9af` marks confirmed state. Gold still identifies leaders and the trophy, while coral signals urgency or danger. Text and symbols carry the meaning without color. Use local artwork, native controls, tabular score digits and short transitions that yield to reduced motion. Keep scenery and map attribution clear during play; reserve the larger artwork for menus and reveals.

Home pairs **Create Lobby** with an inline code field and a **Join Lobby** link. Entering a code or pasting an invite hands off to the existing join page for lookup and authentication. Desktop presents the actions and feature row below the left-aligned hero. Phone portrait stacks the actions below the route illustration, and short landscape places the new-game panel beside the brand. The entrance plays once when Home opens and the buttons are usable throughout.

Controls need visible focus, meaningful accessible names and at least 44px hit targets; primary mobile gameplay actions use at least 52px. Inputs retain 16px text to avoid focus zoom. Reduce density through component spacing/type tokens, not root-font scaling, disabled zoom or text adjustment. Honor reduced motion and reader preferences.

Native dialogs own focus/inert background, Escape, deliberate backdrop closing and focus restoration. They must remain inside the actual fullscreen root. Include native `summary` elements in focus candidates; exclude hidden, inert, disabled and explicitly negative-tabindex controls. Toasts/errors follow the real fullscreen target and remain escaped text.

## Mobile viewport and editing

`useMobileViewport` measures the layout and visual viewports once per frame from an owner mounted at the app root. It exposes focus, scale, orientation, display mode, available height, and the difference from a settled viewport at the same width. Browsers can also report keyboard bounds. Forms combine those signals with their own space requirements. Pinch zoom uses native panning, and focusing an input in a viewport with room keeps the normal layout.

Cinematic scenes use the shared viewport height. An installed or fullscreen app shell uses the settled, unzoomed visual viewport measurement when available. Normal pages scroll in document flow. Native modal dialogs constrain themselves to the visible viewport and keep background scrolling locked until the last modal closes. A form can mark its internal scroll region with `data-viewport-scroll` and related field content with `data-viewport-field`. The focused field stays in the original DOM and its scroll region adjusts after viewport movement settles.

Short landscape Lobby Settings keeps the active field and its controls in view. Map search keeps the search field and scrollable results available. **Done typing** dismisses the keyboard while keeping the draft and settings dialog open. Authentication, lobby lookup, the profile form, and rival search each choose when to make room. The Street View and map layouts keep their own sizing and camera state.

In a development build, append `?viewport=1` and expand **Viewport** to see measured dimensions, system insets, and the focused control type. The panel displays geometry and control types only. Physical verification of installed status bars, floating keyboards, and rotation during keyboard input uses a device.

## Lobby flow

One labelled input displays the four code characters and supports ASCII capitalization, keyboard editing and valid code or same-origin invite paste. Completing a valid code checks the lobby and starts joining automatically. Editing the code cancels an in-progress lookup. Failed joins keep a retry action. Invite links and code entry resume the intended lobby join after authentication.

The sign-in dialog shows one form at a time. Joining or creating a lobby opens guest entry. Explicit sign-in opens account entry. The code page focuses the code input when opening for entry or correction. The auth dialog tracks the visual viewport while open so its controls can be scrolled into view above the software keyboard.

Navigation away from a live lobby opens the leave confirmation. **Stay in lobby**, Escape, or closing the prompt cancels navigation. **Leave lobby** commits the requested route and follows the existing lobby exit rules. During fullscreen play the dialog is inside the game’s fullscreen element.

Lobby entry waits for the connected waiting-room snapshot before lighting **Lobby Found**. **Opening Room** and **Joining Players** are presentation stages of that same admission. The route, tracker and arrival pulse share a two-second clock, with a short finish if confirmation arrives late. Reduced motion reveals the confirmed room immediately. **Cancel** during entry returns directly to the prior join surface. Recovery and admission into a running match follow the existing socket and spectator routes.

In a development build, open `/?lobbyJourney=1` to scrub the entry scene without joining a lobby.

The waiting room uses the room name and a labelled **Leave** button instead of the site navbar. An actionable **Ready?** uses the original Night Atlas amber `#ffca62` to honey `#d69b40`, with dark text, an inset keyboard focus ring and a slow left-to-right fill (static under reduced motion). Replay uses the same treatment only after the winner ceremony closes. A server-confirmed ready state has its own label and a separate **Change** action in the waiting room. The host sees **Start game** only when everyone is ready; server eligibility and connection checks still apply. Portrait puts Ready and Invite ahead of the roster and settings; short landscape places them alongside one another. Keep the region and round values visible; the map, country list and rules are available on demand. Directory rows preserve search, sorting, capacity and phase eligibility.

Keep region selection concise: mode buttons, one selected-region line, the map and a searchable flag list. Avoid repeated instructions, numbered steps and duplicate selection cards. Retain accessible search labels, selection/result announcements and map keyboard guidance even when their visible counterparts are unnecessary. Scoring details belong in Scoring & powerups. Mobile controls use compact padding without shrinking touch targets below 44px.

In both the waiting lobby and replay, the settings field index groups the draft into Lobby, Rounds, Map, and Scoring & powerups. Narrow phones open on four rows summarizing the current draft. Selecting one opens a single editor; All settings returns to that row. Wide screens and short landscape keep a compact index beside one editor. The shared footer stays outside the scrolling section. Keep visited controls mounted while switching chapters or rotating: changing sections is not Save, must not discard a pending time edit, and must not reset map search or camera. Move focus into the chosen chapter rather than summoning a text keyboard; under reduced motion switch without sliding. The lobby name is editable in place; tapping its right-hand pencil focuses the same labeled native input. Settings use a local draft with explicit Save/Cancel. Escape/close/unmount never saves. Live membership/host/readiness updates continue while editing; loss of authority invalidates the editor. Backend broadcasts commit settings and ordinary settings changes preserve Ready values. [Regions](region-settings.md) covers geographic selection and scoring.

Choose a round time with the presets, numeric stepper or range. Valid settings autosave after a short pause. The footer briefly shows the new round time after the server confirms it. Done waits for pending changes to save. The dialog keeps unsaved edits available until they save or the host chooses Discard. An invalid time entry returns to the last valid value when it loses focus. On phones, the settings dialog fills the viewport in both orientations. Rounds, guesses and capacity use bounded native number fields with 44px step buttons; narrow layouts stack the controls to keep the input targets usable.

Recovery uses an inline connection notice for slow, offline and reconnecting states. Terminal panels pair the cause with an action such as New lobby, Try again or Sign in. Delay the initial-admission modal so normal connection startup is not presented as a loss. Suppress only the exact duplicate connection alert, not unrelated action errors. Keep offline guards and the dismissed-dialog reopening control.

## Gameplay layouts

The Emerald Scenic round intro centers the globe for the opening round. Later rounds add up to three players from the confirmed total standings, with the same ranks as the results table. On compact screens a CSS-driven flare rotates over a static ring and the number updates on second boundaries. Portrait places standings below the globe. Short landscape keeps the details beside the globe. Reduced motion shows a static orbit and readable second-by-second changes.

Desktop places branding, round progress and game controls in a slim header, live scores on the right and a larger interactive guess map at the lower left. The map can be expanded or hidden. The score panel has a scrollable roster and an expanded view.

One client-owned viewport query controls compact layout and map modality. The mobile HUD shows the latest confirmed guess distance, the closest confirmed distance, and the player's place by closest distance. Portrait shows those readings below the round header. Landscape places them alongside the round and controls. The narrow, scrollable round roster opens by default in both phone orientations. **Scores** toggles the roster, and an explicit choice carries across rotation and map opening during the round. In the map, Escape collapses an expanded roster before closing the map.

Portrait places the map preview and guess count beside the stacked actions. Landscape floats a tappable minimap and guess count above the lower-left attribution. Once a pin is selected, **Confirm** appears beside the minimap.

Both docks open the same fullscreen map, with focus returning to the dock's map control on close. The portrait panorama ends above the dock. Landscape extends the panorama to the bottom safe area. Street View retains its attribution, pan, zoom, and navigation controls. The map host and panorama stay mounted, and resizing preserves the map camera and tentative pin.

The active round timer floats over Street View or the expanded guessing map. On the portrait map, it sits in the upper-right corner, with the zoom and reset controls lower on the right. Both surfaces use the same mounted timer and server-derived deadline. The overlay clears the score panel and allows taps and drags to pass through. The progress ring shows time remaining in the whole round. The flare and numeral pulse share the same elapsed time. Short rounds bring the urgency cues closer to expiry. Reduced motion keeps the number, ring and color cues. At zero, the client waits for the server's results event.

The lime pin marks the tentative guess. A server confirmation converts it into a smaller player-colored marker and briefly shows confirmation. A rejected guess leaves the pin available for correction or retry. The mobile map closes after a confirmation when guesses remain and more than 15 seconds are left. Live scores highlight the local player and preserve best-distance order, rank changes, and active powerup indicators. The roster scrolls internally in both orientations.

## Results

Between rounds, portrait gives the answer map a compact band above the standings. Landscape puts the map and summary on the left and gives most of the width to the standings. The map caption sits below the interactive surface on compact screens. Expand map opens a viewport-sized dialog in either phone orientation. The same map host moves into the dialog, then returns to the recap with focus and standings scroll preserved on close. The host's flag control opens the **End match early?** confirmation during play and between rounds.

**Total Points** opens after each round with the cumulative standings and the player's cumulative score. **This Round** switches both to the completed round. Scores appear as plain integers, and guess distances display to the nearest metre or kilometre. In the round view, phone rows show indicators for placement, Double Score and the net Duel adjustment. Multiple Duels share one indicator with a count, including when their adjustments cancel out. Tap a row to see the base score, adjustments and who challenged whom. The details open in a sheet in portrait and a dialog in landscape. Wider screens show the breakdown inline. After the final round, **Round N points** opens the same round standings when a modifier applied. Column labels stay visible while the list scrolls, and switching back to a tab restores its scroll position. Powerups and Next Round or the waiting status stay below the mobile standings.

**This Round** only shows players who took part in that round. Earlier points stay in **Total Points** and **Final Standings**, with presence shown as **Away**, **Offline** or **Left lobby**. When a returning player's Journal saves the match, it marks any rounds they missed and keeps the revealed answers for review.

Player and spectator round standings break zero-point ties by closest valid guess. Equal distances share a place, and players who made no guess sort after those who guessed.

Powerups open a bottom sheet in phone portrait and a centered dialog elsewhere. The powerup cards and searchable Rival Picker share one native dialog. A choice stays pending until the server confirms it. Players can recover an uncertain request with the same request ID, and a rival who disconnects becomes unavailable. The host can queue Next Round while others choose. The Powerups bar and dialog both show the server choice countdown. On phones the incoming Duel notice floats above the recap and Powerups dialog so the standings and action buttons keep their space.

The answer uses a dark target marker with a light rim. Each player's closest valid guess and its line to the answer use their leaderboard color. The map fits the visible result markers across the date line and leaves room for the legend and attribution.

The Champion Reveal runs once for a newly completed match with confirmed standings. A shared five-second timeline synchronizes the landscape, globe, trophy and champion name before fading into Expedition Complete. All first-place ties appear together. Solo play celebrates completing the expedition. Players can skip locally, and reduced motion shows the award without cinematic movement. Reloading a completed match shows the standings directly.

Expedition Complete combines the podium, full final standings and live rematch readiness. Landscape places the podium below the champion trophy and gives the compact standings more room on the right. The standings column labels stay visible while the rows scroll, with the rematch actions below. A scored player who leaves keeps their place, and a newcomer can ready up without receiving a rank. The Journey Map uses the same map host to show finalized round locations and lets players review individual answers. It opens in a dialog on compact screens, falls back to the final answer when the archive is incomplete and uses scenic artwork when a map cannot be shown.

Maps retain authoritative result bounds and refit after a visible layout change; gameplay pan/zoom has different ownership. See [runtime recovery](frontend-recovery.md#maps-only-recovery).

## Spectating

An in-progress room offers **Watch** in Open Lobbies. Invitation links also
admit late arrivals as spectators. The spectator dashboard follows the same
lobby connection and shows the server's round timer, settled standings and
completed-round maps. The live panel uses local scenic artwork. Completed
rounds use the bundled Natural Earth world map and require no Google Maps
requests. The player and watcher counts use the server snapshot.

Mobile portrait stacks the match panel and the scrollable standings. Landscape
and desktop show them side by side. The match progress and rematch status stay
in view. When a seat opens, the spectator gets the existing final standings and
**Ready for Rematch** controls on the same connection. A full room keeps them
watching until a seat opens.

Verify narrow portrait, short landscape, coarse-pointer tablet, desktop and desktop→mobile→desktop transitions, including keyboard/focus/fullscreen and all player rows. Provider-free component previews prove DOM geometry only, not real Maps rendering, attribution placement, camera fitting or physical-device safe areas.
