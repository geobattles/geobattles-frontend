import { test, expect } from "./support/fixtures";
import type { Actor } from "./support/fixtures";
import {
    registerGuest,
    createLobby,
    joinInvite,
    setReady,
    changeSettings,
    connected,
    guess,
    leave,
    reservedAfterLeave,
    readyButton,
    ownServerScore,
    journalScoreText,
    nativeMaps,
} from "./support/ui";
import { mapsScenarios } from "./support/safety.mjs";
import type { Envelope } from "./support/types";

const plan = mapsScenarios["multiround.maps.spec.ts"];
async function roundResult(actor: Actor, mark: number, gameId: string, round: number) {
    const result = await actor.event("ROUND_RESULT", (event) => event.payload?.gameId === gameId && event.payload.round === round, mark, 30_000);
    expect(result.payload?.phase).toBe(round === plan.rounds.length ? "FINISHED" : "MID-ROUND");
    const events = actor.events.slice(mark).filter((event) => event.seq < result.seq);
    const finalGuess = [...events].reverse().find((event) => event.type === "NEW_RESULT");
    const finished = events.find((event) => event.type === "ROUND_FINISHED");
    expect(!!finalGuess && !!finished, "Real guesses and ROUND_FINISHED must precede the scored round result").toBe(true);
    expect(finalGuess!.seq).toBeLessThan(finished!.seq);
    expect(finished!.seq).toBeLessThan(result.seq);
    expect(Object.keys(result.payload?.roundRes ?? {})).toHaveLength(plan.players);
    return result;
}

test("three independent guests: two real rounds, MID-ROUND reload, ungated Next round and complete local journals", async ({ run }) => {
    const host = await run.actor("Host");
    const peer = await run.actor("Peer");
    const guest = await run.actor("Guest");
    const actors = [host, peer, guest];
    expect(actors).toHaveLength(plan.players);
    for (const actor of actors) await registerGuest(actor);
    const lobbyId = await createLobby(host);
    for (const actor of [peer, guest]) {
        const mark = host.mark();
        await joinInvite(actor, lobbyId);
        await host.snapshot((lobby) => Object.values(lobby.playerList).some((player) => player.name === actor.name && player.connected), mark);
    }
    const ids = actors.map((actor) => actor.id);
    expect(new Set(ids).size, "Each real guest/context must own an independent identity").toBe(plan.players);
    expect(host.latest?.admin).toBe(host.id);
    await changeSettings(host, { name: `Crew-${lobbyId}`, rounds: plan.rounds.length, attempts: 1, seconds: 90, country: "NL" });
    for (const actor of [peer, guest]) await actor.snapshot((lobby) => lobby.conf.name === `Crew-${lobbyId}` && lobby.conf.numRounds === plan.rounds.length);
    expect(run.sdkRequests, "The new lobby must not load Maps before a real start").toBe(0);
    const startButton = host.page.getByRole("button", { name: /^start game$/i });
    await expect(startButton).toHaveCount(0);
    for (const [index, actor] of actors.entries()) {
        await setReady(actor, true);
        if (index < actors.length - 1) await expect(startButton).toHaveCount(0);
    }
    await expect(startButton).toBeEnabled();

    let gameId: string | undefined;
    let firstResult: Envelope[] = [];
    let finalResult: Envelope[] = [];
    for (const round of plan.rounds) {
        const marks = actors.map((actor) => actor.mark());
        const button = round === 1 ? startButton : host.page.getByRole("button", { name: /^next round$/i });
        await expect(button).toBeEnabled();
        await run.permitStart(host);
        await button.click();
        const starts = await Promise.all(actors.map((actor, index) => actor.event("START_ROUND", (event) => event.payload?.round === round, marks[index], 45_000)));
        if (round === 1) gameId = starts[0].payload?.gameId;
        expect(gameId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        for (const [index, actor] of actors.entries()) {
            expect(starts[index].payload?.gameId).toBe(gameId); // Next round must retain the original match identity.
            expect(starts[index].seq).toBe(starts[0].seq);
            expect(starts[index].payload?.phase).toBe("PLAYING");
            await expect(actor.page.getByTestId("maps-ready")).toBeVisible({ timeout: 30_000 });
            await expect(actor.page.getByTestId("street-view").locator(".gm-style").first()).toBeVisible();
        }
        expect(run.sdkRequests).toBeGreaterThan(0);
        run.assertHealthy();
        for (const actor of actors) await guess(actor); // Real Google map clicks and the real Guess control.
        const results = await Promise.all(actors.map((actor, index) => roundResult(actor, marks[index], gameId!, round)));
        if (round === 1) {
            firstResult = results;
            for (const actor of actors) {
                await expect(actor.page.getByRole("heading", { name: "Round 1 Results", exact: true })).toBeVisible();
                await expect(readyButton(actor), "MID-ROUND must have no new ready acknowledgement").toHaveCount(0);
                expect(actor.events.slice(marks[actors.indexOf(actor)]).some((event) => event.type === "GAME_END")).toBe(false);
            }
            // The plan reserves exactly one additional map+panorama authorization
            // for this hard reload. No second reload/retry or country fallback.
            expect(plan.recoveries).toEqual(["MID-ROUND"]);
            const peerId = peer.id;
            const color = results[1].payload?.players?.[peerId]?.color;
            expect(typeof color).toBe("string");
            const reloadMark = peer.mark();
            const hostMark = host.mark();
            await peer.reload();
            const joined = await peer.event("JOINED_LOBBY", (event) => event.payload?.lobby?.gameId === gameId, reloadMark);
            const recovered = await peer.event("REJOIN_ROUND", (event) => event.payload?.gameId === gameId, reloadMark);
            const snapshot = recovered.payload?.lobby;
            expect(joined.seq).toBeLessThan(recovered.seq);
            expect(joined.payload?.lobby?.phase).toBe("MID-ROUND");
            expect(joined.payload?.lobby?.timeRemaining).toBe(0);
            expect(recovered.payload?.phase).toBe("MID-ROUND");
            expect(recovered.payload?.round).toBe(1);
            expect(recovered.payload?.timeRemaining).toBe(0); // Finished round clock stays zero, not a fresh PLAYING deadline.
            expect(snapshot?.gameId).toBe(gameId);
            expect(snapshot?.round).toBe(1);
            expect(snapshot?.currentRound).toBe(1);
            expect(snapshot?.timeRemaining).toBe(0);
            expect(snapshot?.numPlayers).toBe(plan.players);
            expect(Object.keys(snapshot?.playerList ?? {}).sort()).toEqual([...ids].sort());
            expect(snapshot?.playerList[peerId]?.color).toBe(color);
            expect(snapshot?.playerList[peerId]?.ready).toBe(false);
            expect(snapshot?.endResults?.["1"]).toEqual(firstResult[1].payload?.roundRes);
            expect(Object.keys(snapshot?.revealedAnswers ?? {})).toEqual(["1"]);
            expect(peer.id).toBe(peerId);
            await connected(peer);
            // Recovery must restore the usable results screen, not just socket state.
            const recap = peer.page.getByRole("region", { name: "Round 1 Results", exact: true });
            await expect(recap.getByRole("heading", { name: "Round 1 Results", exact: true })).toBeVisible();
            // Session retains the gameplay view with v-show to keep native Maps objects.
            await expect(peer.page.locator(".guess-button")).toBeHidden();
            await expect(peer.page.getByRole("dialog")).toHaveCount(0);
            await expect(peer.page.getByTestId("maps-recovery")).toHaveCount(0);
            const answer = snapshot?.revealedAnswers?.["1"];
            expect(answer, "Recovery must include the completed round's authoritative answer").toBeDefined();
            const recoveredViews = await nativeMaps(peer);
            try {
                await expect
                    .poll(() => recoveredViews.evaluate(({ map }, point) => !!map?.getBounds()?.contains(point), answer!), {
                        message: "The recovered result map must frame the revealed answer",
                        timeout: 15_000,
                    })
                    .toBe(true);
            } finally {
                await recoveredViews.dispose();
            }
            expect(peer.events.slice(reloadMark).some((event) => event.type === "START_ROUND")).toBe(false);
            await host.snapshot(
                (lobby) => lobby.gameId === gameId && lobby.phase === "MID-ROUND" && lobby.playerList[peerId]?.connected && !lobby.playerList[peerId]?.ready,
                hostMark
            );
            expect(host.latest?.admin).toBe(host.id); // Reloading a guest cannot change the live host.
            await expect(readyButton(peer)).toHaveCount(0);
            await expect(host.page.getByRole("button", { name: /^next round$/i })).toBeEnabled();
            // Deliberately no setReady call: at least this recovered guest is unready.
        } else {
            finalResult = await Promise.all(actors.map((actor, index) => actor.event("GAME_END", (event) => event.payload?.gameId === gameId, marks[index], 30_000)));
            for (const [index, actor] of actors.entries()) {
                const end = finalResult[index];
                expect(end.seq).toBeGreaterThan(results[index].seq);
                expect(end.payload?.phase).toBe("FINISHED");
                expect(end.payload?.round).toBe(2);
                for (const archive of [end.payload?.results, end.payload?.endResults, end.payload?.revealedAnswers]) expect(Object.keys(archive ?? {})).toEqual(["1", "2"]);
                expect(Object.keys(end.payload?.totalResults ?? {}).sort()).toEqual([...ids].sort());
                for (const completedRound of plan.rounds) for (const id of ids) expect(end.payload?.results?.[String(completedRound)]?.[id]).toHaveLength(1);
                expect(end.payload?.endResults?.["1"]).toEqual(firstResult[index].payload?.roundRes);
                expect(end.payload?.endResults?.["2"]).toEqual(results[index].payload?.roundRes);
                await expect(actor.page.getByTestId("match-results")).toBeVisible();
                await expect(readyButton(actor)).toHaveAttribute("aria-pressed", "false");
            }
        }
        run.assertHealthy();
    }
    expect(run.started.size).toBe(plan.rounds.length);
    for (const actor of [guest, peer, host]) await leave(actor);
    await reservedAfterLeave(lobbyId);
    for (const [index, actor] of actors.entries()) {
        await actor.goto("/journal");
        await expect(actor.page.getByTestId("journal-entry")).toHaveCount(1);
        const entry = actor.page.locator(`[data-testid="journal-entry"][data-game-id="${gameId}"]`);
        await expect(entry).toContainText("2 rounds");
        const total = ownServerScore(finalResult[index].payload?.totalResults?.[actor.id]);
        await expect(entry.getByTestId("journal-match-score")).toHaveText(journalScoreText(total));
        await entry.click();
        await expect(entry).toHaveAttribute("aria-pressed", "true");
        await expect(actor.page.getByTestId("journal-debrief-match-score")).toHaveText(journalScoreText(total));
        const picker = actor.page.getByRole("group", { name: /^choose a round to review$/i });
        await expect(picker.getByRole("button")).toHaveCount(plan.rounds.length);
        for (const round of plan.rounds) {
            const label = `Round ${String(round).padStart(2, "0")}`;
            const choice = picker.getByRole("button", { name: new RegExp(`^${label}\\b`) });
            await choice.click();
            await expect(choice).toHaveAttribute("aria-pressed", "true");
            await expect(actor.page.getByRole("heading", { name: label, exact: true })).toBeVisible();
            await expect(actor.page.getByRole("region", { name: /^guess debrief;/i }).locator("tbody tr")).toHaveCount(1);
            const score = ownServerScore(finalResult[index].payload?.endResults?.[String(round)]?.[actor.id]);
            await expect(actor.page.getByTestId("journal-round-total")).toHaveText(journalScoreText(score));
        }
        await actor.reload(); // Journal-only reload has no lobby or new Maps grant.
        await expect(actor.page.getByTestId("journal-entry")).toHaveCount(1);
        await expect(actor.page.locator(`[data-testid="journal-entry"][data-game-id="${gameId}"]`)).toContainText("2 rounds");
    }
    run.assertHealthy();
});
