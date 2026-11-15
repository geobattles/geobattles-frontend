import type { FullConfig } from "@playwright/test";
import { sanitizeRunnerArtifacts } from "./safety.mjs";

export default function globalTeardown(config: FullConfig) {
    sanitizeRunnerArtifacts(config);
}
