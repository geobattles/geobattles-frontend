<template>
    <section class="ready-check" aria-label="Ready check">
        <div class="ready-heading">
            <h2>Ready check</h2>
            <span class="badge ready-status" :class="{ 'badge-success': lobby.allPlayersReady }"
                ><span class="status-dot" aria-hidden="true" />{{ lobby.readyPlayerCount }} / {{ members.length }} ready</span
            >
        </div>

        <div class="ready-actions">
            <button
                class="btn btn-secondary btn-command"
                :class="{ 'is-ready': lobby.isPlayerReady }"
                type="button"
                :aria-pressed="lobby.isPlayerReady"
                :disabled="!canReady || request.isReadyPending || request.isStartPending"
                :aria-busy="request.isReadyPending"
                @click="lobby.setReady(!lobby.isPlayerReady)"
            >
                <span v-if="request.isReadyPending" class="spinner" /><UiIcon v-else :name="lobby.isPlayerReady ? 'check' : 'user'" />{{
                    lobby.isPlayerReady ? "Not ready" : "Ready"
                }}
            </button>
            <button
                v-if="lobby.isPlayerAdmin()"
                class="btn btn-command"
                type="button"
                :disabled="!!blockedReason || request.isStartPending || request.isReadyPending"
                :aria-busy="request.isStartPending"
                :title="blockedReason || undefined"
                @click="start"
            >
                <span v-if="request.isStartPending" class="spinner" /><UiIcon v-else name="arrow" />{{ replay ? "New game" : "Start game" }}
            </button>
        </div>
        <p class="field-help mt-2" :class="{ 'routine-feedback': feedback === 'Waiting for every explorer to mark ready.' }" role="status">{{ feedback }}</p>
    </section>
</template>
<script setup lang="ts">
const props = defineProps<{ replay?: boolean }>();
const lobby = useLobbyStore();
const socket = useWebSocketStore();
const player = usePlayerInfo();
const request = useRequestState();
const members = computed(() => Object.values(lobby.lobbySettings?.playerList ?? {}));
const me = computed(() => (player.value.ID ? lobby.lobbySettings?.playerList[player.value.ID] : undefined));
const canReady = computed(
    () => socket.isConnected && socket.isOnline && !!me.value?.connected && !lobby.modifySettingsModal && ["WAITING", "FINISHED"].includes(lobby.lobbySettings?.phase ?? "")
);
const blockedReason = computed(() => {
    if (!socket.isConnected || !socket.isOnline) return "Reconnect before starting.";
    if (members.value.some((member) => !member.connected)) return "Waiting for disconnected explorers to return.";
    if (!lobby.allPlayersReady) return "Waiting for every explorer to mark ready.";
    if (lobby.modifySettingsModal) return "Finish reviewing the settings first.";
    return socket.startUnavailableReason;
});
const feedback = computed(() => {
    if (request.isReadyPending) return "Waiting for the server to confirm your ready status…";
    if (request.isStartPending) return "Finding your next location…";
    if (blockedReason.value) return blockedReason.value;
    if (!lobby.isPlayerAdmin()) return "Everyone is ready. Your host can start the expedition.";
    return props.replay ? "Everyone is ready for a new game." : "The crew is ready. Let’s explore.";
});
const start = () => {
    if (!blockedReason.value && !request.isStartPending && !request.isReadyPending) socket.sendMessage({ command: SOCKET_COMMANDS.START });
};
</script>
<style scoped>
.ready-heading {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}
.ready-heading h2 {
    font-size: 1rem;
    font-weight: 800;
}
.ready-status {
    font-variant-numeric: tabular-nums;
    background: var(--gb-bg);
    font-size: 0.7rem;
}
.ready-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
}
.ready-actions > button {
    flex: 1;
    min-height: 52px;
    font-weight: 800;
}
.ready-actions > button:last-child:not(:first-child) {
    flex: 1.3;
}
.is-ready {
    border-color: var(--gb-accent-end);
    color: var(--gb-accent);
    background: var(--gb-bg);
    box-shadow: inset 0 -2px var(--gb-accent-end);
}
.ready-check > .field-help {
    font-size: 0.75rem;
    line-height: 1.4;
}
</style>
