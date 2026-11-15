// Lazy, runtime-owned direct Google loader. No request before a view grant.
// Failed scripts are removed so an explicit retry can issue a fresh request.
const ignoreStaleMapsCallback = () => {};
const createCallbackRegistry = () => ({
    nextAttempt: 0,
    callbacks: new Proxy<Record<string, () => void>>(Object.create(null), {
        get: (callbacks, name) => Reflect.get(callbacks, name) ?? ignoreStaleMapsCallback,
    }),
});

export const createMapsLoader = (onAuthFailure: () => void) => {
    const browser = window as typeof window & { __geoBattlesMapsCallbacks?: ReturnType<typeof createCallbackRegistry>; gm_authFailure?: () => void };
    // Page-owned IDs survive runtime replacement/HMR. Only live callbacks are
    // retained; deleted attempts resolve to a shared no-op, even arbitrarily late.
    const registry = (browser.__geoBattlesMapsCallbacks ??= createCallbackRegistry());
    let key = "";
    let pending: Promise<void> | null = null;
    let cancel: (() => void) | null = null;
    let previousAuthFailure: (() => void) | undefined;
    let authInstalled = false;
    const authFailure = () => {
        onAuthFailure();
        previousAuthFailure?.();
    };
    const installAuthHandler = () => {
        if (authInstalled) return;
        previousAuthFailure = browser.gm_authFailure;
        browser.gm_authFailure = authFailure;
        authInstalled = true;
    };
    const load = (): Promise<void> => {
        installAuthHandler();
        if (pending) return pending;
        if (typeof window.google?.maps?.importLibrary === "function") return Promise.resolve();
        if (!key) return Promise.reject(new Error("Maps are not configured."));
        pending = new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            let settled = false;
            const attempt = `attempt${++registry.nextAttempt}`;
            const finish = (success: boolean) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                script.onerror = null;
                if (registry.callbacks[attempt] === ready) delete registry.callbacks[attempt];
                cancel = null;
                if (success) resolve();
                else {
                    script.remove();
                    pending = null;
                    reject(new Error("Maps could not load."));
                }
            };
            const ready = () => finish(typeof window.google?.maps?.importLibrary === "function");
            const timeout = setTimeout(() => finish(false), 12_000);
            registry.callbacks[attempt] = ready;
            cancel = () => finish(false);
            script.onerror = () => finish(false);
            const query = new URLSearchParams({
                key,
                v: "weekly",
                loading: "async",
                callback: `__geoBattlesMapsCallbacks.callbacks.${attempt}`,
                libraries: "maps,streetView,marker",
            });
            script.src = `https://maps.googleapis.com/maps/api/js?${query}`;
            script.async = true;
            script.nonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce ?? "";
            document.head.appendChild(script);
        });
        return pending;
    };
    const dispose = () => {
        cancel?.();
        pending = null;
        if (authInstalled && browser.gm_authFailure === authFailure) browser.gm_authFailure = previousAuthFailure;
        authInstalled = false;
    };
    return { install: (value: string) => (key = value), load, dispose };
};
