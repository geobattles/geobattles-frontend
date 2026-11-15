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
    disposed,
    readyButton,
    ownServerScore,
    journalScoreText,
    mapsReady,
    nativeMaps,
    publicLobby,
} from "./support/ui";
import type { Envelope } from "./support/types";

async function completed(actor: Actor, mark: number, gameId: string): Promise<Envelope> {
    const end = await actor.event("GAME_END", (event) => event.payload?.gameId === gameId, mark, 30_000);
    expect(end.payload?.phase).toBe("FINISHED");
    expect(end.payload?.round).toBe(1);
    const events = actor.events.slice(mark).filter((event) => event.seq <= end.seq);
    const finalGuess = [...events].reverse().find((event) => event.type === "NEW_RESULT");
    const finished = events.find((event) => event.type === "ROUND_FINISHED");
    const result = events.find((event) => event.type === "ROUND_RESULT");
    expect(!!finalGuess && !!finished && !!result, "Real guess/round/results events must precede GAME_END").toBe(true);
    expect(finalGuess!.seq).toBeLessThan(finished!.seq);
    expect(finished!.seq).toBeLessThan(result!.seq);
    expect(result!.seq).toBeLessThan(end.seq);
    expect(Object.keys(end.payload?.results ?? {})).toEqual(["1"]);
    expect(Object.keys(end.payload?.totalResults ?? {})).toHaveLength(2);
    await expect(actor.page.getByTestId("match-results")).toBeVisible();
    await expect(readyButton(actor)).toHaveAttribute("aria-pressed", "false");
    return end;
}

test("real Maps round: map-only retry, recovery clock, ordered results, ready-gated rematch and identity-local journal", async ({ run }) => {
    const host = await run.actor("Host");
    const peer = await run.actor("Peer");
    await registerGuest(host);
    await registerGuest(peer);
    const lobbyId = await createLobby(host);
    const joinedMark = host.mark();
    await joinInvite(peer, lobbyId);
    await host.snapshot((lobby) => lobby.numPlayers === 2, joinedMark);
    await changeSettings(host, { name: `Maps-${lobbyId}`, rounds: 1, attempts: 1, seconds: 90 });
    await peer.snapshot((lobby) => lobby.conf.numRounds === 1 && lobby.conf.numAttempt === 1 && lobby.conf.name === `Maps-${lobbyId}`);
    const firstMarks = [host.mark(), peer.mark()];
    expect(run.sdkRequests, "Lobby/landing must not load Maps before an authoritative round").toBe(0);
    await expect(host.page.getByRole("button", { name: /^start game$/i })).toBeDisabled();
    await run.probeReadinessRejection(host); // Real server rejection; never synthesize provider/phase success.
    await setReady(host, true);
    await setReady(peer, true);
    await expect(host.page.getByRole("button", { name: /^start game$/i })).toBeEnabled();
    const beforeStart = [host, peer].map((actor) => ({
        generation: actor.generation,
        id: actor.id,
        authRequests: actor.authRequests,
        documentRequests: actor.documentRequests,
        startCommands: actor.startCommands,
    }));
    run.failFirstMapsSDK(peer); // Arm BEFORE the first positive START; only one native script abort.
    await run.permitStart(host);
    await host.page.getByRole("button", { name: /^start game$/i }).click();
    const start = await host.event("START_ROUND", () => true, firstMarks[0], 45_000);
    const gameId = start.payload?.gameId;
    expect(typeof gameId === "string" && gameId.length > 0).toBe(true);
    const peerStart = await peer.event("START_ROUND", () => true, firstMarks[1], 45_000);
    expect(peerStart.payload?.gameId).toBe(gameId);
    expect(peerStart.seq).toBe(start.seq);
    expect(start.payload?.round).toBe(1);
    expect(peerStart.payload?.round).toBe(1);
    await run.finishMapsSDKFailure(peer); // Close its narrow diagnostic interval as soon as recovery is visible.
    await expect(peer.page.getByTestId("maps-ready")).toHaveCount(0);
    const failedViews = await nativeMaps(peer);
    try {
        expect(await failedViews.evaluate(({ map, panorama }) => map === null && panorama === null), "Retry is allocated only before the peer has any native SDK view").toBe(true);
        await mapsReady(host);
        await expect(host.page.getByTestId("maps-recovery")).toHaveCount(0);
        const healthyViews = await nativeMaps(host);
        try {
            const beforeRetry = [host, peer].map((actor) => ({
                generation: actor.generation,
                id: actor.id,
                authRequests: actor.authRequests,
                navigations: actor.mainFrameNavigations,
                startCommands: actor.startCommands,
                url: actor.page.url(),
                mark: actor.mark(),
            }));
            const permits = run.startPermits;
            const grants = run.viewGrants.size;
            const reserved = run.reservedGrants;
            expect(grants, "Only the two initial actors are authorized before map-only retry").toBe(2);
            run.resumeMapsSDK(peer); // Native networking resumes, with no diagnostic exemption left.
            await peer.page.getByTestId("maps-recovery").getByRole("button", { name: "Retry map", exact: true }).click();
            await mapsReady(peer);
            await expect(peer.page.getByTestId("maps-recovery")).toHaveCount(0);
            for (const [index, actor] of [host, peer].entries()) {
                const before = beforeRetry[index];
                expect(actor.generation, "Map retry must not replace either native lobby socket").toBe(before.generation);
                expect(actor.generation).toBe(beforeStart[index].generation);
                expect(actor.id).toBe(before.id);
                expect(actor.id).toBe(beforeStart[index].id);
                expect(actor.authRequests, "Map retry must not issue authentication or registration requests").toBe(before.authRequests);
                expect(actor.authRequests).toBe(beforeStart[index].authRequests);
                expect(actor.documentRequests, "Neither initial SDK failure nor retry may reload a document").toBe(beforeStart[index].documentRequests);
                expect(actor.mainFrameNavigations, "Map retry must not navigate or reload either page").toBe(before.navigations);
                expect(actor.page.url()).toBe(before.url);
                expect(actor.startCommands, "Retry map must not send another START command").toBe(before.startCommands);
                expect(actor.startCommands).toBe(beforeStart[index].startCommands + (actor === host ? 1 : 0));
                expect(actor.phase).toBe("PLAYING");
                expect(actor.events.slice(before.mark).some((event) => ["START_ROUND", "JOINED_LOBBY", "REJOIN_ROUND"].includes(event.type))).toBe(false);
                expect(actor.events.slice(firstMarks[index]).filter((event) => event.type === "START_ROUND")).toHaveLength(1);
                expect(actor.events.slice(firstMarks[index]).some((event) => ["JOINED_LOBBY", "REJOIN_ROUND"].includes(event.type))).toBe(false);
                const currentViews = await nativeMaps(actor);
                try {
                    const previousViews = actor === host ? healthyViews : failedViews;
                    expect(await currentViews.evaluate((current, previous) => current.document === previous.document, previousViews)).toBe(true);
                    if (actor === host) {
                        expect(
                            await currentViews.evaluate((current, previous) => current.map === previous.map && current.panorama === previous.panorama, previousViews),
                            "The healthy actor retains both actual SDK objects"
                        ).toBe(true);
                    }
                } finally {
                    await currentViews.dispose();
                }
            }
            await mapsReady(host);
            await expect(host.page.getByTestId("maps-recovery")).toHaveCount(0);
            expect(await publicLobby(lobbyId)).toMatchObject({
                gameId,
                round: 1,
                phase: "PLAYING",
                admin: host.id,
                numPlayers: 2,
                playerList: { [host.id]: { connected: true }, [peer.id]: { connected: true } },
            });
            expect([...run.started]).toEqual([`${gameId}:1`]);
            expect(run.startPermits).toBe(permits);
            expect(run.viewGrants.size).toBe(grants); // No socket/game/round change; aborted before peer constructors.
            expect(run.reservedGrants).toBe(reserved);
        } finally {
            await healthyViews.dispose();
        }
    } finally {
        await failedViews.dispose();
    }
    expect(run.sdkRequests, "Actual Google SDK/provider requests must have occurred").toBeGreaterThan(0);
    run.assertHealthy();

    const lossMark = host.mark();
    const recoveryMark = peer.mark();
    await peer.setOffline(true);
    const lost = await host.snapshot((lobby) => lobby.phase === "PLAYING" && lobby.playerList[peer.id]?.connected === false, lossMark, 20_000);
    expect(lost.gameId).toBe(gameId);
    expect(lost.timeRemaining).toBeGreaterThan(0);
    await peer.setOffline(false);
    const recovered = await peer.event("REJOIN_ROUND", () => true, recoveryMark, 20_000);
    expect(recovered.payload?.gameId).toBe(gameId);
    expect(recovered.payload?.lobby?.gameId).toBe(gameId);
    expect(recovered.payload?.phase).toBe("PLAYING");
    expect(recovered.payload?.round).toBe(1);
    expect(recovered.payload?.timeRemaining).toBeGreaterThan(0);
    expect(recovered.payload!.timeRemaining!).toBeLessThanOrEqual(lost.timeRemaining); // No reset or frozen offline clock.
    await connected(peer);
    peer.offline = false;
    await mapsReady(peer);
    await guess(host);
    await guess(peer);
    const first = await completed(host, firstMarks[0], gameId!);
    const peerFirst = await completed(peer, firstMarks[1], gameId!);
    expect(Object.keys(first.payload?.totalResults ?? {}).sort()).toEqual([host.id, peer.id].sort());
    run.assertHealthy();

    const rematch = host.page.getByRole("button", { name: /^(new game|rematch)$/i });
    await expect(rematch).toBeDisabled();
    const secondMarks = [host.mark(), peer.mark()];
    await run.probeReadinessRejection(host);
    await setReady(host, true);
    await expect(rematch).toBeDisabled();
    await setReady(peer, true);
    await expect(rematch).toBeEnabled();
    await run.permitStart(host);
    await rematch.click();
    const replay = await host.event("START_ROUND", () => true, secondMarks[0], 45_000);
    const replayId = replay.payload?.gameId;
    expect(typeof replayId === "string" && replayId.length > 0).toBe(true);
    expect(replayId).not.toBe(gameId);
    expect(replay.payload?.round).toBe(1);
    expect((await peer.event("START_ROUND", () => true, secondMarks[1], 45_000)).payload?.gameId).toBe(replayId);
    for (const actor of [host, peer]) await mapsReady(actor);
    await guess(host);
    await guess(peer);
    const second = await completed(host, secondMarks[0], replayId!);
    const peerSecond = await completed(peer, secondMarks[1], replayId!);
    expect(run.started.size).toBe(2);
    run.assertHealthy();

    await leave(peer);
    await leave(host);
    await disposed(lobbyId);
    for (const actor of [host, peer]) {
        await actor.page.goto("/journal", { waitUntil: "domcontentloaded" });
        await expect(actor.page.getByText(/local.*device|this device|stored locally/i).first()).toBeVisible();
        await expect(actor.page.getByTestId("journal-entry")).toHaveCount(2);
        const results = actor === host ? [first, second] : [peerFirst, peerSecond];
        for (const [index, id] of [gameId!, replayId!].entries()) {
            // IDs are validated UUIDs from authoritative frames, never token/storage values.
            expect(id).toMatch(/^[a-zA-Z0-9-]{1,128}$/);
            const directEntry = actor.page.locator(`[data-testid="journal-entry"][data-game-id="${id}"]`);
            await expect(directEntry).toHaveCount(1);
            await expect(directEntry).toContainText("1 rounds");
            const score = ownServerScore(results[index].payload?.totalResults?.[actor.id]);
            await expect(directEntry.getByTestId("journal-match-score")).toHaveText(journalScoreText(score));
            await directEntry.click();
            await expect(directEntry).toHaveAttribute("aria-pressed", "true");
            await expect(actor.page.getByTestId("journal-debrief-match-score")).toHaveText(journalScoreText(score));
            await expect(actor.page.getByRole("heading", { name: "Round 01", exact: true })).toBeVisible();
            const roundScore = ownServerScore(results[index].payload?.endResults?.["1"]?.[actor.id]);
            await expect(actor.page.getByTestId("journal-round-total")).toHaveText(journalScoreText(roundScore));
        }
        await actor.reload();
        await expect(actor.page.getByTestId("journal-entry")).toHaveCount(2); // Reload cannot duplicate a stable game ID.
    }
    await host.page.getByRole("button", { name: /^clear (local )?journal$/i }).click();
    const confirm = host.page.getByRole("dialog").getByRole("button", { name: /^(clear|clear (local )?journal)$/i });
    await confirm.click();
    await expect(host.page.getByTestId("journal-entry")).toHaveCount(0);
    await peer.reload();
    await expect(peer.page.getByTestId("journal-entry")).toHaveCount(2); // Context/identity isolation.
    run.assertHealthy();
});
