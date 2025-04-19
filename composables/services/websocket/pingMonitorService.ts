export interface PingMonitorConfig {
    pingTimeout: number;
    monitorTimerId: number | null;
    lastPingTime: number | null;
}

export const createPingMonitorService = (connection: Ref<WebSocket | null>, state: Ref<string>, reconnect: (id: string) => void, lobbyId: Ref<string | null>) => {
    const config: PingMonitorConfig = {
        pingTimeout: 12000, // 8 seconds timeout for server ping
        monitorTimerId: null,
        lastPingTime: null,
    };

    // Process ping from server and respond with pong
    const handlePing = () => {
        config.lastPingTime = Date.now();

        if (connection.value && connection.value.readyState === WebSocket.OPEN) {
            connection.value.send(JSON.stringify({ command: "pong" }));
        }
    };

    // Start monitoring for ping messages
    const startMonitoring = () => {
        stopMonitoring();
        config.lastPingTime = Date.now(); // Initialize with current time

        config.monitorTimerId = window.setInterval(() => {
            const now = Date.now();

            // If we haven't received a ping in the timeout period
            if (config.lastPingTime && now - config.lastPingTime > config.pingTimeout) {
                console.warn(`No ping received from server for ${config.pingTimeout}ms - connection may be lost`);

                // Close the connection which will trigger reconnection logic
                if (connection.value) {
                    connection.value.close(4000, "Ping timeout");
                }

                // If lobbyId exists, try to reconnect immediately
                if (lobbyId.value && state.value !== "reconnecting") {
                    reconnect(lobbyId.value);
                }

                // Reset last ping time to avoid multiple reconnection attempts
                config.lastPingTime = now;
            }
        }, 2000); // Check every 2 seconds
    };

    // Stop the monitoring interval
    const stopMonitoring = () => {
        if (config.monitorTimerId !== null) {
            clearInterval(config.monitorTimerId);
            config.monitorTimerId = null;
        }
        config.lastPingTime = null;
    };

    return {
        handlePing,
        startMonitoring,
        stopMonitoring,
        config, // Expose for testing/debugging
    };
};
