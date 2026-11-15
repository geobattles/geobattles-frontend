<template>
    <div class="invite-link">
        <button type="button" class="btn btn-secondary" :aria-label="copied ? 'Invite copied' : 'Copy invite link'" :disabled="!inviteLink || copying" @click="copy">
            <UiIcon :name="copied ? 'check' : 'copy'" />{{ copied ? "Copied" : "Copy invite" }}
        </button>
        <div v-if="manual" class="field mt-3">
            <label :for="inputId">Copy this invite link</label><input :id="inputId" ref="input" class="input" :value="inviteLink" readonly @focus="select" />
            <p class="field-help" role="status">Clipboard access isn’t available. Select the link, then use your device’s Copy action.</p>
        </div>
        <span v-if="copied" class="sr-only" role="status">Invite link copied to your clipboard.</span>
    </div>
</template>
<script setup lang="ts">
const lobby = useLobbyStore();
const origin = ref("");
const inputId = useId();
const input = ref<HTMLInputElement | null>(null);
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
const select = () => input.value?.select();
const copy = async () => {
    if (!inviteLink.value || copying.value) return;
    copying.value = true;
    try {
        if (!window.isSecureContext || !navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(inviteLink.value);
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
        await nextTick();
        if (active) {
            input.value?.focus();
            select();
        }
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
