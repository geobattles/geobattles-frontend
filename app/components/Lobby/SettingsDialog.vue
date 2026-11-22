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
    background: #062a27f5;
    overscroll-behavior: contain;
}
.lobby-settings-dialog :deep(.ui-dialog-header) {
    min-height: 54px;
    border-bottom: 1px solid #baf6df44;
    background: linear-gradient(115deg, #174d45f2, #092f2dd9);
}
.lobby-settings-dialog :deep(.ui-dialog-header button) {
    border-color: #d2f8e763;
    border-radius: 10px;
    background: linear-gradient(145deg, #88c5b22a, #07231e);
    color: #edfdf7;
}
@media (min-width: 761px) and (min-height: 541px) {
    .lobby-settings-dialog:has(.settings-form) {
        --dialog-gap: 0.75rem;
        width: min(68rem, calc(100% - 2.5rem));
        border-radius: 18px;
    }
    .lobby-settings-dialog :deep(.ui-dialog-header) {
        min-height: 62px;
    }
    .lobby-settings-dialog :deep(.ui-dialog-header h2) {
        font-size: 1.3rem;
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
    .lobby-settings-dialog:is([data-viewport-fit], :has([data-edit-layout]))[open] {
        height: var(--visible-height, var(--gb-viewport-height));
    }
}
</style>
