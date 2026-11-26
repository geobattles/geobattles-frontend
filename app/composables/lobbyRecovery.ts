// The same restoration path serves route reloads, join and create. No browser
// resources or promises are serialized, and websocket readiness means applied state.
export const useLobbyRecovery = () => {
    const app = useNuxtApp();
    const router = useRouter();
    const { closedLobbyId } = useLobbyState();
    const restore = (id: string) => app.$gameRuntime.restoreLobby(id);
    const join = async (id: string, intent = app.$gameRuntime.beginLobbyIntent(id)) => {
        if (!intent.isCurrent()) throw new Error("Lobby join was cancelled.");
        intent.setTarget(id);
        // Navigate first: only after commit may the runtime release an old
        // membership and connect the target. afterEach shares this restore.
        // An explicitly created room can reuse a previously closed code.
        const failure = await router.push({ path: `/lobby/${id}`, force: closedLobbyId.value === id });
        if (failure || !intent.isCurrent() || routeLobbyId(router.currentRoute.value) !== id) throw new Error("Lobby navigation was cancelled.");
        await restore(id);
        if (!intent.isCurrent()) throw new Error("Lobby join was cancelled.");
        // The committed route's afterEach is the sole phase-routing owner.
    };
    return { restore, join };
};

export type LobbyLeavePrompt = { code: string; name?: string; inMatch: boolean };

export const useLobbyLeaveGuard = (isEntering?: () => boolean) => {
    const app = useNuxtApp();
    const router = useRouter();
    const { lobbySettings } = useLobbyState();
    const leavePrompt = shallowRef<LobbyLeavePrompt | null>(null);
    let decision: Promise<boolean> | null = null;
    let resolveDecision: ((confirmed: boolean) => void) | undefined;
    const decideLeave = (confirmed: boolean) => {
        const resolve = resolveDecision;
        resolveDecision = undefined;
        decision = null;
        leavePrompt.value = null;
        resolve?.(confirmed);
    };
    const guard = (to: Parameters<typeof routeLobbyId>[0], from: Parameters<typeof routeLobbyId>[0]) => {
        const id = routeLobbyId(from);
        if (!import.meta.client || !id || app.$gameRuntime.getMembershipId() !== id || app.$gameRuntime.socket.connectionState === "disconnected") return true;
        // Native leave/update guards run before global middleware. Fence phase
        // routing while the deliberate navigation is still asking/awaiting.
        app.$gameRuntime.beginNavigation(to);
        // An admission with no confirmed snapshot can be cancelled directly.
        // The committed navigation still invalidates the pending socket.
        if (isEntering?.() || (lobbySettings.value?.ID !== id && !app.$gameRuntime.socket.isConnected)) return true;
        // Only the server-selected route is an internal transition. All other
        // navigation (including address/back and another lobby ID) asks once.
        if (routeLobbyId(to) === id && lobbySettings.value && (to.name === "lobby-id") === (!lobbySettings.value.phase || lobbySettings.value.phase === "WAITING")) return true;
        if (!decision) {
            const room = lobbySettings.value;
            leavePrompt.value = { code: id, name: room?.conf.name, inMatch: room?.phase === "PLAYING" || room?.phase === "MID-ROUND" };
            // The router decides which overlapping navigation is still current.
            decision = new Promise<boolean>((resolve) => (resolveDecision = resolve));
        }
        return decision;
    };
    onBeforeRouteLeave(guard);
    onBeforeRouteUpdate(guard);
    if (import.meta.client) {
        const removeAfterEach = router.afterEach((_to, _from, failure) => {
            if (!failure && decision) decideLeave(false);
        });
        onScopeDispose(() => {
            removeAfterEach();
            decideLeave(false);
        });
    }
    return { goHome: () => router.push("/"), leavePrompt, decideLeave };
};
