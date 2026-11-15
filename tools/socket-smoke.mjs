#!/usr/bin/env node
// Native Node 24 HTTP/WebSocket integration. No server startup or Maps.
import { request } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { performance } from "node:perf_hooks";
import { check, CheckFailure, settings, socketURL } from "../e2e/support/safety.mjs";
import { regionScoreScale, sameCountries } from "../app/utils/regionScoring.ts";

const TIMEOUT = 8_000;
const GRACE = 30_000;
const peers = new Set();
let stage = "configuration";
let negativeStartEnabled = false;

async function http(backend, path, { method = "GET", token, body, status = 200 } = {}) {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (token) headers.set("Authorization", token);
    let response;
    try {
        // Paths are fixed harness routes; preserve the validated optional /api base.
        response = await fetch(`${backend}${path}`, {
            method,
            redirect: "error",
            signal: AbortSignal.timeout(TIMEOUT),
            headers,
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
    } catch {
        throw new CheckFailure("Local HTTP request failed or timed out (details withheld)");
    }
    check(response.status === status, `HTTP status mismatch: expected ${status}, received ${response.status}`);
    try {
        return await response.json();
    } catch {
        throw new CheckFailure("HTTP response was not JSON (body withheld)");
    }
}

async function guest(backend, suffix) {
    const name = `Socket-${suffix}-${randomUUID().slice(0, 8)}`;
    const pair = await http(backend, "/auth/register/guest", { method: "POST", body: { displayname: name }, status: 201 });
    check(typeof pair.AccessToken === "string" && pair.AccessToken.split(".").length === 3, "Guest did not return an access token");
    // Decode only this locally received identity for assertions. This is not JWT validation.
    let id;
    try {
        id = JSON.parse(Buffer.from(pair.AccessToken.split(".")[1], "base64url").toString("utf8")).sub;
    } catch {
        throw new CheckFailure("Guest identity claim could not be read");
    }
    check(typeof id === "string" && /^[A-Z0-9]{6}$/.test(id), "Guest identity claim has an unexpected format");
    return { id, name, token: pair.AccessToken };
}

function waitingSnapshot(lobby, size) {
    check(lobby?.phase === "WAITING" && lobby.round === 0 && lobby.currentRound === 0 && lobby.timeRemaining === 0, "Waiting phase/round/remaining clock snapshot mismatch");
    check(lobby.numPlayers === size && Object.keys(lobby.playerList).length === size, "Retained member count mismatch");
    check(!("location" in lobby), "Waiting snapshot must not contain an answer location");
    check(!lobby.gameId, "A waiting lobby must not invent a game ID before a successful game");
    for (const player of Object.values(lobby.playerList)) {
        check(typeof player.ready === "boolean" && typeof player.connected === "boolean", "Snapshot is missing authoritative readiness/connection booleans");
    }
    for (const field of ["results", "endResults", "totalResults", "fullroundRes", "roundRes"]) {
        check(lobby[field] && Object.keys(lobby[field]).length === 0, "Waiting snapshot contains unexpected result state");
    }
    check(Array.isArray(lobby.powerLog), "Snapshot is missing its complete power log");
}

class Peer {
    events = [];
    signal = new EventEmitter();
    seq = 0;
    fault = undefined;
    closed = false;

    constructor(backend, lobbyId, identity) {
        this.identity = identity;
        peers.add(this);
        this.ws = new WebSocket(socketURL(backend, lobbyId), ["json", identity.token]);
        this.ws.addEventListener("message", ({ data }) => {
            try {
                const event = JSON.parse(String(data));
                if (event.command === "ping") {
                    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ command: "pong" }));
                    return;
                }
                check(["OK", "WRN", "ERR"].includes(event.status) && typeof event.type === "string", "Invalid socket envelope");
                check(event.type !== "START_ROUND", "Unexpected real game start in a keyless scenario");
                check(Number.isSafeInteger(event.seq) && event.seq > this.seq, "Lobby event sequence is absent, duplicated or out of order");
                this.seq = event.seq; // Not seq+1: unicast gaps are legitimate.
                check(this.events.length < 512, "Unexpected socket event flood");
                this.events.push(event);
            } catch (error) {
                this.fault = error instanceof CheckFailure ? error : new CheckFailure("Invalid socket JSON (frame withheld)");
            }
            this.signal.emit("change");
        });
        this.ws.addEventListener("error", () => {
            this.fault ??= new CheckFailure("Socket transport failed (details withheld)");
            this.signal.emit("change");
        });
        this.ws.addEventListener("close", (event) => {
            this.closed = true;
            this.closeCode = event.code; // Never retain the peer's close reason.
            this.signal.emit("change");
        });
    }

    async wait(predicate, after = 0, timeout = TIMEOUT) {
        const find = () => this.events.slice(after).find(predicate);
        return this.until(find, timeout, "Timed out waiting for the expected authoritative socket event");
    }

    async until(find, timeout, label) {
        return new Promise((resolve, reject) => {
            const cleanup = () => {
                clearTimeout(timer);
                this.signal.off("change", inspect);
            };
            const inspect = () => {
                const result = find();
                if (!this.fault && !result) return;
                cleanup();
                if (this.fault) reject(this.fault);
                else resolve(result);
            };
            const timer = setTimeout(() => {
                cleanup();
                reject(new CheckFailure(label));
            }, timeout);
            this.signal.on("change", inspect);
            inspect();
        });
    }

    async join(returning = false) {
        const joined = await this.wait((e) => e.type === "JOINED_LOBBY" && e.payload.user === this.identity.id);
        check(this.ws.protocol === "json", "Server did not select the established JSON subprotocol");
        if (!returning) return joined.payload.lobby;
        const rejoin = await this.wait((e) => e.type === "REJOIN_ROUND");
        check(rejoin.seq > joined.seq, "Recovery snapshot did not follow JOINED_LOBBY");
        check(rejoin.payload.phase === rejoin.payload.lobby.phase && rejoin.payload.round === rejoin.payload.lobby.round, "Recovery envelope and full snapshot disagree");
        check(rejoin.payload.timeRemaining === rejoin.payload.lobby.timeRemaining, "Recovery clock mismatch");
        check(JSON.stringify(rejoin.payload.players) === JSON.stringify(rejoin.payload.lobby.playerList), "Recovery players differ from the full snapshot");
        for (const field of ["fullroundRes", "roundRes", "totalResults", "powerLog"]) {
            check(JSON.stringify(rejoin.payload[field]) === JSON.stringify(rejoin.payload.lobby[field]), "Recovery omitted or changed retained state");
        }
        return rejoin.payload.lobby;
    }

    send(command, payload = {}) {
        // Default sends no START. Parent may opt into one rejection probe only
        // after starting a keyless backend, so a regression cannot spend quota.
        check(command !== "start" || negativeStartEnabled, "Default keyless checks must never send START");
        if (command === "start") negativeStartEnabled = false;
        check(!this.fault && this.ws.readyState === WebSocket.OPEN, "Cannot send on a stale or unavailable socket");
        this.ws.send(JSON.stringify({ command, ...payload }));
    }

    async ready(value) {
        const after = this.events.length;
        this.send("setReady", { ready: value });
        return this.wait((e) => e.type === "UPDATED_LOBBY" && e.payload.lobby.playerList[this.identity.id]?.ready === value, after);
    }

    async leave() {
        if (this.closed) return;
        this.send("disconnect");
        await this.until(() => this.closed, TIMEOUT, "Intentional leave did not close its owning socket");
        check(this.closeCode === 1000, "Intentional leave did not send a normal close control frame");
    }

    async loss() {
        check(this.ws.readyState === WebSocket.OPEN, "Cannot close an unavailable socket");
        this.ws.close(1000, "local integration transport close");
        await this.until(() => this.closed, TIMEOUT, "Client close handshake did not terminate");
        check(this.closeCode === 1000, "Graceful client close did not complete with the requested normal code");
    }
}

// A real HTTP WebSocket upgrade request proves exact rejection status/code.
// This is not a synthetic peer: successful joins use Node's native WebSocket.
async function denied(backend, lobbyId, identity, expectedStatus, code) {
    const result = await new Promise((resolve, reject) => {
        const req = request(new URL(socketURL(backend, lobbyId).replace(/^ws:/, "http:")), {
            method: "GET",
            headers: {
                Connection: "Upgrade",
                Upgrade: "websocket",
                "Sec-WebSocket-Version": "13",
                "Sec-WebSocket-Key": randomBytes(16).toString("base64"),
                "Sec-WebSocket-Protocol": `json, ${identity.token}`,
            },
        });
        const timer = setTimeout(() => {
            req.destroy();
            reject(new CheckFailure("Upgrade rejection timed out"));
        }, TIMEOUT);
        req.on("upgrade", (_response, socket) => {
            clearTimeout(timer);
            socket.destroy();
            reject(new CheckFailure("Server unexpectedly admitted a duplicate/disposed-lobby socket"));
        });
        req.on("response", (response) => {
            let body = "";
            response.on("data", (chunk) => {
                if (body.length < 8192) body += chunk.toString();
            });
            response.on("end", () => {
                clearTimeout(timer);
                let error;
                try {
                    error = JSON.parse(body).error;
                } catch {
                    // Report only a comparison failure, never a response body.
                }
                resolve({ status: response.statusCode, error });
            });
        });
        req.on("error", () => {
            clearTimeout(timer);
            reject(new CheckFailure("Upgrade request failed (details withheld)"));
        });
        req.end();
    });
    check(result.status === expectedStatus && result.error === code, "Upgrade rejection status/code mismatch");
}

async function listed(backend, id, predicate, timeout = TIMEOUT) {
    const deadline = performance.now() + timeout;
    do {
        const list = await http(backend, "/lobby");
        if (predicate(list[id])) return list[id];
        await new Promise((resolve) => setTimeout(resolve, 100)); // Outcome-driven polling, not a phase sleep.
    } while (performance.now() < deadline);
    throw new CheckFailure("Public lobby state did not reach the expected membership/disposal outcome");
}

async function run() {
    const { backend, maps, readyRejection } = settings();
    check(!maps, "The native socket harness is keyless; run the explicit browser Maps project for gameplay");
    stage = "guest/create/join";
    const [a, b, c, d] = await Promise.all(["host", "second", "third", "expiry"].map((name) => guest(backend, name)));
    const conf = {
        name: `Socket-${randomUUID().slice(0, 8)}`,
        mode: 1,
        maxPlayers: 4,
        numAttempt: 1,
        numRounds: 1,
        roundTime: 30,
        scoreFactor: 100,
        ccList: [],
        powerups: [false, false],
        placeBonus: false,
        dynLives: false,
    };
    const created = await http(backend, "/lobby", { method: "POST", token: a.token, body: conf });
    waitingSnapshot(created, 0);
    const pa = new Peer(backend, created.ID, a);
    waitingSnapshot(await pa.join(), 1);
    const pb = new Peer(backend, created.ID, b);
    await pb.join();
    const pc = new Peer(backend, created.ID, c);
    const joined = await pc.join();
    waitingSnapshot(joined, 3);
    check(joined.admin === a.id && Object.values(joined.playerList).every((p) => p.connected && !p.ready), "Initial host/readiness snapshot mismatch");
    const originalColor = joined.playerList[a.id].color;
    console.log("PASS guest/create/independent joins and full waiting snapshots");

    stage = "duplicate identity and settings/readiness";
    await denied(backend, created.ID, a, 409, "ALREADY_CONNECTED");
    await pa.ready(true); // Original socket still owns the identity; no takeover.
    await pa.ready(true); // Same-value acknowledgement is part of the contract.
    await pb.ready(true);
    const unready = await pb.ready(false);
    if (readyRejection) {
        check(
            Object.values(unready.payload.lobby.playerList).some((p) => !p.ready),
            "Readiness rejection probe requires an authoritative unready player"
        );
        const mark = pa.events.length;
        negativeStartEnabled = true;
        pa.send("start");
        await pa.wait((e) => e.type === "REQUEST_ERROR" && e.payload.command === "start" && e.payload.code === "PLAYERS_NOT_READY", mark);
        console.log("PASS optional START rejection: PLAYERS_NOT_READY (parent must supply a keyless backend)");
    }
    let after = pb.events.length;
    pb.send("update_lobby_settings", { conf: { ...conf, name: "unauthorized" } });
    await pb.wait((e) => e.type === "REQUEST_ERROR" && e.payload.command === "update_lobby_settings" && e.payload.code === "NOT_ADMIN", after);
    after = pa.events.length;
    pa.send("setReady");
    await pa.wait((e) => e.type === "REQUEST_ERROR" && e.payload.command === "setReady" && e.payload.code === "INVALID_READY", after);
    const cosmetic = { ...conf, name: `${conf.name}-title` };
    for (let update = 0; update < 2; update++) {
        after = pa.events.length;
        pa.send("update_lobby_settings", { conf: cosmetic });
        const unchanged = await pa.wait((e) => e.type === "UPDATED_LOBBY" && e.payload.lobby.conf.name === cosmetic.name, after);
        check(unchanged.payload.lobby.playerList[a.id].ready === true, "Title-only/no-op settings incorrectly cleared readiness");
    }
    const changed = { ...conf, name: `${conf.name}-updated`, numRounds: 2, roundTime: 45 };
    const marks = [pa, pb, pc].map((p) => p.events.length);
    pa.send("update_lobby_settings", { conf: changed });
    const updates = await Promise.all([pa, pb, pc].map((p, i) => p.wait((e) => e.type === "UPDATED_LOBBY" && e.payload.lobby.conf.name === changed.name, marks[i])));
    check(
        updates.every((e) => e.seq === updates[0].seq),
        "A single broadcast has different sequence numbers for different peers"
    );
    for (const update of updates) {
        waitingSnapshot(update.payload.lobby, 3);
        check(
            update.payload.lobby.playerList[a.id].ready === true && update.payload.lobby.playerList[b.id].ready === false && update.payload.lobby.playerList[c.id].ready === false,
            "Material settings changed existing readiness"
        );
        check(update.payload.lobby.conf.numRounds === 2 && update.payload.lobby.conf.roundTime === 45, "Settings snapshot omitted committed changes");
    }
    check(joined.conf.numRounds === 1 && joined.conf.roundTime === 30, "A previously decoded snapshot changed retroactively");
    console.log("PASS duplicate rejection/no takeover, ready acknowledgement/reset, settings authority and shared event ordering");

    stage = "region catalog and authoritative scoring";
    const catalog = await http(backend, "/countryCatalog");
    const available = await http(backend, "/countryList");
    check(
        sameCountries(
            available,
            catalog.countries.map((country) => country.code)
        ),
        "Catalog differs from actual playable countries"
    );
    check(
        sameCountries(
            available,
            catalog.continents.flatMap((continent) => continent.codes)
        ),
        "Continents do not cover the available catalog"
    );
    check(created.conf.scoringMode === "auto", "A new lobby must default to automatic scoring");
    const configure = async (patch) => {
        const mark = pa.events.length;
        pa.send("update_lobby_settings", { conf: patch });
        const event = await pa.wait((entry) => entry.type === "UPDATED_LOBBY", mark);
        const current = event.payload.lobby;
        check(current.playerList[a.id].ready && !current.playerList[b.id].ready && !current.playerList[c.id].ready, "Region/scoring changes altered existing ready status");
        return current.conf;
    };
    const scales = new Map();
    for (const codes of [[], catalog.continents.find((continent) => continent.id === "EU").codes, ["SI"], ["LU"], ["US"], ["NZ"], ["SI", "NZ"], available]) {
        const current = await configure({ ccList: codes, scoringMode: "auto", scoreScaleKm: 1e20 });
        const expected = regionScoreScale(codes, catalog);
        check(
            current.scoringMode === "auto" && Math.abs(current.scoreScaleKm - expected) < 0.000001,
            "Server scoring scale differs from the client preview or trusted a supplied override"
        );
        scales.set(codes.join(","), current.scoreScaleKm);
    }
    check(scales.get("SI") < scales.get("US") && scales.get("LU") < scales.get("SI"), "Small-country scoring is not adapted to geographic extent");
    check(scales.get("SI,NZ") > scales.get("SI") && scales.get("SI,NZ") > scales.get("NZ"), "Distant Custom countries must account for geographic separation");
    const deduplicated = await configure({ ccList: ["SI", "SI"], scoringMode: "auto" });
    check(deduplicated.ccList.length === 1 && Math.abs(deduplicated.scoreScaleKm - scales.get("SI")) < 0.000001, "Duplicate country codes distorted the region or score scale");
    const manual = await configure({ scoringMode: "manual", scoreFactor: 50 });
    check(manual.scoringMode === "manual" && manual.scoreFactor === 50, "Explicit Advanced manual curve was not preserved");
    const cosmeticManual = await configure({ name: changed.name });
    check(cosmeticManual.scoringMode === "manual" && cosmeticManual.scoreFactor === 50, "An unrelated partial update reset the manual curve");
    const reset = await configure({ ccList: ["LU"] });
    check(reset.scoringMode === "auto" && Math.abs(reset.scoreScaleKm - scales.get("LU")) < 0.000001, "A changed region did not reset to automatic scoring");
    const beforeInvalid = JSON.stringify(reset);
    for (const invalid of [{ scoringMode: "invalid" }, { ccList: ["XX"] }, { scoringMode: "manual", scoreFactor: 501 }]) {
        const mark = pa.events.length;
        pa.send("update_lobby_settings", { conf: { ...invalid, name: "must-not-be-applied" } });
        await pa.wait((event) => event.type === "REQUEST_ERROR" && event.payload.command === "update_lobby_settings", mark);
        const list = await http(backend, "/lobby");
        check(JSON.stringify(list[created.ID].conf) === beforeInvalid, "Rejected region/scoring input partially changed the lobby");
    }
    const countryBattle = await configure({ mode: 2 });
    check(countryBattle.mode === 2 && !countryBattle.scoreFactor && !countryBattle.scoreScaleKm, "Country Battle inherited a distance-scoring curve");
    await configure({ ...changed, scoringMode: "auto" });
    console.log(
        "PASS country catalog/continents, regional preview parity, small/distant-country scaling, untrusted derived values, manual override/reset and atomic validation; zero starts"
    );

    stage = "host handoff and recovery";
    await pa.ready(true);
    await pb.ready(true);
    await pc.ready(true);
    after = pb.events.length;
    await pa.loss();
    const lost = await pb.wait((e) => e.type === "LEFT_LOBBY" && e.payload.user === a.id && e.payload.lobby.playerList[a.id]?.connected === false, after);
    check(lost.payload.lobby.admin === b.id && lost.payload.lobby.numPlayers === 3, "Loss did not retain the host lease or select the earliest connected successor");
    check(
        !lost.payload.lobby.playerList[a.id].ready && lost.payload.lobby.playerList[b.id].ready && lost.payload.lobby.playerList[c.id].ready,
        "Transient loss must clear only the affected member's readiness"
    );
    const recovered = new Peer(backend, created.ID, a);
    const snapshot = await recovered.join(true);
    waitingSnapshot(snapshot, 3);
    check(
        snapshot.admin === b.id && snapshot.playerList[a.id].color === originalColor && snapshot.playerList[a.id].connected,
        "Recovery changed identity/color or reclaimed host ownership"
    );
    check(!snapshot.playerList[a.id].ready && snapshot.playerList[b.id].ready && snapshot.playerList[c.id].ready, "Recovery must not acknowledge readiness or clear other members");
    await recovered.ready(true);
    console.log("PASS graceful transport close, retained membership, deterministic handoff and full ordered recovery");

    stage = "expiry and last-lease disposal (real 30-second grace)";
    // Run last-member expiry alongside retained-member expiry; do not shorten server timers.
    const empty = await http(backend, "/lobby", { method: "POST", token: d.token, body: conf });
    const pd = new Peer(backend, empty.ID, d);
    await pd.join();
    after = pb.events.length;
    const beforeLoss = performance.now();
    await Promise.all([recovered.loss(), pd.loss()]);
    await pb.wait((e) => e.type === "LEFT_LOBBY" && e.payload.user === a.id && e.payload.lobby.playerList[a.id]?.connected === false, after);
    const retained = await listed(backend, empty.ID, (lobby) => lobby?.playerList[d.id]?.connected === false);
    waitingSnapshot(retained, 1);
    check(retained.admin === "" && !retained.playerList[d.id].ready, "A lobby with no live members must retain its lease but have no host");
    const [expired] = await Promise.all([
        pb.wait((e) => e.type === "LEFT_LOBBY" && e.payload.user === a.id && !e.payload.lobby.playerList[a.id], after, GRACE + TIMEOUT),
        listed(backend, empty.ID, (lobby) => !lobby, GRACE + TIMEOUT).then(() => {
            check(performance.now() - beforeLoss >= GRACE - 500, "Last-member lobby was disposed before the 30-second grace");
        }),
    ]);
    check(performance.now() - beforeLoss >= GRACE - 500, "Lease expired earlier than the 30-second server grace");
    waitingSnapshot(expired.payload.lobby, 2);
    check(expired.payload.lobby.admin === b.id, "Expiry changed a still-connected host");
    await denied(backend, empty.ID, d, 400, "LOBBY_NOT_FOUND");
    console.log("PASS retained-member expiry and last-lease lobby disposal using real grace timers");

    stage = "intentional leave and disposal";
    after = pb.events.length;
    await pc.leave();
    const left = await pb.wait((e) => e.type === "LEFT_LOBBY" && e.payload.user === c.id && !e.payload.lobby.playerList[c.id], after);
    waitingSnapshot(left.payload.lobby, 1);
    await pb.ready(false); // A departed peer did not close or steal this socket.
    await pb.leave();
    await listed(backend, created.ID, (lobby) => !lobby);
    await denied(backend, created.ID, a, 400, "LOBBY_NOT_FOUND");
    for (const peer of peers) check(!peer.fault && peer.closed, "A peer faulted or remained open after cleanup");
    console.log("PASS explicit leave removes membership immediately, closes only its peer and disposes the final lobby");
    console.log("PASS keyless socket integration complete; paid round starts=0, Maps loads=0");
}

try {
    check(process.argv.length === 2, "Usage: node tools/socket-smoke.mjs (configuration is environment-only)");
    await run();
} catch (error) {
    // Never print arbitrary exception messages/stacks; fetch/WebSocket errors may carry credentials.
    console.error(`FAIL ${stage}: ${error instanceof CheckFailure ? error.message : "Unexpected runtime failure (details withheld)"}`);
    process.exitCode = 1;
} finally {
    await Promise.all(
        [...peers].map(async (peer) => {
            try {
                await peer.leave();
            } catch {
                if (peer.ws.readyState === WebSocket.OPEN) peer.ws.close(1000, "local integration cleanup");
            }
        })
    );
}
