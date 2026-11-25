import type { Locator } from "@playwright/test";
import { expect } from "./fixtures";
import type { Actor } from "./fixtures";
import { settings } from "./safety.mjs";

const env = settings(true);

export function ownServerScore(row: unknown): number {
    if (row === null || typeof row !== "object" || Array.isArray(row)) throw new Error("Authoritative own-player result row is missing or invalid");
    const total = (row as { total?: unknown }).total;
    if (total !== undefined && (typeof total !== "number" || !Number.isFinite(total))) throw new Error("Authoritative own-player score must be a finite number");
    // Go Result.total omits zero, but only an existing own-player row may imply it.
    return total ?? 0;
}

// Match the journal's public number/unit format, never derive an expected score from UI/storage.
export const journalScoreText = (score: number) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(score)} pts`;

export async function registerGuest(actor: Actor) {
    const { page } = actor;
    await actor.goto("/");
    await page.getByRole("button", { name: /^(login|sign in)$/i }).click();
    await page
        .getByRole("dialog")
        .getByRole("button", { name: /^play as guest$/i })
        .click();
    await page.getByRole("textbox", { name: /^(guest )?display name$/i }).fill(actor.name);
    const registered = page.waitForResponse((response) => response.url() === `${env.backend}/auth/register/guest` && response.request().method() === "POST");
    await page.getByRole("button", { name: /^continue as guest$/i }).click();
    expect((await registered).status(), "Guest registration must reach the real local backend").toBe(201);
    await expect(page.getByRole("dialog")).toHaveCount(0);
}

export async function createLobby(actor: Actor): Promise<string> {
    const mark = actor.mark();
    await actor.page.getByRole("button", { name: /^(start an expedition|play now|create lobby)$/i }).click();
    const lobby = await actor.snapshot((snapshot) => snapshot.phase === "WAITING" && Object.values(snapshot.playerList).some((player) => player.name === actor.name), mark);
    expect(lobby.ID).toMatch(/^[A-Z0-9]{4}$/);
    await expect(actor.page).toHaveURL(`${env.frontend}/lobby/${lobby.ID}`);
    await expect(actor.page.getByTestId("lobby-code")).toHaveText(lobby.ID);
    await connected(actor);
    return lobby.ID;
}

export async function joinInvite(actor: Actor, lobbyId: string) {
    const mark = actor.mark();
    await actor.goto(`/lobby/join?id=${encodeURIComponent(lobbyId)}`);
    await actor.snapshot((snapshot) => snapshot.ID === lobbyId && Object.values(snapshot.playerList).some((player) => player.name === actor.name && player.connected), mark);
    await expect(actor.page).toHaveURL(`${env.frontend}/lobby/${lobbyId}`);
    await connected(actor);
}

export async function connected(actor: Actor) {
    const connectionStatus = actor.page.getByTestId("connection-status");
    await expect(connectionStatus).toHaveText(/^connected$/i);
    expect(actor.latest?.playerList[actor.id]?.connected).toBe(true);
    if (actor.latest?.phase === "WAITING") {
        await expect(connectionStatus).toBeVisible();
        await expect(actor.row()).toHaveAttribute("data-connected", "true");
    }
}

export function readyButton(actor: Actor) {
    return actor.page.getByRole("button", { name: /^(ready\?|ready to play|not ready|change ready status|ready for rematch|cancel rematch readiness)$/i });
}

export async function setReady(actor: Actor, value: boolean) {
    const button = readyButton(actor);
    const unready = /^(ready\?|ready to play|ready for rematch)$/i;
    const ready = /^(not ready|change ready status|cancel rematch readiness)$/i;
    const initialName = value ? unready : ready;
    const updatedName = value ? ready : unready;
    await expect(button).toHaveAccessibleName(initialName);
    const mark = actor.mark();
    await button.click();
    await actor.snapshot((snapshot) => snapshot.playerList[actor.id]?.ready === value, mark);
    await expect(button).toHaveAccessibleName(updatedName);
    if (actor.latest?.phase === "WAITING") await expect(actor.row()).toHaveAttribute("data-ready", String(value));
}

export async function openSettingsSection(dialog: Locator, name: "Lobby" | "Rounds" | "Map" | "Scoring & powerups") {
    await expect(dialog).toBeVisible();
    // A resize can report the previous drill-in state until the next rendering
    // update. Settle it before deciding whether Back is part of this path.
    await dialog.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const back = dialog.getByRole("button", { name: "All settings", exact: true });
    if (await back.isVisible()) await back.click();
    const nav = dialog.getByRole("navigation", { name: "Settings sections", exact: true });
    await nav.getByRole("button", { name, exact: true }).click();
}

export async function changeSettings(actor: Actor, values: { name: string; rounds?: number; attempts?: number; seconds?: number; country?: string }) {
    const mark = actor.mark();
    await actor.page.getByRole("button", { name: /^(modify|edit settings|settings)$/i }).click();
    const dialog = actor.page.getByRole("dialog", { name: /^lobby settings$/i });
    await openSettingsSection(dialog, "Lobby");
    await dialog.getByRole("textbox", { name: /^lobby name$/i }).fill(values.name);
    // Paid QA uses a source-verified supported country, not a guaranteed provider
    // result. Keyless callers leave the normal all-country selection untouched.
    const country = values.country ?? (env.maps ? "NL" : undefined);
    if (country !== undefined) {
        await openSettingsSection(dialog, "Map");
        expect(country).toMatch(/^[A-Z]{2}$/);
        await dialog
            .getByRole("group", { name: /^region type$/i })
            .getByRole("button", { name: /^country$/i })
            .click();
        const search = dialog.getByRole("searchbox", { name: /^choose a country$/i });
        await expect(search).toBeVisible();
        await search.fill(country);
        const choice = dialog.getByRole("radiogroup", { name: /^country search results$/i }).getByRole("radio", { name: new RegExp(` ${country}$`) });
        await expect(choice, "The actual country list must support this QA selection; never fall back to new provider attempts").toHaveCount(1);
        await choice.click();
        await expect(choice).toBeChecked();
    }
    if (values.rounds !== undefined || values.attempts !== undefined || values.seconds !== undefined) await openSettingsSection(dialog, "Rounds");
    if (values.rounds !== undefined) await dialog.getByRole("spinbutton", { name: /^rounds$/i }).fill(String(values.rounds));
    if (values.attempts !== undefined) await dialog.getByRole("spinbutton", { name: /^(guesses per round|attempts)$/i }).fill(String(values.attempts));
    if (values.seconds !== undefined) {
        const timer = dialog.locator(".timer-setting");
        await timer.getByRole("spinbutton", { name: /^time in seconds$/i }).fill(String(values.seconds));
        await expect(timer.getByRole("slider", { name: /^round timer adjustment$/i })).toHaveValue(String(values.seconds));
    }
    await dialog.getByRole("button", { name: /^close dialog$/i }).click();
    const snapshot = await actor.snapshot(
        (lobby) =>
            lobby.conf.name === values.name &&
            (values.rounds === undefined || lobby.conf.numRounds === values.rounds) &&
            (values.attempts === undefined || lobby.conf.numAttempt === values.attempts) &&
            (values.seconds === undefined || lobby.conf.roundTime === values.seconds) &&
            (country === undefined || JSON.stringify(lobby.conf.ccList) === JSON.stringify([country])),
        mark
    );
    if (values.rounds !== undefined) expect(snapshot.conf.numRounds).toBe(values.rounds);
    if (values.attempts !== undefined) expect(snapshot.conf.numAttempt).toBe(values.attempts);
    if (values.seconds !== undefined) expect(snapshot.conf.roundTime).toBe(values.seconds);
    if (country !== undefined) expect(snapshot.conf.ccList).toEqual([country]);
    await expect(dialog).toHaveCount(0);
    await expect(actor.page.getByTestId("lobby-name")).toHaveText(values.name);
}

export async function leave(actor: Actor) {
    actor.navigating = true;
    try {
        await actor.page.getByRole("button", { name: /^(leave|leave lobby)$/i }).click();
        const confirmation = actor.page.getByRole("dialog", { name: "Leave lobby?", exact: true }).getByRole("button", { name: "Leave lobby", exact: true });
        await expect
            .poll(async () => new URL(actor.page.url()).pathname === "/" || (await confirmation.isVisible()), { message: "Leave must navigate or show a real confirmation" })
            .toBe(true);
        if (await confirmation.isVisible()) await confirmation.click();
        await expect(actor.page).toHaveURL(`${env.frontend}/`);
    } finally {
        actor.navigating = false;
    }
}

export async function publicLobby(lobbyId: string) {
    // No auth headers, provider calls, response dumps or redirect following.
    const response = await fetch(`${env.backend}/lobby`, { redirect: "error", signal: AbortSignal.timeout(8_000) });
    expect(response.status).toBe(200);
    const lobbies = await response.json();
    return lobbies[lobbyId] as import("./types").Snapshot | undefined;
}

export async function reservedAfterLeave(lobbyId: string) {
    await expect
        .poll(
            async () => {
                const lobby = await publicLobby(lobbyId);
                const players = Object.values(lobby?.playerList ?? {});
                return lobby?.admin === "" && players.length > 0 && players.every((player) => !player.connected && player.away);
            },
            { message: "The lobby keeps seats after the final player leaves" }
        )
        .toBe(true);
}

// Read-only handles: never serialize the Nuxt payload/config or change Google APIs.
// Retaining native object references also detects a healthy actor's SDK recreation.
export async function nativeMaps(actor: Actor) {
    return actor.page.evaluateHandle(() => {
        type GoogleViews = {
            isMapInitialized: boolean;
            isPanoramaInitialized: boolean;
            getMap: { getDiv(): HTMLElement; getBounds(): { contains(point: { lat: number; lng: number }): boolean } | undefined };
            getPanorama: { getStatus(): string | undefined };
        };
        const root = document.getElementById("__nuxt") as
            | (HTMLElement & {
                  __vue_app__?: { config: { globalProperties: { $nuxt?: { $gameRuntime?: { google?: GoogleViews } } } } };
              })
            | null;
        const google = root?.__vue_app__?.config.globalProperties.$nuxt?.$gameRuntime?.google;
        if (!google) throw new Error("The mounted client must expose its actual Google runtime");
        return {
            map: google.isMapInitialized ? google.getMap : null,
            panorama: google.isPanoramaInitialized ? google.getPanorama : null,
            document,
        };
    });
}

export async function mapsReady(actor: Actor) {
    await expect(actor.page.getByTestId("maps-ready")).toBeVisible({ timeout: 30_000 });
    const views = await nativeMaps(actor);
    try {
        await expect
            .poll(() => views.evaluate(({ map, panorama }) => !!map && panorama?.getStatus() === "OK"), {
                message: "A constructed map is insufficient: the actual StreetViewPanorama must report OK",
                timeout: 30_000,
            })
            .toBe(true);
        await expect(actor.page.getByTestId("street-view").locator(".gm-style").first()).toBeVisible();
    } finally {
        await views.dispose();
    }
}

export async function guess(actor: Actor) {
    await mapsReady(actor); // Includes all rounds of the existing three-player case.
    const mark = actor.mark();
    const showMap = actor.page.getByRole("button", { name: /^(Open map|Place Guess)$/ }).first();
    if (await showMap.isVisible()) await showMap.click();
    const map = actor.page.getByTestId("guess-map");
    await expect(map).toBeVisible();
    await expect(map.locator(".gm-style").first()).toBeVisible();
    const box = await map.boundingBox();
    if (!box) throw new Error("Actual Google guess map has no visible hit target");
    await map.click({ position: { x: Math.floor(box.width * 0.45), y: Math.floor(box.height * 0.55) } });
    const button = actor.page.getByRole("button", { name: "Confirm Guess", exact: true });
    await expect(button).toBeEnabled();
    await button.click();
    await actor.event("NEW_RESULT", (event) => event.payload?.user === actor.id, mark);
}
