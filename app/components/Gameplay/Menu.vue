<template>
    <div class="game-menu" :class="{ 'is-compact': compact }">
        <div class="round-meta">
            <p class="round-label">
                <span class="round-word">Round </span><strong>{{ lobby.lobbySettings?.currentRound || 0 }}</strong> / {{ lobby.lobbySettings?.conf.numRounds || 0 }}
            </p>
            <SocketConnectionStatus class="game-connection" v-if="!compact && (game.modeLogic.currentState === 'STARTING' || game.modeLogic.currentState === 'PLAYING')" />
        </div>
        <button class="btn btn-quiet btn-icon" type="button" aria-label="Leave lobby" title="Leave lobby" @click="emit('leaveLobbyClicked')"><UiIcon name="leave" /></button>
    </div>
</template>
<script setup lang="ts">
defineProps<{ compact?: boolean }>();
const emit = defineEmits<{ leaveLobbyClicked: [] }>();
const lobby = useLobbyStore();
const game = useGameMode();
</script>
<style scoped>
.game-menu {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
}
.round-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-left: 4px;
}
.round-label {
    font: 500 0.72rem / 1.25 var(--gb-font-mono);
    color: var(--gb-muted);
    margin: 0;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}
.round-word {
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.round-label strong {
    color: var(--gb-accent);
    font-weight: 800;
    font-size: 1.15rem;
}
.is-compact .round-label strong {
    font-size: 0.95rem;
}
.game-connection {
    font-size: 0.65rem;
    width: auto;
    padding: 0.2rem 0.45rem;
    border: 0;
    background: none;
}
.game-menu > button {
    border-left-color: var(--gb-line);
    border-radius: 0;
    flex: none;
    width: 44px;
    height: 44px;
    padding: 0;
}
@media (max-width: 400px) {
    .round-word {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }
}
</style>
