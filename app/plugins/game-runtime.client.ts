import { createGoogleRuntime } from "~/runtime/google";
import { createBattleRoyaleRuntime } from "~/runtime/battleRoyale";
import { createUIRuntime } from "~/runtime/ui";
import { createSocketRuntime } from "~/runtime/socket";
import { GameState } from "~/types/appTypes";
import { isNavigationFailure, NavigationFailureType } from "vue-router";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    const router = useRouter();
    const mode = useSelectedGameMode();
    const battleState = useBattleRoyaleState();
    const countryState = useCountryBattleState();
    const lobbyState = useLobbyState();
    const results = useResultsStore();
    const request = useRequestState();
    const flags = useUIState();
    const google = createGoogleRuntime();
    const battleRoyale = createBattleRoyaleRuntime(google);
    const currentState = computed(() => (mode.value === "BattleRoyale" ? battleState.currentState.value : countryState.currentState.value));
    const ui = createUIRuntime(google, currentState, flags);
    const socket = createSocketRuntime(
        config.public.BACKEND_HOST,
        useAuthStore(),
        createSocketHandlers(),
        () => battleRoyale.clearMap(),
        () => {
            // Expiry ends readiness, not the committed native lobby owner.
            // A later successful navigation may restore again; expiry itself
            // must not start another recovery budget or automatic join.
            if (restoration?.state === "ready") restoration.state = "expired";
            google.dispose();
            ui.detach();
            lobbyState.roundDeadline.value = null;
            lobbyState.rejoinTimer.value = null;
        }
    );
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
    const resetMembership = (intentional = false, preserveFailure = false) => {
        const failure = preserveFailure ? request.requestError : null;
        membershipId = null;
        restoration = null;
        phaseNavigation = null;
        socket.disconnect(intentional);
        battleRoyale.clearMap();
        // SDK-bound listeners belong to this session; page-owned toast and
        // fullscreen bindings live until their retained component unmounts.
        ui.detach();
        google.dispose();
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
        lobbyState.roundDeadline.value = null;
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
        resetMembership(intentional);
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
            if (owner.state === "pending" || owner.state === "expired" || (owner.state === "failed" && socket.connectionError)) return;
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
        // restore, never reuse the old ready record or retained round data.
        if (membershipId === id) resetMembership();
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
        const owner = restoration;
        cancelLobbyIntent();
        resetMembership();
        request.fail({ command: "", code: "AUTHENTICATION_REQUIRED", message: "Your session is unavailable. Please sign in again before joining a lobby." });
        // Auth expiry is a genuine current failure, not root/HMR cancellation.
        // Preserve a newer navigation's fence while releasing invalid identity
        // resources; a cancelled navigation can then resume this fallback.
        if (!disposed && owner && routeLobbyId(router.currentRoute.value) === owner.id) {
            restoration = { id: owner.id, state: "failed" };
            reconcileLobbyRoute();
        }
    };
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
        if (_from.name === "gameplay-id" && (to.name !== "gameplay-id" || routeLobbyId(_from) !== target)) ui.dispose();
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
                resetMembership(true, true);
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
        if (id && target !== id) resetMembership(true);
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
        leave();
        socket.dispose();
        ui.dispose();
    };
    nuxtApp.vueApp.onUnmount(dispose);
    if (import.meta.hot) import.meta.hot.dispose(dispose);
    return {
        provide: {
            gameRuntime: {
                google,
                battleRoyale,
                ui,
                socket,
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
            },
        },
    };
});
