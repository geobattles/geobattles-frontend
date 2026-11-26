<template>
    <button
        v-if="available"
        class="end-match-control"
        type="button"
        aria-haspopup="dialog"
        aria-label="End match early"
        title="End match early"
        :disabled="!socket.isConnected || !socket.isOnline"
        @click="open"
    >
        <UiIcon name="flag" />
    </button>
    <UiDialog :open="!!confirmation" title="End match early?" @update:open="confirmation = null">
        <p class="muted">
            {{ phase === "PLAYING" ? "The current round will be scored using the guesses already submitted." : "The completed rounds will count toward the final standings." }}
            Everyone will go to the final standings and can prepare for a rematch.
        </p>
        <div class="end-match-actions">
            <button class="btn btn-secondary" type="button" @click="confirmation = null">Keep playing</button>
            <button class="btn btn-danger" type="button" :disabled="!socket.isConnected || !socket.isOnline" @click="end">End match</button>
        </div>
    </UiDialog>
</template>

<script setup lang="ts">
const props = defineProps<{ phase: "PLAYING" | "MID-ROUND" }>();
const { lobbySettings } = useLobbyState();
const player = usePlayerInfo();
const socket = useWebSocketStore();
const actions = useLobbySocketActions();
const confirmation = ref<{ gameId: string; round: number } | null>(null);
const available = computed(() => {
    const room = lobbySettings.value;
    return !!room?.gameId && room.phase === props.phase && !room.spectating && room.admin === player.value.ID;
});
const open = () => {
    const room = lobbySettings.value;
    if (available.value && room?.gameId) confirmation.value = { gameId: room.gameId, round: room.currentRound };
};
const end = () => {
    const match = confirmation.value;
    if (match && available.value && actions.endGame(match.gameId, match.round)) confirmation.value = null;
};
watch([available, () => lobbySettings.value?.gameId, () => lobbySettings.value?.currentRound], () => (confirmation.value = null));
</script>

<style scoped>
.end-match-control {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: 44px;
    block-size: 44px;
    border: 1px solid #e5b68e55;
    border-radius: 0.65rem;
    background: #3d302780;
    color: #ffdbc0;
}
.end-match-control:enabled:hover {
    background: #5a3d2e;
}
.end-match-control:disabled {
    opacity: 0.52;
}
.end-match-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 0.5rem;
    margin-block-start: 1.25rem;
}
@media (orientation: landscape) and (max-height: 380px) {
    .end-match-control {
        inline-size: 40px;
        block-size: 40px;
    }
}
</style>
