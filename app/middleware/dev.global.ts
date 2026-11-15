export default defineNuxtRouteMiddleware(async (to) => {
    const app = useNuxtApp();
    const isCurrent = import.meta.client ? app.$gameRuntime.beginNavigation(to) : () => true;
    // Lobby auth belongs to the socket's absolute readiness budget, including
    // bootstrap/issuance waits. No pre-commit lobby resource changes.
    if (import.meta.client && routeLobbyId(to)) return;
    const auth = useAuthStore();
    const player = usePlayerInfo();
    const publicPaths = ["/", "/signup", "/lobby/list", "/lobby/join", "/about", "/journal"];
    // Runs before the guard decision on both SSR and client navigation, not in
    // the later root onBeforeMount hook. Tokens stay in scoped cookies/runtime.
    try {
        await auth.initializeAuth();
    } catch {
        if (!isCurrent()) return abortNavigation();
        if (!publicPaths.includes(to.path)) return navigateTo("/", { replace: true });
    }
    if (!isCurrent()) return abortNavigation();
    if (!publicPaths.includes(to.path) && (!auth.isAuthenticated || !player.value.ID)) return navigateTo("/", { replace: true });
    // The client runtime restores only after successful route commit. A later
    // failed/superseded navigation must leave the previous membership intact.
});
