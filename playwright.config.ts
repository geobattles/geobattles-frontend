import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { settings, privateArtifacts, assertRunnerArguments, safeReporterPath, mapsTestFiles } from "./e2e/support/safety.mjs";

assertRunnerArguments();
const env = settings(true);
const root = fileURLToPath(new URL(".", import.meta.url));
const outputDir = privateArtifacts(root);
// This flag suppresses DOM snapshots only. Native reporter/teardown hooks remove
// raw error-context (including messages, call logs and source) after each test.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    forbidOnly: true,
    workers: 1,
    retries: 0, // A retry could spend another round/map allocation.
    repeatEach: 1,
    maxFailures: 1,
    timeout: 90_000,
    globalTimeout: 360_000,
    expect: { timeout: 12_000 },
    reporter: [[safeReporterPath]],
    outputDir,
    metadata: { privateInvocation: process.env.GEOBATTLES_E2E_PRIVATE_INVOCATION },
    globalSetup: "./e2e/support/global-setup.ts",
    globalTeardown: "./e2e/support/global-teardown.ts",
    // No webServer: starting the backend can migrate a database. Parent owns startup.
    use: {
        baseURL: env.frontend,
        actionTimeout: 12_000,
        navigationTimeout: 25_000,
        serviceWorkers: "block", // No stale PWA cache or network interception bypass.
        acceptDownloads: false,
        ignoreHTTPSErrors: false,
        trace: "off",
        video: "off",
        screenshot: "off", // The fixture captures masked screenshots on failure only.
    },
    // MAPS=1 selects exactly one serial Chromium project, never a browser matrix.
    projects: env.maps
        ? [{ name: "maps", use: { browserName: "chromium" }, testMatch: mapsTestFiles.map((file) => `**/${file}`), timeout: 180_000 }]
        : [
              { name: "keyless-chromium", use: { browserName: "chromium" }, testMatch: "**/*.keyless.spec.ts" },
              { name: "keyless-firefox", use: { browserName: "firefox" }, testMatch: "**/*.keyless.spec.ts" },
          ],
});
