# Layout and controls

## Shared UI

Keep the charcoal `#181818` / `#242424`, sage `#b6e388` and forest `#5f8d4e` theme. Home is a short Welcome/GeoBattles/Play/code-join surface over the existing wallpaper, without a decorative 3D globe or marketing dashboard. Use local fonts, native HTML controls and small local SVG icons.

Controls need visible focus, meaningful accessible names and at least 44px hit targets; primary mobile gameplay actions use at least 52px. Inputs retain 16px text to avoid focus zoom. Reduce density through component spacing/type tokens, not root-font scaling, disabled zoom or text adjustment. Honor reduced motion and reader preferences.

Native dialogs own focus/inert background, Escape, deliberate backdrop closing and focus restoration. They must remain inside the actual fullscreen root. Include native `summary` elements in focus candidates; exclude hidden, inert, disabled and explicitly negative-tabindex controls. Toasts/errors follow the real fullscreen target and remain escaped text.

## Lobby flow

Four labelled code boxes support ASCII capitalization, keyboard editing and valid code/same-origin-invite paste. Do not repair malformed Unicode/lookalike codes. Completing a valid code submits once; prevent concurrent submissions and keep an explicit retry after failure.

The waiting room puts readiness/actions and people first on portrait screens, followed by a visible game-plan map and essential settings. Included countries and advanced rules use disclosures. Wide landscape separates the settings inspector from roster/actions. Directory rows preserve search, sorting, capacity and phase eligibility rather than hiding metadata to fit.

Keep region selection concise: mode buttons, one selected-region line, the map and a searchable flag list. Avoid repeated instructions, numbered steps and duplicate selection cards. Retain accessible search labels, selection/result announcements and map keyboard guidance even when their visible counterparts are unnecessary. The waiting-room overview shows region, map and essential values; scoring details belong in Advanced rules. Mobile controls use compact padding without shrinking touch targets below 44px.

Settings use a local draft with explicit Save/Cancel. Escape/close/unmount never saves. Live membership/host/readiness updates continue while editing; loss of authority invalidates the editor. Backend broadcasts commit settings and ordinary settings changes preserve Ready values. [Regions](region-settings.md) covers geographic selection and Advanced scoring.

Round time is locked until Edit is selected. Presets, a numeric stepper and a range edit a separate time draft; Save time confirms it into the settings draft, while Cancel or Escape discards it and restores focus. The outer Save settings stays blocked until that time edit is saved or cancelled. Rounds, guesses and capacity use bounded native number fields with 44px step buttons; narrow layouts stack the controls rather than squeezing their input targets.

Recovery uses one short cause-specific sentence and two main choices: New lobby/Home for confirmed absence, Retry/Home after expiry, Keep waiting/Home during recovery. Delay the initial-admission modal so normal connection startup is not presented as a loss. Suppress only the exact duplicate connection alert, not unrelated action errors. Keep offline guards and the dismissed-dialog reopening control.

## Gameplay layouts

Desktop retains a grouped top-left round/exit/timer/fullscreen HUD, full right-side scores including distance, and a visible nonmodal lower-left minimap with labelled submit and fine-pointer enlargement.

A single client-owned responsive query coordinates compact styling, score columns, map defaults and modal semantics. Mobile has round/exit top-left, a centered timer, fullscreen top-right, distance-led scores and aligned safe-area-aware Map/submit actions. Omit the cramped mobile connection badge; retain recovery feedback. Orientation/breakpoint changes must not leave desktop controls trapped in mobile modal behavior.

Opening the mobile map fills the actual gameplay viewport. Move the same map host, live scoreboard and timer into its dialog focus scope rather than leaving them inert underneath or duplicating their state. Closing restores them without changing the round deadline or recreating SDK objects. Keep Close, guesses remaining, submit and provider attribution unobscured.

Portrait scores have a player-count-independent height cap, focusable scrolling for every row and a 44px Hide/Show header. Preserve the collapsed preference through orientation changes. Landscape/desktop retain their separate full table behavior.

## Results

Wide mobile landscape can show map and results together; narrow layouts switch between them. Keep Next round and replay readiness outside scrolling details. Compact personal debriefs use native disclosure, while final standings, debrief and roster share a focusable scrolling region so lower rows stay reachable. First-place ties receive equal treatment.

Maps retain authoritative result bounds and refit after a visible layout change; gameplay pan/zoom has different ownership. See [runtime recovery](frontend-recovery.md#maps-only-recovery).

Verify narrow portrait, short landscape, coarse-pointer tablet, desktop and desktop→mobile→desktop transitions, including keyboard/focus/fullscreen and all player rows. Provider-free component previews prove DOM geometry only, not real Maps rendering, attribution placement, camera fitting or physical-device safe areas.
