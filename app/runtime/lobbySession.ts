import type { Router } from "vue-router";
import { isNavigationFailure, NavigationFailureType } from "vue-router";
import type { createSocketRuntime, LobbyExit } from "~/runtime/socket";
import type { createRoundClock } from "~/runtime/roundClock";
import { GameState } from "~/types/appTypes";
import { isLobbyCode } from "~/utils/lobbyCode";

// The committed route owns membership; a socket attempt and an incoming
// phase change can never implicitly leave or claim another lobby.
export const createLobbySession = (
    router: Router,
    socket: Pick<ReturnType<typeof createSocketRuntime>, "connect" | "disconnect" | "getLobbyId" | "captureSession" | "status" | "failAuthentication">,
    ports: { clearViews: () => void; disposePage: () => void; releaseViews: () => void; clock: Pick<ReturnType<typeof createRoundClock>, "suspend" | "reset"> }
) => {
    const battleState = useBattleRoyaleState();
    const countryState = useCountryBattleState();
    const lobbyState = useLobbyState();
    const results = useResultsStore();
    const request = useRequestState();
    const player = usePlayerInfo();
    const returnHint = useLobbyReturnState();
    const hintKey = "geobattles:return-lobby";
    try {
        const saved = JSON.parse(localStorage.getItem(hintKey) ?? "null") as { id?: unknown; playerId?: unknown } | null;
        if (saved && typeof saved.id === "string" && isLobbyCode(saved.id) && typeof saved.playerId === "string") returnHint.value = { id: saved.id, playerId: saved.playerId };
    } catch {
        // Return remains available in this tab when storage is unavailable.
    }
    const storeHint = (hint: typeof returnHint.value) => {
        returnHint.value = hint;
        try {
            if (hint) localStorage.setItem(hintKey, JSON.stringify(hint));
            else localStorage.removeItem(hintKey);
        } catch {
            // Storage access never determines lobby admission.
        }
    };
    // HTTP/create/join intent is independent of socket attempts: there may not
    // be a socket yet when navigation, logout or another join supersedes it.
    let intentGeneration = 0;
    let intentTarget: string | null = null;
    let navigationGeneration = 0;
    let pendingNavigation: object | null = null;
    let disposed = false;
    // Committed ownership survives failed/cancelled navigation attempts.
    let membershipId: string | null = null;
    type Restoration = { id: string; state: "pending" | "ready" | "failed" | "expired" };
    let restoration: Restoration | null = null;
    type PhaseNavigation = { owner: Restoration; committed: boolean };
    let phaseNavigation: PhaseNavigation | null = null;
    // Native history state carries an operation ticket through lazy imports.
    // Keep every outstanding ticket until its own promise settles, even when
    // expiry/auth/another membership invalidates the live routing owner.
    const phaseNavigations = new Map<string, PhaseNavigation>();
    const cancelLobbyIntent = () => {
        intentGeneration++;
        intentTarget = null;
    };
    const beginLobbyIntent = (target: string | null = null) => {
        const epoch = ++intentGeneration;
        intentTarget = target;
        return {
            isCurrent: () => !disposed && epoch === intentGeneration,
            setTarget: (id: string) => {
                if (epoch === intentGeneration) intentTarget = id;
            },
        };
    };
    const captureNavigation = () => {
        const epoch = navigationGeneration;
        return () => !disposed && epoch === navigationGeneration;
    };
    const beginNavigation = (to: object) => {
        if (pendingNavigation !== to) {
            navigationGeneration++;
            pendingNavigation = to;
        }
        return captureNavigation();
    };
    // Root unmount/HMR are unannounced transport teardown, not user leave.
    const resetMembership = ({
        exit = "transport",
        preserveFailure = false,
        sameLobbyRetry = false,
    }: { exit?: LobbyExit; preserveFailure?: boolean; sameLobbyRetry?: boolean } = {}) => {
        const failure = preserveFailure ? request.requestError : null;
        membershipId = null;
        restoration = null;
        phaseNavigation = null;
        socket.disconnect(exit);
        ports.clearViews();
        battleState.currentState.value = GameState.WAITING;
        battleState.currentRound.value = 0;
        battleState.currentMapPin.value = {} as typeof battleState.currentMapPin.value;
        battleState.searchedLocationCoords.value = {} as typeof battleState.searchedLocationCoords.value;
        battleState.isGuessPending.value = false;
        countryState.currentState.value = GameState.WAITING;
        countryState.currentRound.value = 0;
        countryState.currentMapPin.value = {} as typeof countryState.currentMapPin.value;
        lobbyState.lobbySettings.value = null;
        lobbyState.lobbySettingsOriginal.value = null;
        lobbyState.playerPresentation.value = { lobbyId: null, players: {} };
        lobbyState.rejoinTimer.value = null;
        if (sameLobbyRetry) ports.clock.suspend();
        else ports.clock.reset();
        lobbyState.isUpdatingSettings.value = false;
        lobbyState.modifySettingsModal.value = false;
        lobbyState.finalResultsReady.value = false;
        lobbyState.revealedAnswers.value = {};
        results.resetResults();
        request.resetPending();
        if (failure) request.fail(failure);
        else request.clearError();
    };
    const leave = (intentional = false) => {
        navigationGeneration++;
        pendingNavigation = null;
        cancelLobbyIntent();
        if (intentional) storeHint(null);
        resetMembership({ exit: intentional ? "disconnect" : "transport" });
    };
    const waitForLobby = async (id: string, joining: Promise<void>) => {
        const isCurrent = socket.captureSession();
        await joining;
        if (!isCurrent() || lobbyState.lobbySettings.value?.ID !== id) throw new Error("Lobby restoration was cancelled.");
        return lobbyRoutePath(lobbyState.lobbySettings.value);
    };
    // Join/create callers may await the already-admitted operation, never
    // mint another budget if their post-navigation continuation outlives it.
    const restoreLobby = (id: string) => {
        if (membershipId !== id || restoration?.id !== id || restoration.state === "expired" || restoration.state === "failed" || socket.getLobbyId() !== id)
            return Promise.reject(new Error("Lobby restoration was cancelled or expired."));
        return waitForLobby(id, socket.connect(id));
    };
    // Only this committed owner routes phase/failure changes. START and SDK
    // rendering cannot take navigation away from a pending deliberate leave.
    const reconcileLobbyRoute = () => {
        const owner = restoration;
        queueMicrotask(() => {
            if (disposed || !owner || owner !== restoration || pendingNavigation || phaseNavigation || routeLobbyId(router.currentRoute.value) !== owner.id) return;
            // Keep a terminal lobby failure on its route so the recovery dialog
            // can explain it and offer an intentional next step, not a home bounce.
            if (owner.state === "pending" || owner.state === "expired" || (owner.state === "failed" && socket.status.connectionError)) return;
            const snapshot = lobbyState.lobbySettings.value;
            if (owner.state === "ready" && (socket.getLobbyId() !== owner.id || snapshot?.ID !== owner.id)) return;
            const path = owner.state === "failed" ? "/" : lobbyRoutePath(snapshot!);
            if (router.currentRoute.value.path !== path) {
                const navigation = { owner, committed: false };
                const ticket = Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join("-");
                phaseNavigations.set(ticket, navigation);
                phaseNavigation = navigation;
                let cancelled = false;
                void router
                    .replace({ path, state: { geoBattlesPhaseNavigation: ticket } })
                    .then((failure) => {
                        cancelled = isNavigationFailure(failure, NavigationFailureType.cancelled);
                    })
                    .catch(() => {})
                    .finally(() => {
                        phaseNavigations.delete(ticket);
                        // A failed automatic redirect must not retry itself in an
                        // afterEach loop. Router cancellation proves supersession;
                        // success may need to reconcile a newer server phase.
                        if (phaseNavigation === navigation) {
                            phaseNavigation = null;
                            if (navigation.committed || cancelled) reconcileLobbyRoute();
                        }
                    });
            }
        });
    };
    const restoreCommittedLobby = (id: string) => {
        if (restoration?.id === id && restoration.state !== "expired" && restoration.state !== "failed" && socket.getLobbyId() === id) {
            reconcileLobbyRoute();
            return;
        }
        // A same-ID navigation after terminal expiry is a new legitimate
        // restore. Only a matching clock ceiling survives, not prior game data.
        if (membershipId === id) resetMembership({ sameLobbyRetry: true });
        membershipId = id;
        const owner: Restoration = { id, state: "pending" };
        restoration = owner;
        void waitForLobby(id, socket.connect(id))
            .then(() => {
                if (disposed || restoration !== owner) return;
                owner.state = "ready";
                reconcileLobbyRoute();
            })
            .catch(() => {
                if (disposed || restoration !== owner) return;
                owner.state = "failed";
                reconcileLobbyRoute();
            });
    };
    const failAuthentication = () => {
        const id = membershipId;
        cancelLobbyIntent();
        resetMembership();
        if (!disposed && id && routeLobbyId(router.currentRoute.value) === id) {
            membershipId = id;
            restoration = { id, state: "failed" };
            socket.failAuthentication();
        }
    };
    const stopRemembering = watch([() => socket.status.isConnected, () => player.value.ID], ([connected, playerId]) => {
        const id = socket.getLobbyId();
        if (connected && id && playerId && lobbyState.lobbySettings.value?.ID === id) storeHint({ id, playerId });
    });
    const stopClearingHint = watch(
        () => socket.status.connectionError,
        (error) => {
            if (error?.code === "LOBBY_NOT_FOUND" && returnHint.value?.id === routeLobbyId(router.currentRoute.value)) storeHint(null);
        }
    );
    const removeNavigationFence = router.beforeEach((to) => {
        if (!disposed) beginNavigation(to);
    });
    const removeRouteCleanup = router.afterEach((to, _from, failure) => {
        if (pendingNavigation === to) pendingNavigation = null;
        if (disposed) return;
        if (failure) {
            reconcileLobbyRoute();
            return;
        }
        const target = routeLobbyId(to);
        // These bindings belong to the committed gameplay page, not a socket.
        // Preserve them for retained same-ID views, but release them once a
        // successful route commit replaces that page (also after auth reset).
        if (_from.name === "gameplay-id" && (to.name !== "gameplay-id" || routeLobbyId(_from) !== target)) ports.disposePage();
        // afterEach runs after successful history-state commit. Resolve the
        // exact unconsumed operation, not a path match or the live owner flag.
        // A subsequent deliberate replace can inherit a SPENT state ticket;
        // that is a new admission, as is a successful same-ID query/hash push.
        const ticket = router.options.history.state.geoBattlesPhaseNavigation;
        const automatic = typeof ticket === "string" ? phaseNavigations.get(ticket) : undefined;
        if (automatic && !automatic.committed) {
            automatic.committed = true;
            if (automatic.owner === restoration && automatic.owner.state === "failed" && !target) {
                cancelLobbyIntent();
                resetMembership({ preserveFailure: true });
            }
            // Automatic commits NEVER call connect or reset an expired owner.
            // Auth failure can still reconcile its distinct failure owner.
            reconcileLobbyRoute();
            return;
        }
        if (!target || target !== intentTarget) cancelLobbyIntent();
        const id = membershipId ?? socket.getLobbyId();
        // Native ownership outlives terminal transport expiry. Release it
        // only after successful route commit, even with no live socket ID.
        if (id && target !== id) {
            if (target && returnHint.value?.id === id) storeHint(null);
            const confirmed = lobbyState.lobbySettings.value?.ID === id;
            resetMembership({ exit: target || !confirmed ? "disconnect" : "leave" });
        }
        if (!target) {
            restoration = null;
            return;
        }
        restoreCommittedLobby(target);
    });
    const removeRouteError = router.onError((_error, to) => {
        if (pendingNavigation === to) pendingNavigation = null;
        reconcileLobbyRoute();
    });
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        removeNavigationFence();
        removeRouteCleanup();
        removeRouteError();
        stopRemembering();
        stopClearingHint();
        leave();
    };
    const releaseSession = () => {
        // A terminal connection failure ends readiness, not the committed
        // membership. A later deliberate navigation can try a fresh admission.
        if (restoration?.state === "ready") restoration.state = "expired";
        ports.releaseViews();
        ports.clock.suspend();
        lobbyState.rejoinTimer.value = null;
    };
    return {
        leave,
        failAuthentication,
        restoreLobby,
        beginLobbyIntent,
        cancelLobbyIntent,
        captureNavigation,
        beginNavigation,
        reconcileLobbyRoute,
        getMembershipId: () => membershipId,
        isNavigating: () => pendingNavigation !== null,
        dispose,
        releaseSession,
    };
};
