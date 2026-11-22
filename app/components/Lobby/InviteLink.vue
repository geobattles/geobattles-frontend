<template>
    <div class="invite-link">
        <button
            type="button"
            class="btn btn-secondary"
            :class="{ 'code-button': codeOnly }"
            :aria-label="codeOnly ? (copied ? 'Lobby code copied' : 'Copy lobby code') : copied ? 'Invite copied' : 'Copy invite link'"
            :aria-describedby="codeOnly ? codeId : undefined"
            :disabled="!copyValue || copying"
            @click="copy"
        >
            <template v-if="codeOnly"
                ><span class="code-label">Code</span><strong :id="codeId" data-testid="lobby-code">{{ lobby.lobbySettings?.ID }}</strong></template
            >
            <UiIcon :name="copied ? 'check' : codeOnly ? 'copy' : 'users'" />
            <template v-if="!codeOnly">
                <span class="invite-label">{{ copied ? "Copied" : "Copy invite" }}</span>
                <span class="invite-compact-label">{{ copied ? "Copied" : "Invite" }}</span>
            </template>
        </button>
        <UiDialog v-model:open="manual" :title="codeOnly ? 'Copy lobby code' : 'Copy invite link'">
            <div class="field">
                <label :for="inputId">{{ codeOnly ? "Lobby code" : "Invite link" }}</label>
                <input :id="inputId" class="input" :value="copyValue" readonly autofocus @focus="select" />
                <p class="field-help">Use your device’s Copy action to copy the selected text.</p>
            </div>
        </UiDialog>
        <span v-if="copied" class="sr-only" role="status">{{ codeOnly ? "Lobby code copied." : "Invite link copied to your clipboard." }}</span>
    </div>
</template>
<script setup lang="ts">
const props = defineProps<{ codeOnly?: boolean }>();
const lobby = useLobbyStore();
const origin = ref("");
const inputId = useId();
const codeId = `${inputId}-code`;
const copied = ref(false);
const copying = ref(false);
const manual = ref(false);
let active = true;
let timer: ReturnType<typeof setTimeout> | undefined;
const inviteLink = computed(() => {
    const id = lobby.lobbySettings?.ID;
    if (!origin.value || !id) return "";
    const url = new URL("/lobby/join", origin.value);
    url.searchParams.set("id", id);
    return url.href;
});
const copyValue = computed(() => (props.codeOnly ? (lobby.lobbySettings?.ID ?? "") : inviteLink.value));
const select = (event: FocusEvent) => (event.currentTarget as HTMLInputElement).select();
const copy = async () => {
    if (!copyValue.value || copying.value) return;
    copying.value = true;
    try {
        if (!window.isSecureContext || !navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(copyValue.value);
        if (!active) return;
        copied.value = true;
        manual.value = false;
        clearTimeout(timer);
        timer = setTimeout(() => {
            copied.value = false;
        }, 4000);
    } catch {
        if (!active) return;
        manual.value = true;
    } finally {
        if (active) copying.value = false;
    }
};
onMounted(() => {
    origin.value = window.location.origin;
});
onBeforeUnmount(() => {
    active = false;
    clearTimeout(timer);
});
</script>
<style scoped>
.invite-compact-label {
    display: none;
}
</style>
