import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestError, TestResult } from "@playwright/test/reporter";
import { lstatSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { assertRunnerPolicy, sanitizeRunnerArtifacts } from "./safety.mjs";

// Fixed categories only. No arbitrary assertion/title/message/source values.
const failureCategory = (error: TestError) =>
    /timeout|timed out/i.test(error.message ?? "") ? "timeout" : /expect\(|assert/i.test(error.message ?? "") ? "assertion" : "runner-or-scenario-failure";
export default class SafeReporter implements Reporter {
    private config?: FullConfig;
    private cleanupFailed = false;
    private parent?: string;
    private printedPaths = new Set<string>();
    printsToStdio() {
        return true;
    }
    onBegin(config: FullConfig, suite: Suite) {
        this.config = config;
        const invocation = assertRunnerPolicy(config);
        this.parent = invocation.parent;
        console.log(`Collected ${suite.allTests().length} browser scenarios`);
        console.log(`Private invocation parent: ${invocation.parent} (mode0700)`);
        console.log(`Runner nested output: ${invocation.output}`);
    }
    private clean() {
        if (!this.config) return;
        try {
            const paths = sanitizeRunnerArtifacts(this.config);
            for (const path of paths) {
                const mode = (lstatSync(path).mode & 0o777).toString(8).padStart(4, "0");
                if (!this.printedPaths.has(path)) {
                    console.log(`Private evidence (mode${mode}): ${path}`);
                    this.printedPaths.add(path);
                }
            }
        } catch {
            this.cleanupFailed = true;
            if (this.parent) {
                // A worker's first policy guard refuses the sticky halt marker.
                try {
                    writeFileSync(join(this.parent, ".privacy-failed"), "halted", { mode: 0o600, flag: "wx" });
                } catch {
                    /* Already halted or inaccessible. */
                }
            }
            console.error("PRIVACY FAILURE: private artifact cleanup/validation failed; no further execution is authorized");
        }
    }
    onTestEnd(_test: TestCase, result: TestResult) {
        this.clean();
        console.log(`Scenario: ${result.status.toUpperCase()}`);
        if (result.status !== "passed" && result.status !== "skipped") {
            for (const error of result.errors) {
                console.log(`Reason category: ${failureCategory(error)}`);
                const location = error.location;
                if (
                    location &&
                    ["lobby.keyless.spec.ts", "regions.keyless.spec.ts", "game.maps.spec.ts", "multiround.maps.spec.ts", "ui.ts", "fixtures.ts"].includes(
                        basename(location.file)
                    ) &&
                    Number.isSafeInteger(location.line) &&
                    location.line > 0
                ) {
                    console.log(`Assertion source: ${basename(location.file)}:${location.line}`);
                }
            }
            console.log(
                "Failure details withheld from console; inspect private masked screenshots and sanitized diagnostics. Reproduce locally to inspect an assertion interactively."
            );
        }
    }
    onError(error: TestError) {
        console.error(`Browser runner/setup category: ${failureCategory(error)}`);
    }
    onStdOut() {}
    onStdErr() {}
    async onEnd(result: FullResult) {
        this.clean();
        console.log(`Browser run: ${this.cleanupFailed ? "failed (privacy cleanup)" : result.status}`);
        if (this.cleanupFailed) return { status: "failed" as const };
    }
    async onExit() {
        // LastRunReporter writes after our onEnd. Final public exit hook removes
        // its runner metadata too and verifies the final retained artifact set.
        this.clean();
        if (this.parent && !this.cleanupFailed) console.log(`Privacy cleanup counters (mode0600): ${join(this.parent, "runner-privacy.json")}`);
        if (this.cleanupFailed) throw new Error("Private artifact cleanup failed");
    }
}
