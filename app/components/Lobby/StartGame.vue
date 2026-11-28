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

        <div class="ready-actions" :class="{ 'has-start': showStart }">
            <button
                ref="readyButton"
                class="btn btn-command"
                :class="{
                    'btn-secondary': !lobby.isPlayerReady,
                    'undo-ready': lobby.isPlayerReady,
                    'ready-prompt': !lobby.isPlayerReady,
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
                <span v-if="request.isReadyPending" class="spinner" />
                <template v-else-if="lobby.isPlayerReady">
                    <UiIcon name="check" class="undo-check" />
                    <span class="undo-label">{{ showStart ? "Ready" : "You’re ready" }}</span>
                    <span class="undo-badge" aria-hidden="true"><UiIcon name="close" /></span>
                </template>
                <template v-else>{{ readyLabel }}</template>
            </button>
            <Transition name="start-reveal">
                <button
                    v-if="showStart"
                    ref="startButton"
                    class="btn btn-command start-game-btn"
                    type="button"
                    :disabled="!!blockedReason || request.isStartPending || request.isReadyPending"
                    :aria-busy="request.isStartPending"
                    :title="blockedReason || undefined"
                    @click="start"
                >
                    <span v-if="request.isStartPending" class="spinner" /><UiIcon v-else name="arrow" />{{ replay ? "Start New Game" : "Start game" }}
                </button>
            </Transition>
        </div>
        <Transition name="feedback-fade" mode="out-in">
            <p v-if="feedback" :key="feedback" class="field-help ready-feedback" role="status">{{ feedback }}</p>
        </Transition>
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
const members = computed(() => Object.values(lobby.lobbySettings?.playerList ?? {}).filter((member) => member.connected || member.ready));
const me = computed(() => (player.value.ID ? lobby.lobbySettings?.playerList[player.value.ID] : undefined));
const canReady = computed(
    () => socket.isConnected && socket.isOnline && !!me.value?.connected && !lobby.modifySettingsModal && ["WAITING", "FINISHED"].includes(lobby.lobbySettings?.phase ?? "")
);
const showReadyLiquid = computed(() => !lobby.isPlayerReady && canReady.value && !request.isReadyPending && !request.isStartPending);
const blockedReason = computed(() => {
    if (!socket.isConnected || !socket.isOnline) return "Reconnect before starting.";
    if (!lobby.allPlayersReady) return "Waiting for every explorer to mark ready.";
    if (lobby.modifySettingsModal) return "Finish reviewing the settings first.";
    return actions.startUnavailableReason;
});
const showStart = computed(() => lobby.isPlayerAdmin() && (lobby.allPlayersReady || request.isStartPending));
const readyLabel = computed(() => (props.replay ? "Ready for Rematch" : "Ready to Play"));
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
    if (!lobby.isPlayerReady) return me.value?.rematchSeat ? "Your rematch seat is open." : "";
    if (!lobby.allPlayersReady) return "Waiting for players.";
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
    gap: 0.42rem;
    align-items: stretch;
    flex-wrap: nowrap;
    margin-top: 0.4rem;
}
.ready-actions > button {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 48px;
    border-radius: 999px;
    font-weight: 800;
    white-space: nowrap;
    transition:
        background 220ms ease,
        border-color 220ms ease,
        color 200ms ease,
        box-shadow 220ms ease,
        transform 140ms ease;
}
.ready-actions > .undo-ready {
    flex: 1 1 auto;
    min-height: 44px;
    gap: 0.42rem;
    padding: 0.25rem 0.52rem 0.25rem 0.8rem;
    border: 1px solid #70d9af66;
    border-radius: 999px;
    background: linear-gradient(145deg, #134436e8, #082921f0);
    box-shadow:
        inset 0 1px #c8ffe422,
        0 4px 14px #00140f40;
    color: #bdf8da;
    font-size: 0.82rem;
    font-weight: 760;
    letter-spacing: normal;
}
.ready-actions.has-start > .undo-ready {
    flex: 0 0 auto;
}
.ready-actions > .undo-ready:enabled:hover {
    border-color: #a4f5cf99;
    background: linear-gradient(145deg, #1b5645f2, #0d362cf5);
    color: #e6fff2;
}
.ready-actions > .undo-ready:enabled:active {
    transform: scale(0.975);
}
.ready-check > .field-help {
    font-size: 0.75rem;
    line-height: 1.4;
}
.ready-feedback:not(:empty) {
    margin-top: 0.45rem;
}
.undo-check {
    width: 0.95rem;
    height: 0.95rem;
    color: #70e5a8;
    flex: none;
}
.undo-badge {
    display: inline-grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    margin-inline-start: 0.1rem;
    border-radius: 50%;
    background: #ffffff14;
    color: #a8d8c5;
    transition:
        background-color 140ms ease,
        color 140ms ease;
}
.undo-badge .ui-icon {
    width: 0.72rem;
    height: 0.72rem;
}
.undo-ready:enabled:hover .undo-badge {
    background: #ff998930;
    color: #ffd0ad;
}
.start-reveal-enter-active,
.start-reveal-leave-active {
    overflow: hidden;
    transition:
        max-width 280ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 220ms ease,
        transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
        padding 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.start-reveal-enter-from,
.start-reveal-leave-to {
    max-width: 0;
    opacity: 0;
    padding-inline: 0;
    transform: translateX(10px) scale(0.96);
}
.start-reveal-enter-to,
.start-reveal-leave-from {
    max-width: 28rem;
    opacity: 1;
    transform: translateX(0) scale(1);
}
.feedback-fade-enter-active,
.feedback-fade-leave-active {
    transition:
        opacity 180ms ease,
        transform 180ms ease;
}
.feedback-fade-enter-from {
    opacity: 0;
    transform: translateY(3px);
}
.feedback-fade-leave-to {
    opacity: 0;
    transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
    .start-reveal-enter-active,
    .start-reveal-leave-active,
    .feedback-fade-enter-active,
    .feedback-fade-leave-active,
    .ready-actions > button {
        transition: none;
    }
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
    flex-wrap: nowrap;
    gap: 0.38rem;
    margin-top: 0.35rem;
}
.rematch-ready .ready-actions > button {
    min-height: 44px;
    min-width: 0;
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    font-size: clamp(0.74rem, 1.6vw, 0.88rem);
    letter-spacing: normal;
    line-height: 1.15;
}
.rematch-ready .ready-actions > .undo-ready {
    padding: 0.25rem 0.5rem 0.25rem 0.78rem;
}
.rematch-ready .ready-actions > .ready-prompt:not(:has(.spinner))::before {
    content: "";
    width: 0;
    height: 0;
    margin-inline-end: 0.12rem;
    border-block: 0.36rem solid transparent;
    border-inline-start: 0.56rem solid currentColor;
}
.rematch-ready .ready-actions > .ready-fluid,
.rematch-ready .ready-actions > .start-game-btn:enabled {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow: var(--gb-scenic-action-shadow);
}
.rematch-ready .ready-actions > .ready-fluid:enabled:hover,
.rematch-ready .ready-actions > .start-game-btn:enabled:hover {
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow: var(--gb-scenic-action-hover-shadow);
}
.rematch-ready .ready-feedback:not(:empty) {
    margin-top: 0.32rem;
    font-size: 0.72rem;
    line-height: 1.25;
}
@media (max-width: 400px) {
    .rematch-ready .ready-actions > button {
        padding-inline: 0.52rem;
        font-size: clamp(0.7rem, 3.1vw, 0.8rem);
    }
    .rematch-ready .ready-actions > .undo-ready {
        padding-inline: 0.68rem 0.45rem;
    }
}
@media (orientation: landscape) and (max-height: 420px) {
    .rematch-ready .ready-actions > button {
        padding-inline: 0.52rem;
        font-size: 0.75rem;
    }
    .rematch-ready .ready-actions > .undo-ready {
        padding-inline: 0.65rem 0.44rem;
    }
}
</style>
