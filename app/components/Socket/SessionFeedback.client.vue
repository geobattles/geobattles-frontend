<template>
    <p class="sr-only" role="alert">{{ inlineFailure ? `${failureTitle}. ${failureMessage}` : "" }}</p>
    <SocketConnectionPanel v-if="!retained && !failure" tone="joining" :title="entryTitle" :description="entryMessage" :code="lobbyCode">
        <button ref="cancelJoin" class="btn btn-secondary" type="button" @click="emit('leaveLobby')">Cancel</button>
    </SocketConnectionPanel>
    <SocketConnectionPanel v-else-if="inlineFailure" tone="lost" :title="failureTitle" :description="failureMessage" :code="lobbyCode">
        <button class="btn" type="button" :disabled="busy || !socket.isOnline" :aria-busy="busy" @click="recover">{{ recoveryAction }}</button>
        <button ref="failureHome" class="btn btn-secondary" type="button" @click="emit('leaveLobby')">Home</button>
    </SocketConnectionPanel>
    <template v-else>
        <Teleport :to="bannerTarget || 'body'" :disabled="!bannerTarget">
            <SocketConnectionBanner :status="lobby.modifySettingsModal ? null : banner" :round-running="!!roundRunning" :class="{ 'game-connection-banner': gameplay }" />
            <button v-if="failure && dismissed" ref="failurePill" type="button" class="connection-failure-pill btn btn-secondary" @click="dismissed = false">
                <UiIcon name="wifi" />{{ failureTitle }}
            </button>
        </Teleport>
        <UiDialog v-if="failure" class="connection-failure" :open="!dismissed" :title="failureTitle" @update:open="dismissed = !$event" @close="focusFailurePill">
            <SocketConnectionPanel embedded tone="lost" :title="failureTitle" :description="failureMessage" :code="lobbyCode">
                <button class="btn" type="button" :disabled="busy || !socket.isOnline" :aria-busy="busy" @click="recover">{{ recoveryAction }}</button>
                <button class="btn btn-secondary" type="button" @click="emit('leaveLobby')">Home</button>
            </SocketConnectionPanel>
        </UiDialog>
    </template>
</template>

<script setup lang="ts">
const props = defineProps<{ retained: boolean; gameplay?: boolean; roundRunning?: boolean; bannerTarget?: HTMLElement | null }>();
const emit = defineEmits<{ leaveLobby: [] }>();
const socket = useWebSocketStore();
const router = useRouter();
const route = useRoute();
const recovery = useLobbyRecovery();
const lobby = useLobbyStore();
const toast = useToast();
const { captureNavigation } = useNuxtApp().$gameRuntime;
const cancelJoin = ref<HTMLButtonElement | null>(null);
const failureHome = ref<HTMLButtonElement | null>(null);
const failurePill = ref<HTMLButtonElement | null>(null);
const busy = ref(false);
const dismissed = ref(false);
const restored = ref(false);
let restoredTimer: ReturnType<typeof setTimeout> | undefined;

const lobbyCode = computed(() => routeLobbyId(route));
const failure = computed(() => (socket.connectionState === "disconnected" ? socket.connectionError : null));
const inlineFailure = computed(() => !props.retained && !!failure.value);
const missingLobby = computed(() => failure.value?.code === "LOBBY_NOT_FOUND");
const failureTitle = computed(() => (missingLobby.value ? "Lobby closed" : "Connection lost"));
const failureMessage = computed(() => {
    if (missingLobby.value) return "This lobby is no longer available.";
    if (!socket.isOnline) return "Reconnect to the internet, then try again.";
    return "Automatic retries stopped. Try again to return to the lobby.";
});
const recoveryAction = computed(() => (missingLobby.value ? "New lobby" : "Try again"));
const entryTitle = computed(() => (!socket.isOnline ? "Waiting for internet…" : props.gameplay ? "Rejoining game…" : "Joining lobby…"));
const entryMessage = computed(() => {
    if (!socket.isOnline) return "We’ll try again when your connection returns.";
    if (socket.isConnected) return props.gameplay ? "Opening the game…" : "Opening the lobby…";
    return "Waiting for the game server to confirm your place.";
});
const interrupted = computed(() => props.retained && !failure.value && (!socket.isOnline || socket.connectionState === "reconnecting"));
const banner = computed(() => {
    if (interrupted.value) return socket.isOnline ? "reconnecting" : "offline";
    return props.retained && socket.isConnected && !failure.value && restored.value ? "restored" : null;
});
watch(interrupted, (active, wasActive) => {
    clearTimeout(restoredTimer);
    restored.value = !active && wasActive && socket.isConnected && socket.isOnline;
    if (restored.value) restoredTimer = setTimeout(() => (restored.value = false), 2200);
});
watch(failure, () => (dismissed.value = false));
watch(inlineFailure, async (shown) => {
    if (!shown || !cancelJoin.value || document.activeElement !== cancelJoin.value) return;
    await nextTick();
    if (inlineFailure.value) failureHome.value?.focus({ preventScroll: true });
});
const focusFailurePill = async () => {
    await nextTick();
    if (dismissed.value && failure.value && !lobby.modifySettingsModal) failurePill.value?.focus({ preventScroll: true });
};
onBeforeUnmount(() => clearTimeout(restoredTimer));

const recover = async () => {
    const id = lobbyCode.value;
    const create = missingLobby.value;
    if (!id || busy.value || !socket.isOnline) return;
    busy.value = true;
    let ownsFeedback = captureNavigation();
    try {
        if (create) {
            if (await router.push("/")) return;
            ownsFeedback = captureNavigation();
            await lobby.createLobby();
        } else {
            // Deliberate same-lobby navigation requests a fresh attempt; the
            // committed route remains the sole owner of admission.
            if (await router.replace({ path: route.path, query: { ...route.query, reconnect: String(Date.now()) } })) return;
            ownsFeedback = captureNavigation();
            await recovery.restore(id);
        }
    } catch {
        if (ownsFeedback() && !socket.connectionError) {
            toast.add({ severity: "error", summary: create ? "Couldn’t create lobby" : "Couldn’t reconnect", detail: "Please try again." });
        }
    } finally {
        busy.value = false;
    }
};
</script>

<style scoped>
.game-connection-banner {
    position: fixed;
    z-index: 46;
    inset-inline: 12px;
    bottom: calc(82px + env(safe-area-inset-bottom));
    width: min(360px, calc(100% - 24px));
    margin-inline: auto;
    pointer-events: none;
}
/* Keep the restored announcement for assistive tech, but give map recovery
   priority when its controls are in the same part of the gameplay surface. */
:global(.game-page:has(.maps-recovery) .game-connection-banner:has([data-tone="sage"])) {
    clip-path: inset(50%);
}
.connection-failure {
    width: min(400px, calc(100% - 1rem));
}
.connection-failure-pill {
    position: fixed;
    z-index: 49;
    top: calc(6rem + env(safe-area-inset-top));
    left: max(0.5rem, env(safe-area-inset-left));
    color: var(--gb-coral);
    min-height: 44px;
}
:global(.game-page .connection-failure-pill) {
    top: auto;
    left: 50%;
    bottom: calc(82px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
}
@media (max-height: 440px) and (orientation: landscape) {
    .game-connection-banner,
    :global(.game-page .connection-failure-pill) {
        bottom: calc(74px + env(safe-area-inset-bottom));
    }
}
</style>
