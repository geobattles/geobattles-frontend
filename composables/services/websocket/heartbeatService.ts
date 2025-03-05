export interface HeartbeatConfig {
    pingInterval: number;
    pongTimeout: number;
    pingTimerId: number | null;
    pongTimerId: number | null;
}

export const createHeartbeatService = (connection: Ref<WebSocket | null>) => {
    const config: HeartbeatConfig = {
        pingInterval: 5000,
        pongTimeout: 5000,
        pingTimerId: null,
        pongTimerId: null,
    };

    const sendPing = () => {
        if (!connection.value || connection.value.readyState !== WebSocket.OPEN) return;
        connection.value.send(JSON.stringify({ command: "ping" }));
        startPongTimer();
    };

    const startPongTimer = () => {
        resetPongTimer();
        config.pongTimerId = window.setTimeout(() => {
            console.warn("No pong response received - connection may be lost");
            connection.value?.close();
        }, config.pongTimeout);
    };

    const resetPongTimer = () => {
        if (config.pongTimerId !== null) {
            clearTimeout(config.pongTimerId);
            config.pongTimerId = null;
        }
    };

    const startHeartbeat = () => {
        stopHeartbeat();
        sendPing();
        config.pingTimerId = window.setInterval(sendPing, config.pingInterval);
    };

    const stopHeartbeat = () => {
        if (config.pingTimerId !== null) {
            clearInterval(config.pingTimerId);
            config.pingTimerId = null;
        }
        resetPongTimer();
    };

    return {
        startHeartbeat,
        stopHeartbeat,
        resetPongTimer,
    };
};
