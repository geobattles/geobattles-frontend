import type { Coordinates } from "~/types/appTypes";
import type { LobbySettingsPatch, SocketCommand } from "~/types/socketTypes";
import type { RequestError } from "~/composables/requestState";

type WriteSocketCommand = (command: SocketCommand, beforeWrite: () => void, unavailable: (error: RequestError) => void) => (() => boolean) | undefined;

// Command policy is independent of the native socket. A write does not
// acknowledge a command; ordered events and attempt teardown settle it.
export const createSocketActions = () => {
    const request = useRequestState();
    const startUnavailableReason = useRuntimeConfig().public.GMAPS_API.trim()
        ? ""
        : "Maps is not configured in this browser build. Ask the operator to configure the browser Maps key before starting a game.";
    let readyAckTimer: ReturnType<typeof setTimeout> | undefined;
    const clearReadyDeadline = () => {
        clearTimeout(readyAckTimer);
        readyAckTimer = undefined;
    };
    const afterFrame = () => {
        if (!request.isReadyPending) clearReadyDeadline();
    };
    const bind = (write: WriteSocketCommand) => {
        const send = (message: SocketCommand) => {
            if (message.command === "start" && startUnavailableReason) {
                request.fail({ command: "start", code: "MAPS_NOT_CONFIGURED", message: startUnavailableReason });
                return false;
            }
            if (message.command === "start" && request.isStartPending) return false;
            if (message.command === "setReady" && request.isReadyPending) return false;
            const isCurrent = write(
                message,
                () => {
                    request.clearError();
                    if (message.command === "start") request.isStartPending = true;
                    if (message.command === "setReady") request.readyTarget = message.ready;
                },
                request.fail
            );
            if (!isCurrent) return false;
            if (message.command === "setReady") {
                clearReadyDeadline();
                readyAckTimer = setTimeout(() => {
                    readyAckTimer = undefined;
                    if (isCurrent() && request.isReadyPending) {
                        request.fail({
                            command: "setReady",
                            code: "READY_ACK_TIMEOUT",
                            message: "Ready status was not acknowledged. Check the displayed server status before trying again.",
                        });
                    }
                }, 5000);
            }
            return true;
        };
        return {
            startUnavailableReason,
            start: () => send({ command: "start" }),
            setReady: (ready: boolean) => send({ command: "setReady", ready }),
            submitLocation: (location: Coordinates) => send({ command: "submit_location", location }),
            updateSettings: (conf: LobbySettingsPatch) => send({ command: "update_lobby_settings", conf }),
        };
    };
    return { bind, afterFrame, clearReadyDeadline };
};
