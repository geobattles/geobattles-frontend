export const useAppStore = defineStore("app", {
    state: () => ({
        // Add any other state properties here
        _backendEndpoint: undefined as string | undefined,
    }),
    actions: {
        // Add actions here
        setBackendEndpoint(url: string) {
            this._backendEndpoint = url;
        },
    },
    getters: {
        // Add getters here
        backendEndpoint: (state) => {
            if (!state._backendEndpoint) throw new Error("Backend endpoint is not defined. Call setBackendEndpoint first.");
            return state._backendEndpoint;
        },
    },
});
