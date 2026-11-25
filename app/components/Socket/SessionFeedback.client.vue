<template>
    <p class="sr-only" role="alert">{{ inlineFailure ? `${failureTitle}. ${failureMessage}` : "" }}</p>
    <Transition name="horizon" @before-leave="revealLobby">
        <CinematicTransition
            v-if="cinematicDuration !== undefined && !retained"
            :key="String(route.query.reconnect ?? '')"
            :duration="cinematicDuration"
            :confirmed="entryConfirmed"
            :title="inlineFailure ? failureTitle : 'Entering your lobby'"
            :subtitle="inlineFailure ? failureMessage : cinematicStatus"
            :failed="inlineFailure"
            @arrived="emit('arrived')"
        >
            <template #cancel
                ><button ref="cinematicCancel" class="btn btn-secondary" type="button" @click="emit('leaveLobby')">
                    {{ inlineFailure ? cancelLabel || "Cancel" : "Cancel" }}
                </button></template
            >
            <template v-if="inlineFailure" #default>
                <button class="scenic-button scenic-button-primary" type="button" :disabled="busy || !socket.isOnline" :aria-busy="busy" @click="recover()">
                    {{ recoveryAction }}
                </button>
            </template>
        </CinematicTransition>
    </Transition>
    <SocketConnectionPanel v-if="cinematicDuration === undefined && !retained && !failure" tone="joining" :title="entryTitle" :description="entryMessage" :code="lobbyCode">
        <button ref="cancelJoin" class="btn btn-secondary" type="button" @click="emit('leaveLobby')">Cancel</button>
    </SocketConnectionPanel>
    <SocketConnectionPanel v-else-if="cinematicDuration === undefined && inlineFailure" tone="lost" :title="failureTitle" :description="failureMessage" :code="lobbyCode">
        <button class="btn" type="button" :disabled="busy || !socket.isOnline" :aria-busy="busy" @click="recover()">{{ recoveryAction }}</button>
        <button ref="failureHome" class="btn btn-secondary" type="button" @click="emit('leaveLobby')">Home</button>
    </SocketConnectionPanel>
    <template v-else-if="retained">
        <Teleport :to="bannerTarget || 'body'" :disabled="!bannerTarget">
            <SocketConnectionBanner :status="lobby.modifySettingsModal ? null : notice" :round-running="!!roundRunning" :class="{ 'game-connection-banner': gameplay }" />
            <button v-if="failure && dismissed" ref="failurePill" type="button" class="connection-failure-pill btn btn-secondary" @click="dismissed = false">
                <UiIcon name="wifi" />{{ failureTitle }}
            </button>
        </Teleport>
        <UiDialog
            v-if="failure"
            class="connection-failure"
            :open="!dismissed && !auth.isLoginDialog"
            :title="failureTitle"
            @update:open="dismissed = !$event"
            @close="focusFailurePill"
        >
            <SocketConnectionPanel embedded tone="lost" :title="failureTitle" :description="failureMessage" :code="lobbyCode">
                <button class="btn" type="button" :disabled="busy || !socket.isOnline" :aria-busy="busy" @click="recover()">{{ recoveryAction }}</button>
                <button class="btn btn-secondary" type="button" @click="emit('leaveLobby')">Home</button>
            </SocketConnectionPanel>
        </UiDialog>
    </template>
</template>

<script setup lang="ts">
import CinematicTransition from "~/components/Transitions/CinematicTransition.vue";

const props = defineProps<{
    retained: boolean;
    gameplay?: boolean;
    roundRunning?: boolean;
    bannerTarget?: HTMLElement | null;
    cinematicDuration?: number;
    entryConfirmed?: boolean;
    cancelLabel?: string;
}>();
const emit = defineEmits<{ leaveLobby: []; focusLobby: []; arrived: [] }>();
const socket = useWebSocketStore();
const auth = useAuthStore();
const notice = useConnectionNotice();
const router = useRouter();
const route = useRoute();
const recovery = useLobbyRecovery();
const lobby = useLobbyStore();
const toast = useToast();
const { captureNavigation } = useNuxtApp().$gameRuntime;
const cancelJoin = ref<HTMLButtonElement | null>(null);
const cinematicCancel = ref<HTMLButtonElement | null>(null);
const failureHome = ref<HTMLButtonElement | null>(null);
const failurePill = ref<HTMLButtonElement | null>(null);
const busy = ref(false);
const dismissed = ref(false);
const lobbyCode = computed(() => routeLobbyId(route));
const failure = computed(() => (socket.connectionState === "disconnected" ? socket.connectionError : null));
const inlineFailure = computed(() => !props.retained && !!failure.value);
const needsSignIn = computed(() => failure.value?.code === "AUTHENTICATION_REQUIRED");
const failureTitles: Record<string, string> = {
    LOBBY_FULL: "Lobby is full",
    SPECTATORS_FULL: "Spectator area is full",
    GAME_IN_PROGRESS: "Match in progress",
    ALREADY_CONNECTED: "Player already connected",
    AUTHENTICATION_REQUIRED: "Sign in to return",
    IDENTITY_CHANGED: "Player changed",
};
const failureTitle = computed(() => failureTitles[failure.value?.code ?? ""] ?? "Connection lost");
const failureMessage = computed(() => failure.value?.message || "We couldn’t reach the lobby.");
const recoveryAction = computed(() => (needsSignIn.value ? "Sign in" : "Try again"));
const entryTitle = computed(() => (!socket.isOnline ? "Waiting for internet…" : props.gameplay || route.query.resume === "1" ? "Returning to lobby…" : "Joining lobby…"));
const entryMessage = computed(() => {
    if (!socket.isOnline) return "We’ll try again when your connection returns.";
    if (socket.isConnected) return props.gameplay ? "Opening the game…" : "Opening the lobby…";
    return "Waiting for the game server to confirm your place.";
});
const cinematicStatus = computed(() => {
    if (!socket.isOnline) return "Waiting for internet. We’ll reconnect when you’re back online.";
    if (socket.connectionState === "reconnecting") return "Reconnecting to the lobby…";
    if (props.entryConfirmed) return "Lobby confirmed. Opening the room…";
    return "Connecting to the game server…";
});
const revealLobby = (element: Element) => {
    if (element.contains(document.activeElement)) {
        if (props.retained) emit("focusLobby");
        else void nextTick(() => cinematicCancel.value?.focus({ preventScroll: true }));
    }
    element.setAttribute("inert", "");
};
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

const recover = async (afterSignIn = false) => {
    const id = lobbyCode.value;
    if (!id || busy.value || !socket.isOnline) return;
    if (needsSignIn.value && !afterSignIn) {
        auth.openLoginDialog();
        return;
    }
    busy.value = true;
    let ownsFeedback = captureNavigation();
    try {
        // Deliberate same-lobby navigation requests a fresh attempt; the
        // committed route remains the sole owner of admission.
        if (await router.replace({ path: route.path, query: { ...route.query, reconnect: String(Date.now()) } })) return;
        ownsFeedback = captureNavigation();
        await recovery.restore(id);
    } catch {
        if (ownsFeedback() && !socket.connectionError) {
            toast.add({ severity: "error", summary: "Couldn’t reconnect", detail: "Please try again." });
        }
    } finally {
        busy.value = false;
    }
};
watch(
    () => auth.isLoginDialog,
    (open, wasOpen) => {
        if (!open && wasOpen && needsSignIn.value && auth.isAuthenticated) void recover(true);
    }
);
</script>

<style scoped>
.game-connection-banner {
    position: fixed;
    z-index: 46;
    inset-inline: max(12px, var(--gb-safe-left)) max(12px, var(--gb-safe-right));
    bottom: calc(82px + env(safe-area-inset-bottom));
    width: min(360px, calc(100% - max(12px, var(--gb-safe-left)) - max(12px, var(--gb-safe-right))));
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
