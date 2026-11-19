import { createGoogleRuntime } from "~/runtime/google";
import { createBattleRoyaleRuntime } from "~/runtime/battleRoyale";
import { createUIRuntime } from "~/runtime/ui";
import { createSocketRuntime } from "~/runtime/socket";
import { createSocketActions } from "~/runtime/socketActions";
import { createLobbySession } from "~/runtime/lobbySession";
import { createRoundClock } from "~/runtime/roundClock";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    const mode = useSelectedGameMode();
    const battleState = useBattleRoyaleState();
    const countryState = useCountryBattleState();
    const { lobbySettings, roundDeadline } = useLobbyState();
    const clock = createRoundClock(roundDeadline);
    const google = createGoogleRuntime();
    const battleRoyale = createBattleRoyaleRuntime(google);
    const currentState = computed(() => (mode.value === "BattleRoyale" ? battleState.currentState.value : countryState.currentState.value));
    const ui = createUIRuntime(google, currentState, useUIState());
    const commandPolicy = createSocketActions();
    const apply = createSocketHandlers({
        clock,
        reconcileLobbyRoute: () => session.reconcileLobbyRoute(),
        showPlayerLeftToast: ui.showPlayerLeftToast,
        showLiveGuess: ui.showLiveGuess,
        render: (operation) => {
            // Start the view grant synchronously after state application, but
            // never wait for SDK work in dispatch or let its failure reconnect.
            const report = (epoch: number) => {
                if (epoch === battleRoyale.generation && lobbySettings.value) battleRoyale.renderError.value = true;
            };
            try {
                const pending = operation();
                const epoch = battleRoyale.generation;
                battleRoyale.trackRender(pending.catch(() => report(epoch)));
            } catch {
                report(battleRoyale.generation);
            }
        },
    });
    const socket = createSocketRuntime(config.public.BACKEND_HOST, useAuthStore(), {
        apply,
        afterFrame: commandPolicy.afterFrame,
        closeAttempt: commandPolicy.clearReadyDeadline,
        invalidateViews: battleRoyale.clearMap,
        releaseSession: () => session.releaseSession(),
    });
    const session = createLobbySession(useRouter(), socket, {
        clock,
        clearViews: () => {
            battleRoyale.clearMap();
            ui.detach();
            google.dispose();
        },
        releaseViews: () => {
            google.dispose();
            ui.detach();
        },
        disposePage: ui.dispose,
    });
    const dispose = () => {
        session.dispose();
        socket.dispose();
        ui.dispose();
    };
    nuxtApp.vueApp.onUnmount(dispose);
    if (import.meta.hot) import.meta.hot.dispose(dispose);
    const { dispose: _dispose, releaseSession: _release, ...membership } = session;
    return {
        provide: { gameRuntime: { google, battleRoyale, ui, socket: readonly(socket.status), socketActions: commandPolicy.bind(socket.writeCommand), ...membership } },
    };
});
