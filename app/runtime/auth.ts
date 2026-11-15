// One non-serialized owner per Nuxt app (one request on SSR), never module-global.
export const createAuthRuntime = () => {
    // The watchdog settles callers, but wall-clock checks authorize every later
    // request/publication even if suspended browser timers have not run yet.
    const bounded = <T>(request: (assertReady: () => void) => Promise<T>, onTimeout: () => void): Promise<T> => {
        const expiresAt = Date.now() + 30_000;
        let expired = false;
        let timer: ReturnType<typeof setTimeout>;
        const expire = () => {
            if (!expired) {
                expired = true;
                onTimeout();
            }
            return new Error("Authentication readiness timed out. Please try signing in again.");
        };
        const assertReady = () => {
            if (expired || Date.now() >= expiresAt) throw expire();
        };
        const deadline = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(expire()), Math.max(0, expiresAt - Date.now()));
        });
        const work = Promise.resolve().then(async () => {
            assertReady();
            const result = await request(assertReady);
            assertReady();
            return result;
        });
        return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
    };
    let pendingBootstrap: { revision: number; promise: Promise<void> } | null = null;
    let pendingRefresh: { revision: number; promise: Promise<string | null> } | null = null;
    let pendingIssuance: Promise<void> | null = null;
    const bootstrap = (revision: number, request: (assertReady: () => void) => Promise<void>, onTimeout: () => void) => {
        if (pendingBootstrap?.revision === revision) return pendingBootstrap.promise;
        const promise = bounded(request, onTimeout).finally(() => {
            if (pendingBootstrap?.promise === promise) pendingBootstrap = null;
        });
        pendingBootstrap = { revision, promise };
        return promise;
    };
    const refresh = (revision: number, request: (assertReady: () => void) => Promise<string | null>, onTimeout: () => void) => {
        if (pendingRefresh?.revision === revision) return pendingRefresh.promise;
        const promise = bounded(request, onTimeout).finally(() => {
            if (pendingRefresh?.promise === promise) pendingRefresh = null;
        });
        pendingRefresh = { revision, promise };
        return promise;
    };
    const issue = (request: (assertReady: () => void) => Promise<void>, onTimeout: () => void) => {
        const promise = bounded(request, onTimeout).finally(() => {
            if (pendingIssuance === promise) pendingIssuance = null;
        });
        pendingIssuance = promise;
        return promise;
    };
    const waitForIssuance = async () => {
        if (pendingIssuance) await pendingIssuance.catch(() => {});
    };
    let pendingLogout: Promise<void> | null = null;
    let logoutUncertain = false;
    const uncertainLogout = () => new Error("Logout could not be confirmed. Sign-in is blocked on this page to protect your next session. Contact the server operator.");

    const waitForLogout = async () => {
        if (pendingLogout) await pendingLogout;
        if (logoutUncertain) throw uncertainLogout();
    };
    const revokeLogout = (request: (signal: AbortSignal) => Promise<void>) => {
        if (pendingLogout) return pendingLogout;
        if (logoutUncertain) return Promise.reject(uncertainLogout());

        const controller = new AbortController();
        const expiresAt = Date.now() + 10_000;
        let timer: ReturnType<typeof setTimeout>;
        const expire = () => {
            // Abort bounds client waiting, never proves server cancellation.
            logoutUncertain = true;
            controller.abort();
            return uncertainLogout();
        };
        const assertReady = () => {
            if (logoutUncertain || Date.now() >= expiresAt) throw expire();
        };
        const deadline = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(expire()), Math.max(0, expiresAt - Date.now()));
        });
        const work = Promise.resolve().then(async () => {
            assertReady();
            await request(controller.signal);
            assertReady();
        });
        pendingLogout = Promise.race([work, deadline])
            .catch(() => {
                logoutUncertain = true;
                throw uncertainLogout();
            })
            .finally(() => {
                clearTimeout(timer);
                pendingLogout = null;
            });
        return pendingLogout;
    };
    return { bounded, bootstrap, refresh, issue, waitForIssuance, waitForLogout, revokeLogout };
};
