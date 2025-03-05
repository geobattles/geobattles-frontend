export interface NetworkStatus {
    isOnline: Ref<boolean>;
}

/**
 * Create network status utility to handle online/offline events
 */
export const createNetworkUtils = (networkOnline: Ref<boolean>, onOfflineCallback?: () => void, onOnlineCallback?: () => void) => {
    /**
     * Handle device going offline
     */
    const handleOffline = (): void => {
        console.warn("Device went offline, suspending connection");
        networkOnline.value = false;

        if (onOfflineCallback) {
            onOfflineCallback();
        }
    };

    /**
     * Handle device coming back online
     */
    const handleOnline = (): void => {
        console.info("Device back online, checking connection");
        networkOnline.value = true;

        if (onOnlineCallback) {
            onOnlineCallback();
        }
    };

    /**
     * Set up network status event listeners
     */
    const setupNetworkListeners = (): void => {
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
    };

    /**
     * Remove network status event listeners
     */
    const removeNetworkListeners = (): void => {
        console.log("Removing network status listeners");
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
    };

    return {
        setupNetworkListeners,
        removeNetworkListeners,
        networkStatus: {
            isOnline: networkOnline,
        },
    };
};
