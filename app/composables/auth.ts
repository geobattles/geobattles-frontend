import { effectScope } from "vue";
import type { User } from "~/types/appTypes";
import { createAuthService } from "~/services/authService";

export const useAuthStore = () => {
    const app = useNuxtApp();
    const runtime = app.$authRuntime;
    const router = useRouter();
    const config = useRuntimeConfig();
    const service = createAuthService(import.meta.server && config.BACKEND_SERVER_HOST ? config.BACKEND_SERVER_HOST : config.public.BACKEND_HOST);
    const player = usePlayerInfo();
    const isAuthenticated = useState("auth:authenticated", () => false);
    const authError = useState<string | null>("auth:error", () => null);
    const isLoginDialog = useState("auth:loginDialog", () => false);
    const loginDialogMode = useState<"login" | "guest">("auth:loginDialogMode", () => "login");
    const openLoginDialog = (mode: "login" | "guest" = "login") => {
        loginDialogMode.value = mode;
        isLoginDialog.value = true;
    };
    const isRefreshingToken = useState("auth:refreshing", () => false);
    const revision = useState("auth:revision", () => 0);

    // Fresh cookie options preserve each token's server-provided lifetime. The
    // temporary scope flushes writes and disposes Nuxt's cookie watchers/channels.
    // This is the only intentional context re-entry, including after HTTP awaits.
    const tokenCookie = (name: string, value?: string | null, expiry?: number): string | null => {
        let result: string | null = null;
        app.runWithContext(() => {
            const scope = effectScope();
            try {
                result =
                    scope.run(() => {
                        const cookie = useCookie<string | null>(name, {
                            path: "/",
                            sameSite: "lax",
                            watch: false,
                            ...(expiry === undefined ? {} : { maxAge: Math.max(0, expiry - Math.floor(Date.now() / 1000)) }),
                        });
                        if (value !== undefined) cookie.value = value;
                        return cookie.value || null;
                    }) ?? null;
            } finally {
                scope.stop();
            }
        });
        return result;
    };
    const clearTokens = () => {
        tokenCookie("access_token", null);
        tokenCookie("refresh_token", null);
    };
    const isTokenExpired = (token: string): boolean => {
        try {
            const data = parseJwt(token);
            return !Number.isFinite(data?.exp) || data.exp - 60 < Math.floor(Date.now() / 1000);
        } catch {
            return true;
        }
    };
    const hasPurpose = (token: string, purpose: "access" | "refresh") => {
        try {
            return parseJwt(token)?.token_use === purpose;
        } catch {
            return false;
        }
    };
    const clearSession = (intentional = false) => {
        const epoch = ++revision.value;
        clearTokens();
        player.value = {} as User;
        isAuthenticated.value = false;
        isRefreshingToken.value = false;
        if (intentional) app.$gameRuntime?.leave(true);
        else app.$gameRuntime?.failAuthentication();
        return epoch;
    };
    const guardAuth = (epoch: number, assertDeadline: () => void) => () => {
        assertDeadline();
        if (epoch !== revision.value) throw new Error("Authentication was cancelled.");
    };
    const saveTokenData = (token: string, assertReady: () => void) => {
        const data = parseJwt(token);
        if (!data || typeof (data.sub || data.uid) !== "string" || !(data.sub || data.uid)) throw new Error("Invalid token data. Please log in again.");
        assertReady();
        if (player.value.ID && player.value.ID !== (data.sub || data.uid)) app.$gameRuntime?.leave(true);
        assertReady();
        player.value = {
            ...player.value,
            username: data.user_name || data.username,
            ID: data.sub || data.uid,
            displayName: data.display_name || data.name,
            guest: data.guest || false,
        };
        assertReady();
        isAuthenticated.value = true;
        authError.value = null;
    };
    const saveResponse = (data: Awaited<ReturnType<typeof service.login>>, assertReady: () => void) => {
        if (!hasPurpose(data.AccessToken, "access") || !hasPurpose(data.RefreshToken, "refresh")) throw new Error("Please sign in again to update your session.");
        saveTokenData(data.AccessToken, assertReady);
        assertReady();
        tokenCookie("access_token", data.AccessToken, data.AccessExpiry);
        assertReady();
        tokenCookie("refresh_token", data.RefreshToken, data.RefreshExpiry);
    };
    const expireSession = () => {
        clearSession();
        authError.value = "Your session has expired. Please log in again.";
        if (!isLoginDialog.value) openLoginDialog();
    };
    const readinessExpired = (epoch: number) => {
        if (epoch !== revision.value) return;
        expireSession();
        authError.value = "Authentication readiness timed out. Please try signing in again.";
    };
    const logout = async () => {
        // Never refresh during logout: refresh failure used to recurse into logout.
        const accessToken = tokenCookie("access_token");
        // Install the shared issuance fence before clearing state/notifying UI.
        const revocation = accessToken && runtime ? runtime.revokeLogout((signal) => service.logout(accessToken, signal)) : runtime?.waitForLogout();
        const epoch = clearSession(true);
        const isNavigationCurrent = app.$gameRuntime?.captureNavigation() ?? (() => true);
        authError.value = null;
        openLoginDialog();
        try {
            await revocation;
        } catch (error) {
            if (epoch === revision.value) authError.value = error instanceof Error ? error.message : "Logout could not be confirmed.";
            console.warn("Backend logout could not be confirmed; local session was cleared and new sign-in is blocked.");
        }
        if (epoch === revision.value && isNavigationCurrent()) await router.replace("/");
    };
    const refreshToken = (assertParentReady: () => void = () => {}): Promise<string | null> => {
        const epoch = revision.value;
        return runtime.refresh(
            epoch,
            async (assertDeadline) => {
                const assertReady = guardAuth(epoch, () => {
                    assertParentReady();
                    assertDeadline();
                });
                try {
                    assertReady();
                    await runtime.waitForLogout();
                    assertReady();
                    await runtime.waitForIssuance();
                    assertReady();
                    const refresh = tokenCookie("refresh_token");
                    if (!refresh || !hasPurpose(refresh, "refresh") || isTokenExpired(refresh)) {
                        expireSession();
                        return null;
                    }
                    isRefreshingToken.value = true;
                    authError.value = null;
                    assertReady();
                    const data = await service.refreshAccessToken(refresh);
                    saveResponse(data, assertReady);
                    return data.AccessToken;
                } catch {
                    if (epoch === revision.value) expireSession();
                    return null;
                } finally {
                    // An old request must not clear a newer session's pending flag.
                    if (epoch === revision.value || !isAuthenticated.value) isRefreshingToken.value = false;
                }
            },
            () => readinessExpired(epoch)
        );
    };
    const getValidAccessToken = (assertParentReady: () => void = () => {}) => {
        const epoch = revision.value;
        return runtime.bounded(
            async (assertDeadline) => {
                const assertReady = guardAuth(epoch, () => {
                    assertParentReady();
                    assertDeadline();
                });
                try {
                    assertReady();
                    await runtime.waitForLogout();
                    assertReady();
                    await runtime.waitForIssuance();
                    assertReady();
                    const token = tokenCookie("access_token");
                    if (token && !hasPurpose(token, "access")) {
                        expireSession();
                        return null;
                    }
                    return token && !isTokenExpired(token) ? token : await refreshToken(assertReady);
                } catch {
                    return null;
                }
            },
            () => readinessExpired(epoch)
        );
    };
    const authenticate = (request: () => Promise<Awaited<ReturnType<typeof service.login>>>) => {
        const epoch = ++revision.value;
        app.$gameRuntime?.cancelLobbyIntent();
        isRefreshingToken.value = false;
        authError.value = null;
        return runtime.issue(
            async (assertDeadline) => {
                const assertReady = guardAuth(epoch, assertDeadline);
                try {
                    assertReady();
                    await runtime?.waitForLogout();
                    assertReady();
                    const data = await request();
                    saveResponse(data, assertReady);
                } catch (error) {
                    if (epoch === revision.value) {
                        clearSession();
                        authError.value = error instanceof Error ? error.message : "Authentication failed. Please try again.";
                    }
                    throw error;
                }
            },
            () => readinessExpired(epoch)
        );
    };
    const login = (username: string, password: string) => authenticate(() => service.login(username, password));
    const register = (username: string | null, password: string | null, displayName: string | null) => authenticate(() => service.register(username, password, displayName));
    const updateUser = (displayName: string | null, password: string | null) => {
        const epoch = revision.value;
        return runtime.bounded(
            async (assertDeadline) => {
                const assertReady = guardAuth(epoch, assertDeadline);
                try {
                    assertReady();
                    await runtime.waitForLogout();
                    assertReady();
                    const token = await getValidAccessToken(assertReady);
                    assertReady();
                    if (!token) throw new Error("Authentication required. Please log in again.");
                    const data = await service.updateUser(displayName, password, token);
                    saveResponse(data, assertReady);
                } catch (error) {
                    if (epoch === revision.value) authError.value = error instanceof Error ? error.message : "Profile update failed. Please try again.";
                    throw error;
                }
            },
            () => readinessExpired(epoch)
        );
    };
    const initializeAuth = (): Promise<void> => {
        const epoch = revision.value;
        return runtime.bootstrap(
            epoch,
            async (assertDeadline) => {
                const assertReady = guardAuth(epoch, assertDeadline);
                try {
                    assertReady();
                    await runtime.waitForLogout();
                    assertReady();
                    await runtime.waitForIssuance();
                    // A superseded/timed-out bootstrap cannot start new auth work.
                    assertReady();
                    const token = tokenCookie("access_token");
                    const refresh = tokenCookie("refresh_token");
                    if ((token && !hasPurpose(token, "access")) || (refresh && !hasPurpose(refresh, "refresh"))) {
                        expireSession();
                    } else if (token && !isTokenExpired(token)) {
                        saveTokenData(token, assertReady);
                    } else if (refresh && !isTokenExpired(refresh)) {
                        await refreshToken(assertReady);
                    } else if (token || refresh || isAuthenticated.value) {
                        expireSession();
                    }
                } catch (error) {
                    if (epoch !== revision.value) return;
                    clearSession();
                    authError.value = error instanceof Error ? error.message : "Please sign in again.";
                }
            },
            () => readinessExpired(epoch)
        );
    };
    return reactive({
        isAuthenticated,
        authError,
        isLoginDialog,
        loginDialogMode,
        openLoginDialog,
        isRefreshingToken,
        login,
        register,
        logout,
        refreshToken,
        initializeAuth,
        getValidAccessToken,
        updateUser,
        isPlayerAuthenticated: () => isAuthenticated.value,
        isTokenExpired,
    });
};
