import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: ".",
    testMatch: "two-rounds.spec.ts",
    workers: 1,
    retries: 0,
    timeout: 120_000,
    expect: { timeout: 12_000 },
    reporter: "list",
    use: { browserName: "chromium", trace: "off", video: "off", screenshot: "off" },
});
