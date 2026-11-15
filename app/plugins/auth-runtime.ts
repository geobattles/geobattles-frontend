import { createAuthRuntime } from "~/runtime/auth";

export default defineNuxtPlugin({
    name: "auth-runtime",
    enforce: "pre",
    setup: () => ({ provide: { authRuntime: createAuthRuntime() } }),
});
