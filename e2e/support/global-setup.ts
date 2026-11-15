import type { FullConfig } from "@playwright/test";
import { preparePrivateOutput } from "./safety.mjs";

export default function globalSetup(config: FullConfig) {
    preparePrivateOutput(config);
}
