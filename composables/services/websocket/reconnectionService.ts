export interface ReconnectionConfig {
    maxAttempts: number;
    baseDelay: number;
    currentAttempts: number;
    timerId: number | null;
}

export const createReconnectionService = (state: Ref<string>, networkOnline: Ref<boolean>, wasConnectedBeforeOffline: Ref<boolean>) => {
    // Default configuration
    const config: ReconnectionConfig = {
        maxAttempts: 10,
        baseDelay: 2000,
        currentAttempts: 0,
        timerId: null,
    };

    /**
     * Reset reconnection attempt counter
     */
    const resetAttempts = (): void => {
        config.currentAttempts = 0;
    };

    /**
     * Cancel any pending reconnection attempt
     */
    const cancelReconnection = (): void => {
        if (config.timerId !== null) {
            clearTimeout(config.timerId);
            config.timerId = null;
        }
    };

    /**
     * Calculate backoff delay with exponential factor
     */
    const calculateBackoffDelay = (): number => {
        return config.baseDelay * Math.pow(1.5, config.currentAttempts - 1);
    };

    /**
     * Attempt to reconnect to WebSocket
     * @param connectFn - Function to establish a connection
     * @param lobbyId - ID of the lobby to connect to
     */
    const attemptReconnection = (connectFn: (id: string) => Promise<void>, lobbyId: string | null): void => {
        // Don't try to reconnect if we've reached max attempts
        if (config.currentAttempts >= config.maxAttempts) {
            console.warn("Maximum reconnection attempts reached");
            state.value = "disconnected";
            return;
        }

        // Don't attempt reconnection if we're offline
        if (!networkOnline.value) {
            console.warn("Device is offline, pausing reconnection attempts");
            state.value = "reconnecting"; // Keep in reconnecting state
            wasConnectedBeforeOffline.value = true; // Mark for reconnection when back online
            return; // Don't schedule any reconnection attempts
        }

        // Cancel any pending reconnection attempt
        cancelReconnection();

        // Update state and attempt count
        state.value = "reconnecting";
        config.currentAttempts++;

        // Calculate backoff delay
        const delay = calculateBackoffDelay();

        console.info(`Attempting reconnection ${config.currentAttempts}/${config.maxAttempts} in ${delay}ms`);

        // Schedule reconnection attempt
        config.timerId = window.setTimeout(() => {
            if (lobbyId) {
                // Double-check we're still online before attempting
                if (!networkOnline.value) {
                    console.warn("Network went offline during reconnection delay");
                    return;
                }

                connectFn(lobbyId).catch((error) => {
                    console.error("Reconnection attempt failed:", error);
                    // Only try again if we're still online
                    if (networkOnline.value) {
                        attemptReconnection(connectFn, lobbyId); // Try again with increasing backoff
                    }
                });
            } else {
                state.value = "disconnected";
            }
        }, delay);
    };

    return {
        attemptReconnection,
        cancelReconnection,
        resetAttempts,
        config, // Expose config for direct manipulation if needed
    };
};
