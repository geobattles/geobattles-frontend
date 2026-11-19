import { test, expect } from "./support/fixtures";
import { registerGuest, createLobby, joinInvite, setReady, changeSettings, connected, leave, disposed } from "./support/ui";

test("independent guests: invite, settings, ready gate, reload, offline recovery and deliberate leave", async ({ run }) => {
    const host = await run.actor("Host");
    const peer = await run.actor("Mobile", true);
    await registerGuest(host);
    await registerGuest(peer);
    const lobbyId = await createLobby(host);
    const hostMark = host.mark();
    await joinInvite(peer, lobbyId);
    const joined = await host.snapshot((lobby) => lobby.numPlayers === 2, hostMark);
    expect(joined.admin).toBe(host.id);
    expect(host.id).not.toBe(peer.id);
    await expect(host.row(peer.name)).toHaveAttribute("data-connected", "true");
    await expect(peer.row(host.name)).toHaveAttribute("data-host", "true");
    await expect(peer.page.getByTestId("lobby-code")).toHaveText(lobbyId);
    expect(await peer.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "The mobile lobby must fit its viewport").toBe(true);

    const start = host.page.getByRole("button", { name: /^start game$/i });
    const readyStartState = async () => {
        // Wait for the real button state, not an early count of an unrelated footer.
        // An unready/recovery blocker must not pass this assertion.
        await expect
            .poll(async () => {
                if (!(await start.isDisabled())) return true;
                return /^Maps is not configured in this browser build\./.test((await start.getAttribute("title")) ?? "");
            })
            .toBe(true);
    };
    await expect(start).toHaveCount(0);
    await setReady(host, true);
    await expect(start).toHaveCount(0);
    await setReady(peer, true);
    await readyStartState(); // Blank-key builds intentionally keep START disabled; guards still forbid every START.
    await expect(host.row(peer.name)).toHaveAttribute("data-ready", "true");
    const peerSettingsMark = peer.mark();
    const name = `Expedition-${lobbyId}`;
    await changeSettings(host, { name, rounds: 2, seconds: 60, country: "NL" });
    const changed = await peer.snapshot((lobby) => lobby.conf.name === name, peerSettingsMark);
    expect(Object.values(changed.playerList).every((player) => player.ready)).toBe(true);
    await expect(peer.page.getByTestId("lobby-name")).toHaveText(name);
    await readyStartState();

    const originalHostId = host.id;
    const reloadMark = host.mark();
    await host.reload();
    const rejoin = await host.event("REJOIN_ROUND", () => true, reloadMark);
    expect(rejoin.payload?.phase).toBe("WAITING");
    expect(rejoin.payload?.round).toBe(0);
    expect(rejoin.payload?.timeRemaining).toBe(0);
    expect(host.id).toBe(originalHostId);
    await connected(host);
    // Reload loses the original host lease; an already-connected peer owns the handoff.
    await expect(peer.row()).toHaveAttribute("data-host", "true");
    await expect(host.row()).toHaveAttribute("data-host", "false");

    const offlineMark = host.mark();
    const peerRecoveryMark = peer.mark();
    await peer.setOffline(true);
    const lost = await host.snapshot((lobby) => lobby.playerList[peer.id]?.connected === false, offlineMark, 20_000);
    expect(lost.numPlayers).toBe(2); // Transport loss is not intentional membership removal.
    expect(lost.admin).toBe(host.id);
    await expect(peer.page.getByTestId("connection-status")).toContainText(/offline|reconnect/i);
    await expect(host.row(peer.name)).toHaveAttribute("data-connected", "false");
    await peer.setOffline(false);
    const recovery = await peer.event("REJOIN_ROUND", () => true, peerRecoveryMark);
    expect(recovery.payload?.lobby?.admin).toBe(host.id); // Returning host must not reclaim it.
    expect(recovery.payload?.phase).toBe("WAITING");
    expect(recovery.payload?.lobby?.conf.name).toBe(name);
    await connected(peer);
    peer.offline = false;
    await expect(peer.row()).toHaveAttribute("data-host", "false");

    const leaveMark = host.mark();
    await leave(peer);
    const afterLeave = await host.snapshot((lobby) => !lobby.playerList[peer.id], leaveMark);
    expect(afterLeave.numPlayers).toBe(1);
    await expect(host.row(peer.name)).toHaveCount(0);
    await connected(host);
    await leave(host);
    await disposed(lobbyId);
    expect(run.started.size).toBe(0);
    expect(run.sdkRequests).toBe(0);
    expect(run.startPermits).toBe(0);
    run.assertHealthy();
});
