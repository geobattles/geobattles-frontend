<template>
    <section class="ready-check" :class="{ 'waiting-ready': !replay, 'rematch-ready': replay }" :aria-label="replay ? 'Rematch readiness' : 'Ready check'">
        <div class="ready-heading">
            <h2 v-if="replay">Rematch</h2>
            <span v-else class="ready-caption">Start line</span>
            <span class="badge ready-status" :class="{ 'badge-success': lobby.allPlayersReady }" :aria-live="replay ? 'polite' : undefined"
                ><span class="status-dot" aria-hidden="true" />{{ lobby.readyPlayerCount }} / {{ members.length }} ready</span
            >
            <div v-if="replay && $slots.tools" class="rematch-tools"><slot name="tools" /></div>
        </div>

        <div class="ready-actions">
            <span v-if="!replay && lobby.isPlayerReady" class="ready-confirmation"><span class="status-dot" aria-hidden="true" />{{ showStart ? "Ready" : "You’re ready" }}</span>
            <button
                ref="readyButton"
                class="btn btn-command"
                :class="{
                    'btn-secondary': replay || !lobby.isPlayerReady,
                    'btn-quiet undo-ready': !replay && lobby.isPlayerReady,
                    'ready-prompt': !replay && !lobby.isPlayerReady,
                    'ready-fluid': showReadyLiquid,
                    'is-ready': replay && lobby.isPlayerReady,
                }"
                type="button"
                :aria-label="lobby.isPlayerReady ? (replay ? 'Cancel rematch readiness' : 'Change ready status') : undefined"
                :aria-pressed="replay ? lobby.isPlayerReady : undefined"
                :disabled="!canReady || request.isStartPending"
                :aria-disabled="request.isReadyPending || undefined"
                :aria-busy="request.isReadyPending"
                @click="toggleReady"
            >
                <span v-if="showReadyLiquid" class="ready-liquid" aria-hidden="true">
                    <svg class="ready-surface" viewBox="0 0 240 64" preserveAspectRatio="none" focusable="false">
                        <path d="M0 0H236L202 64H0Z" />
                        <path d="M0 0H227L193 64H0Z" />
                    </svg>
                </span>
                <span v-if="request.isReadyPending" class="spinner" /><UiIcon v-else-if="replay" :name="lobby.isPlayerReady ? 'check' : 'user'" />{{ readyLabel }}
            </button>
            <button
                v-if="showStart"
                ref="startButton"
                class="btn btn-command"
                type="button"
                :disabled="!!blockedReason || request.isStartPending || request.isReadyPending"
                :aria-busy="request.isStartPending"
                :title="blockedReason || undefined"
                @click="start"
            >
                <span v-if="request.isStartPending" class="spinner" /><UiIcon v-else name="arrow" />{{ replay ? "Start New Game" : "Start game" }}
            </button>
        </div>
        <p class="field-help ready-feedback" role="status">{{ feedback }}</p>
    </section>
</template>
<script setup lang="ts">
const props = defineProps<{ replay?: boolean }>();
const lobby = useLobbyStore();
const socket = useWebSocketStore();
const actions = useLobbySocketActions();
const player = usePlayerInfo();
const request = useRequestState();
const readyButton = ref<HTMLButtonElement | null>(null);
const startButton = ref<HTMLButtonElement | null>(null);
const members = computed(() => Object.values(lobby.lobbySettings?.playerList ?? {}));
const me = computed(() => (player.value.ID ? lobby.lobbySettings?.playerList[player.value.ID] : undefined));
const canReady = computed(
    () => socket.isConnected && socket.isOnline && !!me.value?.connected && !lobby.modifySettingsModal && ["WAITING", "FINISHED"].includes(lobby.lobbySettings?.phase ?? "")
);
const showReadyLiquid = computed(() => !props.replay && !lobby.isPlayerReady && canReady.value && !request.isReadyPending && !request.isStartPending);
const blockedReason = computed(() => {
    if (!socket.isConnected || !socket.isOnline) return "Reconnect before starting.";
    if (members.value.some((member) => !member.connected)) return "Waiting for disconnected explorers to return.";
    if (!lobby.allPlayersReady) return "Waiting for every explorer to mark ready.";
    if (lobby.modifySettingsModal) return "Finish reviewing the settings first.";
    return actions.startUnavailableReason;
});
const showStart = computed(() => lobby.isPlayerAdmin() && (props.replay || lobby.allPlayersReady || request.isStartPending));
const readyLabel = computed(() => (lobby.isPlayerReady ? (props.replay ? "Ready · Undo" : "Change") : props.replay ? "Ready for Rematch" : "Ready to Play"));
const feedback = computed(() => {
    if (!props.replay) {
        if (request.isReadyPending) return "Updating readiness…";
        if (request.isStartPending) return "Finding a location…";
        if (!socket.isConnected || !socket.isOnline) return "";
        if (showStart.value) return blockedReason.value || "Everyone is ready.";
        if (lobby.isPlayerReady) return lobby.allPlayersReady ? "Waiting for the host to start." : "Waiting for the other players.";
        return "";
    }
    if (request.isReadyPending) return "Updating readiness…";
    if (request.isStartPending) return "Finding your next location…";
    if (!socket.isConnected || !socket.isOnline) return "Reconnecting…";
    if (!lobby.isPlayerReady) return "";
    if (!lobby.allPlayersReady) return members.value.some((member) => !member.connected) ? "Waiting for players to reconnect." : "Waiting for players.";
    return lobby.isPlayerAdmin() ? blockedReason.value || "Everyone is ready." : "Waiting for the host.";
});
watch(showStart, (visible) => {
    if (visible || document.activeElement !== startButton.value) return;
    void nextTick(() => readyButton.value?.focus({ preventScroll: true }));
});
const toggleReady = () => {
    if (canReady.value && !request.isReadyPending && !request.isStartPending) lobby.setReady(!lobby.isPlayerReady);
};
const start = () => {
    if (!blockedReason.value && !request.isStartPending && !request.isReadyPending) actions.start();
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
.ready-caption {
    font: 700 0.68rem/1.4 var(--gb-font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gb-muted);
}
@media (max-width: 640px), (max-height: 540px) and (orientation: landscape) {
    .ready-caption {
        display: none;
    }
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
.ready-feedback:not(:empty) {
    margin-top: 0.5rem;
}
.waiting-ready .ready-actions {
    margin-top: 0.4rem;
    align-items: center;
}
.ready-confirmation {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--gb-success);
    font-weight: 700;
    font-size: 0.8rem;
}
.waiting-ready .ready-actions > .undo-ready {
    flex: 0 1 auto;
    min-height: 44px;
    letter-spacing: normal;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 0.2em;
}
.ready-prompt {
    border-color: var(--gb-line);
    background: var(--gb-bg);
}
.ready-actions > .ready-fluid {
    --ready-amber: #ffca62;
    --ready-honey: #d69b40;
    --ready-ink: #201908;
    position: relative;
    isolation: isolate;
    border-color: var(--ready-honey);
    background: var(--ready-amber) linear-gradient(115deg, var(--ready-amber) 12%, var(--ready-honey));
    color: var(--ready-ink);
}
.ready-actions > .ready-fluid:not(:disabled):hover {
    background: #ffdc8b linear-gradient(115deg, #ffdc8b, var(--ready-amber));
    color: var(--ready-ink);
}
.ready-actions > .ready-fluid:focus-visible {
    outline: 2px solid var(--ready-ink);
    outline-offset: -4px;
}
.ready-liquid {
    position: absolute;
    z-index: -1;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
}
.ready-surface {
    position: absolute;
    inset: 0;
    width: 120%;
    height: 100%;
    transform: translateX(-73%);
}
.ready-surface path:first-child {
    fill: #fff6;
}
.ready-surface path:last-child {
    fill: #fff3;
}
@media (prefers-reduced-motion: no-preference) {
    .ready-surface {
        animation: ready-flow 6.4s ease-in-out infinite;
    }
}
@keyframes ready-flow {
    0% {
        opacity: 1;
        transform: translateX(-91%);
    }
    68% {
        opacity: 1;
        transform: translateX(-3%);
    }
    88%,
    100% {
        opacity: 0;
        transform: translateX(-3%);
    }
}
.ready-actions > [aria-disabled="true"] {
    opacity: 0.65;
    cursor: wait;
}
.rematch-ready .ready-heading {
    gap: 0.3rem;
}
.rematch-tools {
    display: flex;
    gap: 0.25rem;
    margin-inline-start: auto;
}
.rematch-ready h2 {
    color: #effbe9;
    font-size: clamp(0.85rem, 2.1vw, 1.1rem);
}
.rematch-ready .ready-actions {
    gap: 0.35rem;
    margin-top: 0.35rem;
}
.rematch-ready .ready-actions > button {
    min-height: 44px;
    min-width: 0;
    padding: 0.32rem 0.58rem;
    border-radius: 999px;
    font-size: clamp(0.72rem, 1.7vw, 0.93rem);
    letter-spacing: normal;
    line-height: 1.2;
}
.rematch-ready .ready-actions > button:enabled:not(.is-ready) {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
}
.rematch-ready .ready-feedback:not(:empty) {
    margin-top: 0.32rem;
    font-size: 0.72rem;
    line-height: 1.25;
}
@media (orientation: landscape) and (max-height: 420px) {
    .rematch-ready .ready-actions > button {
        font-size: 0.75rem;
    }
}
</style>
