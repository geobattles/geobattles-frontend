import { test, expect, type Browser, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Actor } from "../support/fixtures";
import { changeSettings, createLobby, joinInvite, openSettingsSection, ownServerScore, registerGuest, setReady } from "../support/ui";
import { startNetworkGuard } from "../support/network-guard.mjs";
import { settings } from "../support/safety.mjs";
import type { Envelope } from "../support/types";

const env = settings(true);
const roomName = "Alpine Atlas";
const receivedAt = new WeakMap<Envelope, number>();

async function player(browser: Browser, proxy: string, name: string, index: number, failures: string[]) {
    const context = await browser.newContext({
        baseURL: env.frontend,
        proxy: { server: proxy, bypass: "<-loopback>" },
        viewport: { width: 1440, height: 960 },
        serviceWorkers: "block",
        reducedMotion: "reduce",
        locale: "en-US",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    page.setDefaultNavigationTimeout(20_000);
    const actor = new Actor(context, page, name, index);
    page.on("pageerror", (error) => failures.push(error.name));
    page.on("request", (request) => {
        if (request.method() === "GET" && request.url() === env.backend + "/lobby") failures.push("unexpected legacy list read");
    });
    page.on("websocket", (socket) => {
        if (new URL(socket.url()).pathname !== "/lobbySocket") return;
        const generation = ++actor.generation;
        socket.on("framereceived", ({ payload }) => {
            const event: Envelope = JSON.parse(String(payload));
            if (!event.type) return;
            event.generation = generation;
            receivedAt.set(event, Date.now());
            actor.events.push(event);
        });
    });
    return actor;
}

async function capture(page: Page, name: string) {
    const dir = process.env.GEOBATTLES_MATCH_ARTIFACTS;
    if (!dir) return;
    await mkdir(dir, { recursive: true });
    await page.screenshot({ path: join(dir, name + ".png"), animations: "disabled" });
}

async function configure(host: Actor) {
    await changeSettings(host, { name: roomName, rounds: 2, attempts: 1, seconds: 90 });
    await host.page.getByRole("button", { name: /^(modify|edit settings|settings)$/i }).click();
    const dialog = host.page.getByRole("dialog", { name: "Lobby settings", exact: true });
    await openSettingsSection(dialog, "Scoring & powerups");
    for (const label of ["Automatic scoring", "Placement bonus", "Double score", "Duel"]) {
        const input = dialog.getByRole("checkbox", { name: new RegExp("^" + label, "i") });
        if (await input.isChecked()) await input.press("Space");
        await expect(input).not.toBeChecked();
    }
    await expect(dialog.getByRole("slider", { name: /score factor/i })).toHaveValue("100");
    await dialog.getByRole("button", { name: /^close dialog$/i }).click();
    await host.snapshot((s) => s.conf.scoringMode === "manual" && s.conf.dynLives === false && s.conf.placeBonus === false && JSON.stringify(s.conf.powerups) === "[false,false]");
}

async function guess(actor: Actor, lat: number, lng: number) {
    const gameplay = actor.page.locator("#gameplay_container");
    await expect(gameplay).toBeVisible();
    await expect(gameplay).not.toHaveAttribute("inert", "");
    await expect(actor.page.getByTestId("maps-ready")).toBeAttached();
    const map = actor.page.getByTestId("guess-map");
    const launcher = actor.page.getByRole("button", { name: /^(open map|place guess)$/i }).first();
    if (await launcher.isVisible()) await launcher.click();
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute("data-fixture-atlas", "true");
    const box = (await map.boundingBox())!;
    await map.click({ position: { x: box.width * ((lng + 180) / 360), y: box.height * ((90 - lat) / 180) } });
    const submit = actor.page.getByRole("button", { name: "Confirm Guess", exact: true });
    await expect(submit).toBeEnabled();
    const mark = actor.mark();
    await submit.click();
    await actor.event("NEW_RESULT", (event) => event.payload?.user === actor.id, mark);
}

test("two guests finish a scored match and recover a retained seat in round two", async ({ browser }) => {
    const build = process.env.GEOBATTLES_MATCH_BUILD_ID;
    expect(build).toMatch(/^matchfixture-[0-9a-f-]{36}$/);
    expect(env.maps).toBe(false);
    const version = await fetch(env.backend + "/version", { redirect: "error" });
    expect(await version.json()).toEqual({ version: build });
    const failures: string[] = [];
    const guard = await startNetworkGuard({ frontend: env.frontend, backend: env.backendOrigin });
    const actors: Actor[] = [];
    try {
        const host = await player(browser, guard.server, "Atlas", 0, failures);
        actors.push(host);
        const guest = await player(browser, guard.server, "Nova", 1, failures);
        actors.push(guest);
        await test.step("Register two independent guests", () => Promise.all(actors.map(registerGuest)));
        const code = await test.step("Create the lobby", () => createLobby(host));
        await test.step("Configure two one-guess rounds", () => configure(host));
        const missing = code === "ZZZZ" ? "YYYY" : "ZZZZ";
        await guest.goto("/lobby/join?id=" + missing);
        await expect(guest.page.getByRole("alert").filter({ hasText: "Lobby not found." })).toBeVisible();
        await guest.goto("/lobby/list");
        await expect(guest.page.getByRole("button", { name: "Join " + roomName })).toBeEnabled();
        const publicRow = await fetch(env.backend + "/lobby/directory/" + code).then((response) => response.json());
        expect(Object.keys(publicRow).sort()).toEqual(["ID", "name", "hostName", "phase", "currentRound", "numRounds", "connected", "occupied", "maxPlayers", "openToNew"].sort());
        const directory = await fetch(env.backend + "/lobby/directory").then((response) => response.json());
        expect(directory[code]).toEqual(publicRow);
        // A temporary HTTP lookup failure must still allow the real socket to decide admission.
        await guest.page.route(env.backend + "/lobby/directory/" + code, (route) => route.abort("timedout"), { times: 1 });
        await joinInvite(guest, code);
        const guestId = guest.id;
        expect(guestId).not.toBe(host.id);
        await setReady(host, true);
        await setReady(guest, true);
        await host.page.getByRole("button", { name: "Start game", exact: true }).click();
        const start = await host.event("START_ROUND", (e) => e.payload?.round === 1);
        const gameId = start.payload!.gameId;
        expect(gameId).toMatch(/^[0-9a-f-]{36}$/);
        await guest.event("START_ROUND", (e) => e.payload?.round === 1 && e.payload.gameId === gameId);
        await test.step("Round one: perfect host guess and distant guest guess", async () => {
            await guess(host, 46, 15);
            await guess(guest, -46, -165);
        });
        for (const actor of actors) {
            const round = (await actor.event("ROUND_RESULT")).payload!;
            expect(round.phase).toBe("MID-ROUND");
            expect(ownServerScore(round.roundRes?.[host.id])).toBe(5000);
            expect(ownServerScore(round.roundRes?.[guestId])).toBe(0);
            await expect(actor.page.getByRole("heading", { name: "Round 1 Results" })).toBeVisible();
        }
        await capture(host.page, "round-one");
        await host.page.getByRole("button", { name: "Next Round", exact: true }).click();
        const second = await guest.event("START_ROUND", (e) => e.payload?.round === 2 && e.payload.gameId === gameId);
        // The live HUD appears after the countdown, so a reset to the full duration is observable.
        await expect(guest.page.locator("#gameplay_container:not([inert]) .round-label")).toBeVisible();
        const mark = host.mark();
        const beforeLoss = guest.mark();
        // A hard navigation closes the real socket. The returning tab keeps its guest credentials.
        await guest.goto("/");
        await host.snapshot((s) => s.phase === "PLAYING" && s.playerList[guestId]?.connected === false, mark);
        await expect(guest.page.getByRole("link", { name: "Return to lobby · " + code })).toBeVisible();
        await capture(guest.page, "return-home");
        const listed = guest.page.waitForResponse((r) => r.url() === env.backend + "/lobby/directory" && r.request().method() === "GET" && !!r.request().headers().authorization);
        await guest.goto("/lobby/list");
        await expect(guest.page.getByRole("button", { name: "Return " + roomName })).toBeEnabled();
        await expect(guest.page.getByText("· 1 reserved", { exact: true })).toBeVisible();
        const response = await listed;
        expect(response.headers()["cache-control"]).toBe("private, no-store");
        expect(response.headers().vary).toContain("Authorization");
        expect((await response.json())[code]).toMatchObject({ retained: true, openToNew: false, connected: 1, occupied: 2 });
        await capture(guest.page, "return-directory");
        await guest.goto("/");
        await guest.page.getByRole("link", { name: "Return to lobby · " + code }).click();
        const recovery = await guest.event("REJOIN_ROUND", (e) => e.payload?.round === 2 && e.payload.gameId === gameId, beforeLoss);
        expect(recovery.generation).toBeGreaterThan(second.generation);
        const state = recovery.payload!.lobby!;
        expect(state).toMatchObject({ gameId, phase: "PLAYING", currentRound: 2, playerList: { [guestId]: { connected: true, lives: 1 } } });
        expect(ownServerScore(state.totalResults[host.id])).toBe(5000);
        expect(ownServerScore(state.totalResults[guestId])).toBe(0);
        const deadline = (e: Envelope) => receivedAt.get(e)! + e.payload!.timeRemaining!;
        expect(Math.abs(deadline(recovery) - deadline(second))).toBeLessThan(1500);
        await guess(host, 52, 5);
        await guess(guest, 52, 5);
        for (const actor of actors) {
            const end = (await actor.event("GAME_END")).payload!;
            expect(end).toMatchObject({ gameId, phase: "FINISHED", round: 2 });
            expect(ownServerScore(end.totalResults?.[host.id])).toBe(10000);
            expect(ownServerScore(end.totalResults?.[guestId])).toBe(5000);
            const podium = actor.page.getByRole("list", { name: "Podium", exact: true });
            await expect(podium).toHaveClass(/podium-revealed/);
            await expect(actor.page.locator("dialog.champion-reveal[open]")).toHaveCount(0);
            await expect(podium).toBeVisible();
            const first = podium.locator('[data-rank="1"]'),
                secondPlace = podium.locator('[data-rank="2"]');
            await expect(first).toContainText("Atlas");
            await expect(first).toContainText("10,000 pts");
            await expect(secondPlace).toContainText("Nova");
            await expect(secondPlace).toContainText("5,000 pts");
        }
        await capture(host.page, "final-standings");
        await test.step("A saved code for a live room without this seat is cleared", async () => {
            await host.goto("/");
            const otherRoom = await createLobby(host);
            // Recreate a persisted hint from an older session whose four-character code is in use again.
            await guest.page.evaluate((hint) => localStorage.setItem("geobattles:return-lobby", JSON.stringify(hint)), { id: otherRoom, playerId: guestId });
            const admissionURL = env.backend + "/lobby/admission?id=" + otherRoom;
            await guest.page.route(admissionURL, (route) => route.abort("timedout"), { times: 1 });
            const failure = guest.page.waitForEvent("requestfailed", (request) => request.url() === admissionURL);
            await guest.goto("/");
            await failure;
            expect(await guest.page.evaluate(() => JSON.parse(localStorage.getItem("geobattles:return-lobby") ?? "null"))).toEqual({ id: otherRoom, playerId: guestId });
            const checked = guest.page.waitForResponse((r) => r.url() === admissionURL && r.request().method() === "GET");
            await guest.goto("/");
            expect(await (await checked).json()).toEqual({ code: "OK" });
            await expect.poll(() => guest.page.evaluate(() => localStorage.getItem("geobattles:return-lobby"))).toBeNull();
            await expect(guest.page.getByRole("link", { name: /Return to lobby/ })).toHaveCount(0);
        });
        expect(failures).toEqual([]);
        expect(guard.counts.deniedDestination).toBe(0);
        expect(guard.counts.connectGoogle).toBe(0);
        expect((await fetch(env.backend + "/readyz")).ok).toBe(true);
        console.log("Atlas 10,000 · Nova 5,000 · seat and deadline recovered · external Maps requests 0");
    } finally {
        await Promise.all(actors.map((actor) => actor.context.close()));
        await guard.close();
    }
});
