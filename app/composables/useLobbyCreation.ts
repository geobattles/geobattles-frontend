export const useLobbyCreation = () => {
    const auth = useAuthStore();
    const { createLobby } = useLobbyStore();
    const toast = useToast();
    const creating = ref(false);
    const awaitingAuth = ref(false);
    let active = true;

    const create = async () => {
        if (!active || creating.value) return;
        if (!auth.isAuthenticated) {
            awaitingAuth.value = true;
            auth.openLoginDialog("guest");
            return;
        }
        awaitingAuth.value = false;
        creating.value = true;
        try {
            await createLobby();
        } catch (cause) {
            if (active) toast.add({ severity: "error", summary: "Could not create a lobby", detail: cause instanceof Error ? cause.message : "Please try again." });
        } finally {
            if (active) creating.value = false;
        }
    };

    watch(
        () => auth.isAuthenticated,
        (signedIn) => {
            if (signedIn && awaitingAuth.value) void create();
        }
    );
    watch(
        () => auth.isLoginDialog,
        (open) => {
            if (!open && !auth.isAuthenticated) awaitingAuth.value = false;
        }
    );
    onBeforeUnmount(() => {
        active = false;
        awaitingAuth.value = false;
    });

    return { create, creating, awaitingAuth };
};
