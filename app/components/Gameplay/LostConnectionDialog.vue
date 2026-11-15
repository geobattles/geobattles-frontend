<template>
    <div v-if="lost">
        <button v-if="dismissed" type="button" class="recovery-pill btn btn-secondary" @click="dismissed = false">
            <UiIcon name="wifi" />{{ socket.isRecovering ? "Reconnecting…" : "Connection lost" }}
        </button>
        <UiDialog class="recovery-dialog" :open="!dismissed" :title="title" @update:open="dismissed = !$event">
            <p class="recovery-description">{{ description }}</p>
            <p v-if="socket.isRecovering && socket.recoverySecondsRemaining > 0" class="recovery-status" role="status">
                <span class="spinner" aria-hidden="true" />{{ socket.recoverySecondsRemaining }}s remaining
            </p>
            <div class="recovery-actions">
                <button v-if="missingLobby" type="button" class="btn" :disabled="retrying || !socket.isOnline" :aria-busy="retrying" @click="createNewLobby">
                    <span v-if="retrying" class="spinner" />New lobby
                </button>
                <button v-else-if="socket.isRecovering" type="button" class="btn" @click="dismissed = true">Keep waiting</button>
                <button v-else type="button" class="btn" :disabled="!socket.isOnline || retrying" :aria-busy="retrying" @click="retry">
                    <span v-if="retrying" class="spinner" />Retry
                </button>
                <button class="btn btn-secondary" type="button" @click="emit('leaveLobby')">Home</button>
            </div>
        </UiDialog>
    </div>
</template>
<script setup lang="ts">
const emit = defineEmits<{ leaveLobby: [] }>();
const socket = useWebSocketStore();
const route = useRoute();
const router = useRouter();
const recovery = useLobbyRecovery();
const toast = useToast();
const dismissed = ref(false);
const retrying = ref(false);
const lobby = useLobbyStore();
const missingLobby = computed(() => socket.connectionError?.code === "LOBBY_NOT_FOUND");
const connectingSlowly = ref(false);
let connectingTimer: ReturnType<typeof setTimeout> | undefined;
watch(
    () => socket.connectionState,
    (state) => {
        clearTimeout(connectingTimer);
        connectingSlowly.value = false;
        // Normal admission is not a lost connection. Only a slow initial
        // connection needs a dialog; the inline status stays live.
        if (state === "connecting") connectingTimer = setTimeout(() => (connectingSlowly.value = true), 1500);
    },
    { immediate: true }
);
onBeforeUnmount(() => clearTimeout(connectingTimer));
const lost = computed(() => !socket.isOnline || socket.connectionState === "reconnecting" || connectingSlowly.value || !!socket.connectionError);
const title = computed(() =>
    missingLobby.value
        ? "Lobby closed"
        : !socket.isOnline
          ? "You’re offline"
          : socket.connectionState === "connecting"
            ? "Connecting…"
            : socket.isRecovering
              ? "Reconnecting…"
              : "Connection lost"
);
const description = computed(() =>
    missingLobby.value
        ? "This lobby is no longer available."
        : !socket.isOnline
          ? socket.isRecovering
              ? "Check your internet connection. We’ll retry automatically."
              : "Connect to the internet, then try again."
          : socket.isRecovering
            ? "We’re restoring your place. No need to refresh."
            : "Couldn’t reconnect. Try again or return home."
);
const createNewLobby = async () => {
    if (retrying.value || !socket.isOnline) return;
    retrying.value = true;
    try {
        // Commit leaving the missing membership before creating its replacement.
        const failure = await router.push("/");
        if (!failure) await lobby.createLobby();
    } catch {
        if (!socket.connectionError) toast.add({ severity: "error", summary: "Couldn’t create lobby", detail: "Please try again from Home." });
    } finally {
        retrying.value = false;
    }
};
watch([lost, missingLobby], () => {
    dismissed.value = false;
});
const retry = async () => {
    const id = routeLobbyId(route);
    if (!id || retrying.value || !socket.isOnline) return;
    retrying.value = true;
    try {
        // An explicit same-lobby route commit, not an automatic new retry budget.
        const failure = await router.replace({ path: route.path, query: { ...route.query, reconnect: String(Date.now()) } });
        if (failure) return;
        await recovery.restore(id);
    } catch {
        // The recovery dialog already owns a terminal socket failure.
        if (!socket.connectionError) toast.add({ severity: "error", summary: "Couldn’t reconnect", detail: "Please try again." });
    } finally {
        retrying.value = false;
    }
};
</script>
<style scoped>
.recovery-dialog {
    width: min(360px, calc(100% - 1rem));
}
.recovery-dialog :deep(.ui-dialog-inner) {
    padding: 0.875rem;
}
.recovery-dialog :deep(.ui-dialog-header) {
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
}
.recovery-dialog :deep(.ui-dialog-header h2) {
    font-size: 1.1rem;
    line-height: 1.3;
    letter-spacing: -0.02em;
}
.recovery-dialog :deep(.ui-dialog-header > .btn) {
    width: 44px;
    height: 44px;
    flex: none;
    padding: 0;
}
.recovery-description {
    color: var(--gb-muted);
    font-size: 0.8125rem;
    line-height: 1.5;
    margin: 0;
}
.recovery-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--gb-muted);
    font-size: 0.75rem;
    margin-top: 0.625rem;
    font-variant-numeric: tabular-nums;
}
.recovery-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.875rem;
}
.recovery-actions > .btn {
    flex: 1;
    min-height: 44px;
    min-width: 0;
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
}
.recovery-pill {
    position: fixed;
    z-index: 50;
    top: 7rem;
    left: 0.5rem;
    max-width: calc(100% - 1rem);
    min-height: 44px;
    font-size: 0.75rem;
    box-shadow: 0 6px 30px #0005;
    background: var(--gb-surface);
}
</style>
