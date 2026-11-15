// The same restoration path serves route reloads, join and create. No browser
// resources or promises are serialized, and websocket readiness means applied state.
export const useLobbyRecovery = () => {
    const app = useNuxtApp();
    const router = useRouter();
    const restore = (id: string) => app.$gameRuntime.restoreLobby(id);
    const join = async (id: string, intent = app.$gameRuntime.beginLobbyIntent(id)) => {
        if (!intent.isCurrent()) throw new Error("Lobby join was cancelled.");
        intent.setTarget(id);
        // Navigate first: only after commit may the runtime release an old
        // membership and connect the target. afterEach shares this restore.
        const failure = await router.push(`/lobby/${id}`);
        if (failure || !intent.isCurrent() || routeLobbyId(router.currentRoute.value) !== id) throw new Error("Lobby navigation was cancelled.");
        await restore(id);
        if (!intent.isCurrent()) throw new Error("Lobby join was cancelled.");
        // The committed route's afterEach is the sole phase-routing owner.
    };
    return { restore, join };
};

export const useLobbyLeaveGuard = () => {
    const app = useNuxtApp();
    const router = useRouter();
    const { lobbySettings } = useLobbyState();
    let deciding: Promise<boolean> | null = null;
    const guard = (to: Parameters<typeof routeLobbyId>[0], from: Parameters<typeof routeLobbyId>[0]) => {
        const id = routeLobbyId(from);
        if (!id || app.$gameRuntime.getMembershipId() !== id || app.$gameRuntime.socket.connectionState === "disconnected") return true;
        // Native leave/update guards run before global middleware. Fence phase
        // routing while the deliberate navigation is still asking/awaiting.
        app.$gameRuntime.beginNavigation(to);
        // Only the server-selected route is an internal transition. All other
        // navigation (including address/back and another lobby ID) asks once.
        if (routeLobbyId(to) === id && lobbySettings.value && (to.name === "lobby-id") === (!lobbySettings.value.phase || lobbySettings.value.phase === "WAITING")) return true;
        if (!deciding) {
            deciding = Promise.resolve()
                .then(() => {
                    if (!window.confirm("Are you sure you want to leave the lobby?")) return false;
                    return true;
                })
                .finally(() => {
                    deciding = null;
                });
        }
        return deciding;
    };
    onBeforeRouteLeave(guard);
    onBeforeRouteUpdate(guard);
    return { goHome: () => router.push("/") };
};
