import { mkdtempSync, chmodSync, realpathSync, lstatSync, readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute, sep, resolve, dirname, basename } from "node:path";

export class CheckFailure extends Error {}

// Actual scenario actions: round 1 twice is initial + replay; 1,2 is one match.
// Each recovery can authorize another map + panorama, even when DOM is reused.
export const mapsScenarios = {
    "game.maps.spec.ts": { players: 2, rounds: [1, 1], recoveries: ["PLAYING"], readinessRejections: 2 },
    "multiround.maps.spec.ts": { players: 3, rounds: [1, 2], recoveries: ["MID-ROUND"], readinessRejections: 0 },
};

export function plannedAllocation(scenarios = Object.values(mapsScenarios)) {
    return scenarios.reduce(
        (total, scenario) => ({
            starts: total.starts + scenario.rounds.length,
            grants: total.grants + 2 * (scenario.players * scenario.rounds.length + scenario.recoveries.length),
            readinessRejections: total.readinessRejections + scenario.readinessRejections,
            commands: total.commands + scenario.rounds.length + scenario.readinessRejections,
        }),
        { starts: 0, grants: 0, readinessRejections: 0, commands: 0 }
    );
}

// A smaller explicit plan permits a reconciled continuation; CLI filtering alone
// never reduces reservations or resets a previous invocation's owner budget.
const mapsScope = process.env.GEOBATTLES_E2E_MAPS_SCOPE ?? "all";
check(["all", "recovery"].includes(mapsScope), "Maps scope must be all or recovery");
export const mapsTestFiles = mapsScope === "recovery" ? ["game.maps.spec.ts"] : Object.keys(mapsScenarios);
export const mapsAllocation = plannedAllocation(mapsTestFiles.map((file) => mapsScenarios[file]));

/** Never include server bodies, tokens, URLs or arbitrary errors in labels. */
export function check(condition, label) {
    if (!condition) throw new CheckFailure(label);
}

export function localEndpoint(value, name) {
    check(typeof value === "string" && value.length > 0, `${name} must be explicitly set`);
    // Validate the source spelling before URL canonicalization: decimal/hex IP
    // aliases and credentials must not be silently normalized into the allowlist.
    check(/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):[1-9][0-9]{0,4}\/?$/.test(value), `${name} must be an explicit literal loopback HTTP origin`);
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new CheckFailure(`${name} is not a valid URL`);
    }
    check(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), `${name} must use HTTP on a literal loopback host`);
    check(
        !!url.port && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash,
        `${name} requires an explicit port and no credentials, path, query or fragment`
    );
    return url.origin;
}

export function settings(browser = false) {
    check(process.env.GEOBATTLES_E2E_TARGET === "isolated-local", "Set GEOBATTLES_E2E_TARGET=isolated-local only for an approved isolated development runtime");
    check([undefined, "0", "1"].includes(process.env.GEOBATTLES_E2E_MAPS), "GEOBATTLES_E2E_MAPS accepts only 0 or 1");
    const backend = backendEndpoint(process.env.GEOBATTLES_API_URL, "GEOBATTLES_API_URL");
    const backendOrigin = new URL(backend).origin;
    const frontend = browser ? localEndpoint(process.env.GEOBATTLES_BASE_URL, "GEOBATTLES_BASE_URL") : undefined;
    const maps = process.env.GEOBATTLES_E2E_MAPS === "1";
    check(maps || mapsScope === "all", "A focused Maps scope requires explicit Maps mode");
    check([undefined, "0", "1"].includes(process.env.GEOBATTLES_E2E_READY_REJECTION), "GEOBATTLES_E2E_READY_REJECTION accepts only 0 or 1");
    const readyRejection = process.env.GEOBATTLES_E2E_READY_REJECTION === "1";
    check(!(maps && readyRejection), "The optional keyless readiness rejection probe must not be enabled in Maps mode");
    // These are this invocation's allocation, not permission to reuse another run's budget.
    const rounds = Number(process.env.GEOBATTLES_E2E_ROUND_BUDGET ?? mapsAllocation.starts);
    const loads = Number(process.env.GEOBATTLES_E2E_MAP_LOAD_BUDGET ?? mapsAllocation.grants);
    check(Number.isInteger(rounds) && rounds >= 1 && rounds <= 4, "Round budget must be an integer from 1 through the fresh owner ceiling of 4");
    check(Number.isInteger(loads) && loads >= 1 && loads <= 24, "Map load budget must be an integer from 1 through the owner ceiling of 24");
    check(
        !maps || (rounds >= mapsAllocation.starts && loads >= mapsAllocation.grants),
        "Maps allocation must cover every action in the explicit scope; CLI filtering does not reset the shared budget"
    );
    return { backend, backendOrigin, frontend, maps, rounds, loads, readyRejection };
}

/** Backend base only: preserve the origin validator and allow exactly /api. */
export function backendEndpoint(value, name) {
    check(typeof value === "string" && value.length > 0, `${name} must be explicitly set`);
    // Inspect the literal input BEFORE URL parsing can normalize encoded/dot paths.
    const match = /^(http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):[1-9][0-9]{0,4})(\/api|\/)?$/.exec(value);
    check(!!match, `${name} must be a literal loopback HTTP origin with no prefix or exactly /api`);
    return `${localEndpoint(match[1], name)}${match[2] === "/api" ? "/api" : ""}`;
}

export function socketURL(backend, lobbyId) {
    check(typeof lobbyId === "string" && /^[A-Z0-9]{4}$/.test(lobbyId), "Server lobby ID does not match the actual four-character code contract");
    const url = new URL(`${backendEndpoint(backend, "Socket backend")}/lobbySocket`);
    url.protocol = "ws:";
    url.searchParams.set("id", lobbyId);
    return url.href;
}

const repoRoot = realpathSync(fileURLToPath(new URL("../../", import.meta.url)));
export const safeReporterPath = fileURLToPath(new URL("./safe-reporter.ts", import.meta.url));
const setupPath = fileURLToPath(new URL("./global-setup.ts", import.meta.url));
const teardownPath = fileURLToPath(new URL("./global-teardown.ts", import.meta.url));
const invocationEnv = "GEOBATTLES_E2E_PRIVATE_INVOCATION";

const outside = (root, path) => {
    const rel = relative(root, path);
    return rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel);
};

// Reject before Playwright instantiates *any* reporter or removes output dirs.
// Global setup and the fixture also validate the final public FullConfig.
export function assertRunnerArguments(argv = process.argv) {
    const forbidden = /^(?:--(?:output|reporter|add-reporter|debug|ui(?:-host|-port)?|trace|headed|last-failed-file|update-snapshots|update-source-method)(?:=|$)|-u(?:=|$))/;
    check(!argv.some((arg) => forbidden.test(arg)), "Runner privacy policy rejects output, reporter, debug and snapshot overrides");
    for (const key of ["PW_TEST_REPORTER", "PWDEBUG", "DEBUG", "PWTEST_WATCH", "PLAYWRIGHT_LAST_RUN_OUTPUT_FILE"]) {
        check(!process.env[key], "Runner privacy policy rejects reporter, debug and output environment overrides");
    }
}

function noSymlinkPath(path) {
    check(isAbsolute(path) && resolve(path) === path, "Private evidence path must be canonical and absolute");
    let current = path;
    while (true) {
        check(!lstatSync(current).isSymbolicLink(), "Private evidence paths must not traverse symlinks");
        const parent = dirname(current);
        if (parent === current) break;
        current = parent;
    }
}

function validateInvocation(record) {
    check(record?.version === 1 && typeof record.parent === "string" && /^[a-f0-9-]{36}$/.test(record.nonce), "Invalid private invocation metadata");
    check(record.uid === process.getuid() && (record.pid === process.pid || record.pid === process.ppid), "Private invocation must belong to this runner and its workers");
    check(record.repo === repoRoot && outside(repoRoot, record.parent), "Private invocation must be outside this checkout");
    check(/^geobattles-e2e-[A-Za-z0-9]+$/.test(basename(record.parent)), "Invalid private invocation parent");
    noSymlinkPath(record.parent);
    const stat = lstatSync(record.parent);
    check(stat.isDirectory() && stat.uid === process.getuid() && (stat.mode & 0o777) === 0o700, "Private invocation parent must be owned by current UID and mode0700");
    check(!lstatSync(join(record.parent, ".privacy-failed"), { throwIfNoEntry: false }), "An earlier privacy failure halted this invocation");
    const marker = join(record.parent, ".invocation.json");
    const markerStat = lstatSync(marker);
    check(
        markerStat.isFile() && markerStat.nlink === 1 && markerStat.uid === process.getuid() && (markerStat.mode & 0o777) === 0o600,
        "Private invocation marker must be a regular owned mode0600 file"
    );
    check(readFileSync(marker, "utf8") === JSON.stringify(record), "Private invocation marker does not match this run");
    const output = join(record.parent, "output");
    const outputStat = lstatSync(output, { throwIfNoEntry: false });
    if (outputStat) {
        check(
            outputStat.isDirectory() && !outputStat.isSymbolicLink() && outputStat.uid === process.getuid() && (outputStat.mode & 0o777) === 0o700,
            "Runner output must be an owned mode0700 nested directory"
        );
    }
    return { ...record, output };
}

export function privateInvocation() {
    try {
        return validateInvocation(JSON.parse(process.env[invocationEnv] ?? "null"));
    } catch {
        throw new CheckFailure("Private invocation metadata/path/ownership validation failed");
    }
}

/** One mode0700 parent per invocation; only its nested output is runner-owned. */
export function privateArtifacts(root) {
    assertRunnerArguments();
    check(realpathSync(root) === repoRoot, "Private evidence must use the actual checkout root");
    // Child configs inherit this identity. Do not allocate another worker root.
    process.umask(0o077);
    if (!process.env[invocationEnv]) {
        const base = realpathSync(tmpdir());
        check(outside(repoRoot, base), "TMPDIR must be outside the repository for private E2E artifacts");
        noSymlinkPath(base);
        const parent = mkdtempSync(join(base, "geobattles-e2e-"));
        chmodSync(parent, 0o700);
        const record = { version: 1, parent, nonce: randomUUID(), pid: process.pid, uid: process.getuid(), repo: repoRoot };
        writeFileSync(join(parent, ".invocation.json"), JSON.stringify(record), { mode: 0o600, flag: "wx" });
        process.env[invocationEnv] = JSON.stringify(record);
    }
    return privateInvocation().output;
}

/** Public FullConfig guard. Call before any application or credential activity. */
export function assertRunnerPolicy(config) {
    assertRunnerArguments(config.argv ?? process.argv);
    const invocation = privateInvocation();
    check(config.metadata?.privateInvocation === process.env[invocationEnv], "Final config must preserve this invocation identity");
    check(
        config.reporter?.length === 1 && config.reporter[0][0] === safeReporterPath && Object.keys(config.reporter[0][1] ?? {}).length === 0,
        "Only the exact SafeReporter without options is allowed"
    );
    check(config.globalSetup === setupPath && config.globalTeardown === teardownPath, "Native privacy setup and teardown must remain installed");
    check(config.workers === 1 && config.maxFailures === 1 && config.shard === null && !config.fullyParallel, "Runner must remain serial, unsharded and stop at first failure");
    check(config.projects?.length > 0, "At least one approved browser project is required");
    for (const project of config.projects) {
        check(project.outputDir === invocation.output, "Final output must be exactly the nested private invocation output");
        check(project.retries === 0 && project.repeatEach === 1, "Retries and repetition are forbidden");
        check(project.use.trace === "off" && project.use.video === "off" && project.use.screenshot === "off", "Raw automatic artifacts are forbidden");
        check(!project.use.recordHar && !project.use.recordVideo && !project.use.storageState, "HAR, raw video and storage state are forbidden");
    }
    check(process.env.PLAYWRIGHT_NO_COPY_PROMPT === "1", "Automatic unmasked DOM snapshots must stay disabled");
    if (process.env.GEOBATTLES_E2E_MAPS === "1") {
        check(
            config.projects.length === 1 && config.projects[0].name === "maps" && config.projects[0].use.browserName === "chromium",
            "Paid execution allows only the single approved Chromium project"
        );
    }
    return invocation;
}

export function preparePrivateOutput(config) {
    const invocation = assertRunnerPolicy(config);
    mkdirSync(invocation.output, { mode: 0o700, recursive: true });
    assertRunnerPolicy(config);
}

// Strict retention, not regex redaction of arbitrary error text: runner-owned
// messages/call logs/source/DOM, snapshots, traces and unknown files are removed.
// Native error-context writes can exist transiently inside the private parent.
export function sanitizeRunnerArtifacts(config) {
    const invocation = assertRunnerPolicy(config);
    const retained = [];
    let removed = 0;
    let errorContextsRemoved = 0;
    const walk = (directory) => {
        const stat = lstatSync(directory, { throwIfNoEntry: false });
        if (!stat) return;
        check(stat.isDirectory() && stat.uid === process.getuid() && !stat.isSymbolicLink(), "Evidence directory must be owned and not a symlink");
        chmodSync(directory, 0o700);
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            const file = lstatSync(path);
            if (file.isDirectory() && !file.isSymbolicLink()) {
                walk(path);
            } else if (
                file.isFile() &&
                file.nlink === 1 &&
                file.uid === process.getuid() &&
                /^(?:sanitized-browser-diagnostics(?:-[a-f0-9]+)?\.json|actor-[0-9]+-failure(?:-[a-f0-9]+)?\.png)$/.test(entry.name)
            ) {
                chmodSync(path, 0o600);
                retained.push(path);
            } else {
                // Unlink symlinks without following them, including stale artifacts.
                rmSync(path, { force: true, recursive: false });
                removed++;
                if (entry.name === "error-context.md") errorContextsRemoved++;
            }
        }
    };
    walk(invocation.output);
    const reportPath = join(invocation.parent, "runner-privacy.json");
    const reportStat = lstatSync(reportPath, { throwIfNoEntry: false });
    let prior = { removed: 0, errorContextsRemoved: 0 };
    if (reportStat) {
        check(
            reportStat.isFile() && reportStat.nlink === 1 && reportStat.uid === process.getuid() && (reportStat.mode & 0o777) === 0o600,
            "Privacy report must be a regular owned mode0600 file"
        );
        prior = JSON.parse(readFileSync(reportPath, "utf8"));
        check(Number.isSafeInteger(prior.removed) && Number.isSafeInteger(prior.errorContextsRemoved), "Privacy report counters must be integers");
    }
    writeFileSync(
        reportPath,
        JSON.stringify({ removed: prior.removed + removed, errorContextsRemoved: prior.errorContextsRemoved + errorContextsRemoved, retainedFiles: retained.length }),
        { mode: 0o600 }
    );
    return retained.sort();
}

/** HTTP/provider classification only; no user-controlled path/query is emitted. */
export function resourceKind(value, frontend, backend) {
    try {
        const url = new URL(value);
        const api = new URL(backend);
        const prefix = api.pathname === "/" ? "" : api.pathname;
        if (url.origin === api.origin && (!prefix || url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
            const path = url.pathname.slice(prefix.length);
            const known = { "/auth/register/guest": "guest", "/auth/refresh": "refresh", "/lobby": "lobby", "/countryList": "countries", "/lobbySocket": "lobby-socket" }[path];
            if (known) return known;
            if (path.startsWith("/auth/")) return "auth-other";
            if (prefix || api.origin !== frontend) return "backend-other";
        }
        if (url.origin === frontend) return "frontend";
        if (isMapsURL(value)) return "google-maps";
    } catch {
        // Deliberately do not serialize the rejected value.
    }
    return "external-other";
}

// Native SDKs cancel obsolete image loads while replacing visible tiles. This
// is not a transport/provider failure. Never excuse script/XHR/auth/HTTP errors.
export function isMapsImageCancellation(url, resourceType, error, authorized) {
    return authorized && resourceType === "image" && error === "net::ERR_ABORTED" && isMapsURL(url);
}

export function isMapsURL(value) {
    try {
        const url = new URL(value);
        return (
            url.protocol === "https:" &&
            ["googleapis.com", "gstatic.com", "google.com", "ggpht.com", "googleusercontent.com"].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
        );
    } catch {
        return false;
    }
}
