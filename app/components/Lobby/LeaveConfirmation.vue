<template>
    <UiDialog
        class="leave-confirmation"
        :open="prompt !== null"
        title="Leave lobby?"
        :eyebrow="prompt ? 'Lobby ' + prompt.code : undefined"
        :description="prompt?.inMatch ? 'The match can continue while you’re away.' : 'Use the lobby code if you want to return.'"
        @update:open="emit('decide', false)"
    >
        <div class="leave-scene" aria-hidden="true">
            <svg viewBox="0 0 320 112" fill="none" focusable="false">
                <path class="leave-contours" d="M0 64c72 20 87-55 164-34 65 18 94 18 156-2M0 75c70 16 93-52 165-31 66 18 102 16 155-3M0 86c68 12 95-45 164-29 68 16 112 12 156-4" />
                <path class="leave-trail" d="M39 80c31 14 48-16 74-21 31-6 54 22 78 13 27-10 27-34 52-39" />
                <circle cx="39" cy="80" r="5" class="leave-origin" />
                <circle cx="256" cy="32" r="22" class="leave-destination" />
                <path class="leave-arrow" d="M245 32h22m-9-9 9 9-9 9" />
            </svg>
        </div>
        <p v-if="prompt?.name" class="leave-room"><UiIcon name="users" />{{ prompt.name }}</p>
        <div class="leave-actions">
            <button type="button" class="scenic-button scenic-button-primary" autofocus @click="emit('decide', false)">Stay in lobby</button>
            <button type="button" class="scenic-button scenic-button-danger" @click="emit('decide', true)"><UiIcon name="leave" />Leave lobby</button>
        </div>
    </UiDialog>
</template>

<script setup lang="ts">
import type { LobbyLeavePrompt } from "~/composables/lobbyRecovery";

defineProps<{ prompt: LobbyLeavePrompt | null }>();
const emit = defineEmits<{ decide: [confirmed: boolean] }>();
</script>

<style scoped>
.leave-confirmation[open] {
    width: min(29rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    border-color: #6fb6949c;
    border-radius: 1.4rem;
    background: #072923;
    box-shadow: 0 1.6rem 5rem #00130fc7;
}
.leave-confirmation::backdrop {
    background: #021714b8;
}
.leave-confirmation :deep(.ui-dialog-inner) {
    display: grid;
    grid-template-areas: "scene" "heading" "room" "description" "actions";
    gap: 0.65rem;
    padding: clamp(0.95rem, 4vw, 1.45rem);
}
.leave-confirmation :deep(.ui-dialog-header) {
    grid-area: heading;
    margin: 0;
}
.leave-confirmation :deep(.ui-dialog-header h2) {
    font: italic 900 clamp(1.7rem, 6.3vw, 2.4rem) / 1.07 var(--gb-font-display);
    letter-spacing: -0.045em;
}
.leave-confirmation :deep(.ui-dialog-header .eyebrow) {
    margin-block-end: 0.35rem;
    color: #d8fda8;
}
.leave-confirmation :deep(.ui-dialog-header button) {
    border-radius: 50%;
    background: #a4ecd311;
}
.leave-confirmation :deep(.ui-dialog-inner > .muted) {
    grid-area: description;
    margin: 0;
    color: #c8dfd5;
}
.leave-scene {
    grid-area: scene;
    overflow: hidden;
    border: 1px solid #80d3a84d;
    border-radius: 0.85rem;
    background:
        linear-gradient(110deg, #04231a78, #07332be0),
        url("/images/emerald-horizon.webp") center 41% / cover;
}
.leave-scene svg {
    display: block;
    width: 100%;
    max-height: 7.25rem;
}
.leave-contours {
    stroke: #baf3c05c;
    stroke-width: 0.8;
}
.leave-trail {
    stroke: #d9ffa0;
    stroke-width: 2.3;
    stroke-dasharray: 4 6;
    stroke-linecap: round;
}
.leave-origin {
    fill: #d9ffa0;
}
.leave-destination {
    fill: #69352dd4;
    stroke: #ff9989;
    filter: drop-shadow(0 0 6px #f77b677d);
}
.leave-arrow {
    stroke: #ffd6c5;
    stroke-width: 2.6;
    stroke-linejoin: round;
    stroke-linecap: round;
}
.leave-room {
    grid-area: room;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: #eefaf2;
    font-size: 0.88rem;
    font-weight: 700;
    overflow-wrap: anywhere;
}
.leave-room .ui-icon {
    color: var(--gb-success);
}
.leave-actions {
    grid-area: actions;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
    margin-block-start: 0.65rem;
}
.leave-actions button {
    padding-inline: 0.6rem;
}
@media (orientation: landscape) and (max-height: 520px) and (min-width: 520px) {
    .leave-confirmation[open] {
        width: min(39rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    }
    .leave-confirmation :deep(.ui-dialog-inner) {
        grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
        grid-template-areas: "scene heading" "scene room" "scene description" "scene actions";
        column-gap: 1rem;
        padding: 0.85rem;
    }
    .leave-scene {
        display: grid;
        align-items: center;
    }
}
</style>
