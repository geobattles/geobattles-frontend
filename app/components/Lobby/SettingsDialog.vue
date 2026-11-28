<template>
    <UiDialog :open="open" title="Lobby settings" wide class="lobby-settings-dialog" @update:open="requestClose">
        <LobbyModifySettings ref="editor" @close="open = false" />
    </UiDialog>
</template>
<script setup lang="ts">
const open = defineModel<boolean>("open", { required: true });
const editor = ref<{ requestClose: () => void } | null>(null);
function requestClose() {
    if (editor.value) editor.value.requestClose();
    else open.value = false;
}
</script>
<style scoped>
.lobby-settings-dialog {
    border-color: #6fb6949c;
    border-radius: 1.25rem;
    background:
        url("/images/atlas-relief.svg") center bottom / 32rem auto no-repeat,
        linear-gradient(155deg, #0b332af7, #05201bf9);
    box-shadow:
        0 1.4rem 4.2rem #00130fc7,
        inset 0 1px #e2ffd024;
    overscroll-behavior: contain;
}
.lobby-settings-dialog::backdrop {
    background: #021714b8;
    backdrop-filter: blur(3px);
}
.lobby-settings-dialog :deep(.ui-dialog-header) {
    min-height: 46px;
    padding: 0.45rem 0.85rem;
    border-bottom: 1px solid #9be0a533;
    background: linear-gradient(115deg, #123f35f2, #072621eb);
}
.lobby-settings-dialog :deep(.ui-dialog-header h2) {
    font: italic 900 clamp(1.08rem, 3vw, 1.35rem) / 1.1 var(--gb-font-display);
    letter-spacing: -0.03em;
}
.lobby-settings-dialog :deep(.ui-dialog-header button) {
    min-width: 34px;
    min-height: 34px;
    width: 34px;
    height: 34px;
    border-color: #9be0a548;
    border-radius: 50%;
    background: #a4ecd316;
    color: #edfdf7;
}
.lobby-settings-dialog :deep(.ui-dialog-header button:hover) {
    background: #a4ecd328;
}
@media (min-width: 761px) and (min-height: 541px) {
    .lobby-settings-dialog:has(.settings-form) {
        --dialog-gap: 0.75rem;
        width: min(68rem, calc(100% - 2.5rem));
        border-radius: 1.35rem;
    }
    .lobby-settings-dialog :deep(.ui-dialog-header) {
        min-height: 56px;
        padding: 0.65rem 1.1rem;
    }
    .lobby-settings-dialog :deep(.ui-dialog-header h2) {
        font-size: 1.35rem;
    }
}
.lobby-settings-dialog:is([data-viewport-fit], :has([data-edit-layout]))[open] {
    height: var(--dialog-height);
    overflow: hidden;
}
.lobby-settings-dialog:is([data-viewport-fit], :has([data-edit-layout])) :deep(.ui-dialog-inner) {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.lobby-settings-dialog[data-viewport-fit] :deep(.ui-dialog-header) {
    flex: none;
}
.lobby-settings-dialog[data-viewport-fit] :deep(.settings-form:not([data-edit-layout])) {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    overflow: hidden;
}
.lobby-settings-dialog[data-viewport-fit] :deep(:is(.settings-fields, .folio)) {
    min-height: 0;
    flex: 1 1 auto;
}
.lobby-settings-dialog[data-viewport-fit] :deep(.settings-fields) {
    display: flex;
}
.lobby-settings-dialog[data-viewport-fit] :deep(.folio) {
    width: 100%;
    height: auto;
}
.lobby-settings-dialog[data-viewport-fit] :deep(.settings-footer) {
    flex: none;
}
.lobby-settings-dialog:has([data-edit-layout]) :deep(.ui-dialog-header) {
    display: none;
}
@media (max-width: 760px), (orientation: landscape) and (max-height: 540px), (orientation: landscape) and (pointer: coarse) and (max-width: 1100px) {
    .lobby-settings-dialog {
        border-radius: 1.05rem;
    }
    .lobby-settings-dialog:is([data-viewport-fit], :has([data-edit-layout]))[open] {
        height: var(--visible-height, var(--gb-viewport-height));
    }
}
</style>
