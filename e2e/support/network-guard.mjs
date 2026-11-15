import http from "node:http";
import net from "node:net";
import { localEndpoint } from "./safety.mjs";

// Deliberately finite: no suffix wildcards, HTTP provider access, arbitrary ports,
// destination rewriting, TLS interception, or process/global proxy settings.
const GOOGLE_TLS_HOSTS = new Set([
    "maps.googleapis.com",
    "maps.gstatic.com",
    "maps.google.com",
    "streetviewpixels-pa.googleapis.com",
    "tile.googleapis.com",
    "lh3.googleusercontent.com",
    "geo0.ggpht.com",
    "geo1.ggpht.com",
    "geo2.ggpht.com",
    "geo3.ggpht.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
]);
const PROXY_HEADERS = new Set(["proxy-authorization", "proxy-connection"]);
const headers = (raw) => {
    const result = [];
    for (let i = 0; i < raw.length; i += 2) if (!PROXY_HEADERS.has(raw[i].toLowerCase())) result.push(raw[i], raw[i + 1]);
    return result;
};

/** One loopback listener per BrowserRun; frontend/backend MUST be validated origins,
 * not API bases. A /api prefix changes request paths, never the dial allowlist. */
export async function startNetworkGuard({ frontend, backend, paid = false, isHalted = () => false, onViolation = (_category) => {} }) {
    const local = new Map(
        [localEndpoint(frontend, "Guard frontend"), localEndpoint(backend, "Guard backend")].map((origin) => {
            const url = new URL(origin);
            return [url.host, { host: url.hostname === "[::1]" ? "::1" : "127.0.0.1", port: Number(url.port) }];
        })
    );
    const counts = {
        http: 0,
        upgrade: 0,
        connectLocal: 0,
        connectGoogle: 0,
        deniedDestination: 0,
        deniedHalted: 0,
        invalid: 0,
        upstreamError: 0,
        httpFailure: 0,
        dialFailure: 0,
        tunnelReset: 0,
        tunnelFailure: 0,
    };
    const sockets = new Set();
    const externalSockets = new Set();
    const reported = new Set();
    let halted = false;
    let closing;
    const stopped = () => halted || isHalted();
    const note = (category) => {
        counts[category]++;
        if (!reported.has(category)) {
            reported.add(category);
            onViolation(category); // Fixed category only; never a request/error/URL.
        }
    };
    const track = (socket, external = false) => {
        sockets.add(socket);
        if (external) externalSockets.add(socket);
        socket.on("close", () => {
            sockets.delete(socket);
            externalSockets.delete(socket);
        });
        socket.on("error", () => {});
        return socket;
    };
    const deny = (response, category = "deniedDestination", status = 403) => {
        note(category);
        if (response instanceof http.ServerResponse) {
            if (response.headersSent) return response.destroy();
            response.writeHead(status, { "Content-Length": "0", Connection: "close" });
            response.end();
        } else if (!response.destroyed) response.end(`HTTP/1.1 ${status} Denied\r\nContent-Length: 0\r\nConnection: close\r\n\r\n`);
    };
    const destination = (req, upgrade = false) => {
        // Match source spelling before URL normalization. This also preserves the
        // original path/query bytes, and rejects credentials, aliases and fragments.
        const match = /^(http|ws):\/\/(localhost|127\.0\.0\.1|\[::1\]):([1-9][0-9]{0,4})(\/[^#\s]*)?$/.exec(req.url ?? "");
        if (!match || (!upgrade && match[1] !== "http")) return null;
        const authority = `${match[2]}:${match[3]}`;
        const target = local.get(authority);
        if (!target || req.headers.host !== authority) return null;
        if (upgrade && (req.method !== "GET" || req.headers.upgrade?.toLowerCase() !== "websocket")) return null;
        return { ...target, path: match[4] || "/" };
    };
    const server = http.createServer({ maxHeaderSize: 16 * 1024 }, (req, res) => {
        const target = destination(req);
        if (!target) return deny(res);
        counts.http++;
        const upstream = http.request({ ...target, method: req.method, headers: headers(req.rawHeaders), agent: false, setHost: false }, (response) => {
            res.writeHead(response.statusCode, response.statusMessage, headers(response.rawHeaders));
            response.on("error", () => res.destroy());
            response.pipe(res); // Native streamed status/redirect/body; no fetch/fulfill.
        });
        upstream.on("socket", (socket) => track(socket));
        upstream.setTimeout(30_000, () => upstream.destroy());
        upstream.on("error", () => {
            // Browser cancellation/offline/teardown must not manufacture a failure.
            if (!req.aborted && !res.destroyed && !closing) {
                counts.httpFailure++;
                deny(res, "upstreamError", 502);
            }
        });
        req.on("aborted", () => upstream.destroy());
        req.on("error", () => upstream.destroy());
        res.on("close", () => upstream.destroy());
        req.pipe(upstream);
    });
    server.on("connection", (socket) => track(socket));
    server.on("clientError", (_error, socket) => deny(socket, "invalid", 400));
    server.headersTimeout = 10_000;
    server.maxConnections = 256;

    const pipe = (client, target, head, initial, external = false) => {
        // This is the ONLY raw TCP dial; all destinations are checked before it.
        const remote = track(net.connect({ host: target.host, port: target.port }), external);
        let established = false;
        remote.setTimeout(10_000, () => remote.destroy());
        remote.once("connect", () => {
            if (closing || client.destroyed || (external && stopped())) return remote.destroy();
            established = true;
            remote.setTimeout(0);
            initial(remote);
            if (head.length) remote.write(head);
            client.pipe(remote).pipe(client); // TLS/WS frames remain opaque/native.
        });
        remote.on("error", (error) => {
            if (client.destroyed || closing) return;
            if (!established) {
                counts.dialFailure++;
                return deny(client, "upstreamError", 502);
            }
            if (error.code === "ECONNRESET" || error.code === "EPIPE") {
                // A reset after an established tunnel is an endpoint transport
                // event (including intentional WebSocket leave/offline), not a
                // destination-boundary violation. Propagate it natively; the
                // browser/app assertions still observe failed requests or loss.
                counts.tunnelReset++;
                client.destroy();
                return;
            }
            counts.tunnelFailure++;
            note("upstreamError");
            client.destroy(); // Never inject an HTTP error into established TLS/WS bytes.
        });
        remote.on("close", () => client.destroy());
        client.on("close", () => remote.destroy());
        client.on("error", () => remote.destroy());
    };
    server.on("upgrade", (req, client, head) => {
        const target = destination(req, true);
        if (!target) return deny(client);
        counts.upgrade++;
        pipe(client, target, head, (remote) => {
            const raw = headers(req.rawHeaders);
            let opening = `${req.method} ${target.path} HTTP/${req.httpVersion}\r\n`;
            for (let i = 0; i < raw.length; i += 2) opening += `${raw[i]}: ${raw[i + 1]}\r\n`;
            remote.write(`${opening}\r\n`);
        });
    });
    server.on("connect", (req, client, head) => {
        // Chromium may use CONNECT even for plaintext ws://; do not assume TLS.
        const authority = req.url ?? "";
        let target = local.get(authority);
        const external = !target;
        if (external) {
            const match = /^([a-z0-9.-]+):443$/.exec(authority);
            if (!match || !GOOGLE_TLS_HOSTS.has(match[1]) || paid !== true) return deny(client);
            if (stopped()) return deny(client, "deniedHalted");
            target = { host: match[1], port: 443 };
            counts.connectGoogle++;
        } else counts.connectLocal++;
        pipe(client, target, head, () => client.write("HTTP/1.1 200 Connection Established\r\n\r\n"), external);
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            server.removeListener("error", reject);
            resolve();
        });
    });
    server.on("error", () => note("upstreamError"));
    return {
        server: `http://127.0.0.1:${server.address().port}`,
        counts,
        halt() {
            halted = true;
            // No reuse of an already-open external TLS tunnel after sticky halt.
            for (const socket of externalSockets) socket.destroy();
        },
        close() {
            if (!closing) {
                halted = true;
                closing = new Promise((resolve) => server.close(resolve));
                for (const socket of sockets) socket.destroy();
            }
            return closing;
        },
    };
}
