<template>
    <button
        v-if="available && !headless"
        :class="menuItem ? 'end-match-menu-item' : 'end-match-control'"
        type="button"
        aria-haspopup="dialog"
        aria-label="End match early"
        title="End match early"
        :disabled="!socket.isConnected || !socket.isOnline"
        @click="open"
    >
        <UiIcon name="flag" />
        <span v-if="menuItem">End match early</span>
    </button>
    <UiDialog class="end-match-dialog" :open="!!confirmation" title="End match early?" :eyebrow="roundEyebrow" @update:open="confirmation = null">
        <p class="end-match-copy">
            {{ phase === "PLAYING" ? "The current round will be scored using the guesses already submitted." : "The completed rounds will count toward the final standings." }}
            Everyone will go to the final standings and can prepare for a rematch.
        </p>
        <div class="end-match-actions">
            <button class="scenic-button scenic-button-primary" type="button" autofocus @click="confirmation = null">Keep playing</button>
            <button class="scenic-button scenic-button-danger" type="button" :disabled="!socket.isConnected || !socket.isOnline" @click="end">
                <UiIcon name="flag" />End match
            </button>
        </div>
    </UiDialog>
</template>

<script setup lang="ts">
const props = defineProps<{ phase: "PLAYING" | "MID-ROUND"; menuItem?: boolean; headless?: boolean }>();
const emit = defineEmits<{ opened: [] }>();
const { lobbySettings } = useLobbyState();
const player = usePlayerInfo();
const socket = useWebSocketStore();
const actions = useLobbySocketActions();
const confirmation = ref<{ gameId: string; round: number } | null>(null);
const available = computed(() => {
    const room = lobbySettings.value;
    return !!room?.gameId && room.phase === props.phase && !room.spectating && room.admin === player.value.ID;
});
const roundEyebrow = computed(() => {
    const room = lobbySettings.value;
    if (!room) return undefined;
    return `Round ${room.currentRound} of ${room.conf.numRounds}`;
});
const open = () => {
    const room = lobbySettings.value;
    if (available.value && room?.gameId) {
        confirmation.value = { gameId: room.gameId, round: room.currentRound };
        emit("opened");
    }
};
const end = () => {
    const match = confirmation.value;
    if (match && available.value && actions.endGame(match.gameId, match.round)) confirmation.value = null;
};
watch([available, () => lobbySettings.value?.gameId, () => lobbySettings.value?.currentRound], () => (confirmation.value = null));
defineExpose({ open, available, disabled: computed(() => !socket.isConnected || !socket.isOnline) });
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
.end-match-menu-item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    inline-size: 100%;
    min-block-size: 42px;
    padding: 0.45rem 0.7rem;
    border: 0;
    border-radius: 0.7rem;
    background: transparent;
    color: #ffdd9e;
    font-size: 0.84rem;
    font-weight: 700;
    text-align: start;
    white-space: nowrap;
}
.end-match-menu-item:enabled:hover {
    background: #ffca6224;
}
.end-match-menu-item:disabled {
    opacity: 0.5;
}
.end-match-dialog[open] {
    width: min(27rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    border-color: #6fb6949c;
    border-radius: 1.35rem;
    background:
        url("/images/atlas-relief.svg") center bottom / 26rem auto no-repeat,
        linear-gradient(155deg, #0b332af2, #05201bf7);
    box-shadow:
        0 1.4rem 4.2rem #00130fc7,
        inset 0 1px #e2ffd024;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}
.end-match-dialog::backdrop {
    background: #021714b8;
    backdrop-filter: blur(3px);
}
.end-match-dialog :deep(.ui-dialog-inner) {
    display: grid;
    gap: 0.75rem;
    padding: clamp(1rem, 4vw, 1.45rem);
}
.end-match-dialog :deep(.ui-dialog-header) {
    align-items: center;
    margin: 0;
}
.end-match-dialog :deep(.ui-dialog-header .eyebrow) {
    margin-block-end: 0.28rem;
    color: #d8fda8;
}
.end-match-dialog :deep(.ui-dialog-header h2) {
    font: italic 900 clamp(1.5rem, 5.5vw, 2rem) / 1.08 var(--gb-font-display);
    letter-spacing: -0.04em;
}
.end-match-dialog :deep(.ui-dialog-header button) {
    border-radius: 50%;
    background: #a4ecd316;
}
.end-match-dialog :deep(.ui-dialog-header button:hover) {
    background: #a4ecd328;
}
.end-match-copy {
    color: #cde3d7;
    font-size: 0.9rem;
    line-height: 1.48;
}
.end-match-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
    margin-block-start: 0.35rem;
}
.end-match-actions button {
    padding-inline: 0.65rem;
}
@media (orientation: landscape) and (max-height: 380px) {
    .end-match-control {
        inline-size: 40px;
        block-size: 40px;
    }
}
</style>
