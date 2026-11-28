<template>
    <div class="game-shell">
        <Login />
        <LobbyLeaveConfirmation :prompt="leavePrompt" @decide="decideLeave" />
        <main id="main-content" class="scenic-lobby">
            <ClientOnly>
                <SocketSessionFeedback
                    :retained="roomView || openingGame"
                    :cinematic-duration="route.query.resume === '1' ? undefined : minimumJoinDisplayMs"
                    :entry-confirmed="isConnected && waitingSnapshot"
                    :cancel-label="entryPath === '/lobby/join' ? 'Change code' : entryPath === '/lobby/list' ? 'Back to lobbies' : undefined"
                    :banner-target="bannerTarget"
                    @leaveLobby="roomView ? leave() : cancelEntry()"
                    @focusLobby="focusLobby"
                    @arrived="joinDisplayComplete = true"
                />
                <div v-if="roomView" class="lobby-frame">
                    <picture class="lobby-scenery" aria-hidden="true">
                        <source media="(max-width: 760px) and (orientation: portrait)" srcset="/images/emerald-lake-portrait.webp" />
                        <img src="/images/emerald-lake.webp" alt="" width="1672" height="941" />
                    </picture>
                    <header class="room-header">
                        <div class="room-brand">
                            <img src="/images/emerald-mark.svg" alt="" width="35" height="37" />
                            <span>Geo<b>Battles</b></span>
                        </div>
                        <details ref="profileMenu" class="room-profile">
                            <summary aria-label="Account menu">
                                <span class="profile-icon" aria-hidden="true">
                                    <UiIcon name="user" />
                                </span>
                                <svg class="profile-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                                    <path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </summary>
                            <div class="room-profile-popover">
                                <NuxtLink to="/profile"><UiIcon name="user" />Profile</NuxtLink>
                                <NuxtLink to="/journal"><UiIcon name="journal" />Expedition journal</NuxtLink>
                            </div>
                        </details>
                        <svg class="room-crest" viewBox="0 0 62 38" aria-hidden="true">
                            <path fill="#66ad73" d="M26 38 46 10l16 28Z" />
                            <path fill="#a3f66b" d="M0 38 21 12l7 8L38 0l17 38Z" />
                            <path fill="#dbffac" d="m11 25 10-13 7 8L38 0l7 16-7-5-4 12-7-3-6 6-3-5Z" />
                            <path fill="#337755" d="m8 38 14-15-4 15Zm17 0 15-17 8 17Z" />
                        </svg>
                        <div class="room-title">
                            <p>Multiplayer lobby</p>
                            <h1 ref="lobbyTitle" data-testid="lobby-name" tabindex="-1" :title="lobby.lobbySettings?.conf.name">{{ lobby.lobbySettings?.conf.name || "Lobby" }}</h1>
                        </div>
                        <div class="room-access">
                            <LobbyInviteLink code-only />
                            <SocketConnectionStatus class="room-connection" />
                        </div>
                        <div class="room-tools">
                            <LobbyInviteLink />
                            <LobbyLeave short @click="leave" />
                        </div>
                    </header>
                    <div ref="bannerTarget" class="lobby-feedback" />
                    <div class="lobby-content">
                        <LobbyPlayerList class="lobby-panel roster-panel" staging />
                        <section class="lobby-panel match-panel" aria-label="Match setup and readiness">
                            <div class="match-summary" tabindex="0" role="region" aria-label="Game configuration">
                                <LobbyDisplaySettings>
                                    <template #edit>
                                        <button
                                            v-if="lobby.isPlayerAdmin()"
                                            type="button"
                                            class="btn btn-secondary edit-settings"
                                            aria-label="Edit settings"
                                            :disabled="!isConnected || openingGame"
                                            @click="lobby.modifySettingsModal = true"
                                        >
                                            <UiIcon name="pencil" /> <span>Edit<span class="edit-suffix"> settings</span></span>
                                        </button>
                                    </template>
                                </LobbyDisplaySettings>
                            </div>
                            <div class="lobby-actions">
                                <LobbyStartGame v-if="waitingSnapshot" />
                                <p v-else class="field-help" role="status">Opening game…</p>
                            </div>
                        </section>
                    </div>
                    <LobbySettingsDialog v-model:open="lobby.modifySettingsModal" />
                </div>
                <template #fallback>
                    <CinematicTransition title="Entering your lobby" subtitle="Connecting to the game server…" :animate="false">
                        <template #cancel><NuxtLink to="/" class="btn btn-secondary">Cancel</NuxtLink></template>
                    </CinematicTransition>
                </template>
            </ClientOnly>
        </main>
    </div>
</template>
<script setup lang="ts">
import CinematicTransition from "~/components/Transitions/CinematicTransition.vue";

definePageMeta({ key: (route) => `lobby-${String(route.params.id)}` });
const lobby = useLobbyStore();

const { connectionState } = useSocketState();
const isConnected = computed(() => connectionState.value === "connected");
const route = useRoute();
const router = useRouter();
const lobbyId = computed(() => routeLobbyId(route));
const minimumJoinDisplayMs = 2000;
const joinDisplayComplete = ref(route.query.resume === "1");
const cancellingEntry = ref(false);
const roomSnapshot = computed(() => (lobby.lobbySettings?.ID === lobbyId.value ? lobby.lobbySettings : null));
const waitingSnapshot = computed(() => roomSnapshot.value?.phase === "WAITING");
const openingGame = computed(() => !!roomSnapshot.value && !waitingSnapshot.value);
const hasRevealedLobby = ref(false);
watch(
    () => joinDisplayComplete.value && isConnected.value && waitingSnapshot.value && !cancellingEntry.value,
    (ready) => {
        if (ready) hasRevealedLobby.value = true;
    },
    { flush: "sync" }
);
// START updates the room phase before navigation commits. Keep the revealed
// room mounted until the gameplay page takes over.
const roomView = computed(() => hasRevealedLobby.value && !!roomSnapshot.value);
const { goHome: leave, leavePrompt, decideLeave } = useLobbyLeaveGuard(() => cancellingEntry.value || !roomView.value);
const bannerTarget = ref<HTMLElement | null>(null);
const lobbyTitle = ref<HTMLElement | null>(null);
const profileMenu = ref<HTMLDetailsElement | null>(null);
const focusLobby = () => nextTick(() => lobbyTitle.value?.focus({ preventScroll: true }));
const closeProfileMenu = (event: MouseEvent) => {
    if (profileMenu.value?.open && !profileMenu.value.contains(event.target as Node)) profileMenu.value.open = false;
};
const entryPath = computed(() => {
    const previous = router.options.history.state.back;
    return typeof previous === "string" ? previous.split(/[?#]/, 1)[0] : null;
});
const cancelEntry = async () => {
    if (cancellingEntry.value) return;
    cancellingEntry.value = true;
    try {
        if (entryPath.value === "/lobby/join" && lobbyId.value) {
            await router.replace({ path: "/lobby/join", query: { id: lobbyId.value, edit: "1" } });
        } else {
            await router.replace(entryPath.value === "/lobby/list" ? "/lobby/list" : "/");
        }
    } finally {
        cancellingEntry.value = false;
    }
};
const { fetchCountryList } = useCountryActions();
onMounted(() => {
    document.addEventListener("click", closeProfileMenu);
    void fetchCountryList().catch(() => console.warn("Country list could not be loaded."));
});
onBeforeUnmount(() => {
    document.removeEventListener("click", closeProfileMenu);
});

useHead({ title: "Lobby" });
</script>
<style scoped>
.scenic-lobby {
    --edge: clamp(0.75rem, 3.4vw, 2.25rem);
    --lobby-image: url("/images/emerald-lake.webp");
    position: relative;
    isolation: isolate;
    width: 100%;
    height: var(--gb-viewport-height);
    overflow: hidden;
    background: #052e24;
    color: #f8fafc;
}
.lobby-frame {
    display: flex;
    width: min(100%, 72rem);
    height: 100%;
    min-width: 0;
    flex-direction: column;
    margin-inline: auto;
    padding: max(1.15rem, env(safe-area-inset-top)) max(var(--edge), env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(var(--edge), env(safe-area-inset-left));
}
.lobby-scenery,
.lobby-scenery::after {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.lobby-scenery {
    z-index: -1;
    overflow: hidden;
}
.lobby-scenery img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 61% 52%;
}
.lobby-scenery::after {
    content: "";
    background: linear-gradient(180deg, #02262085, #04231c19 35%, #0119169c), radial-gradient(ellipse at 37% 46%, #04282485, transparent 73%);
}
.room-header {
    position: relative;
    z-index: 1;
    display: grid;
    flex: none;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
        "brand brand profile"
        "crest title tools"
        "crest access tools";
    align-items: center;
    gap: 0.4rem 0.8rem;
    text-shadow: 0 2px 8px #001d17;
}
.room-brand {
    grid-area: brand;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: clamp(0.3rem, 2dvh, 1.1rem);
    font: italic 900 clamp(1.2rem, 2.5vw, 1.65rem) / 1 var(--gb-font-display);
    letter-spacing: -0.055em;
}
.room-brand b {
    color: #a3f66b;
}
.room-title {
    grid-area: title;
    min-width: 0;
}
.room-title p {
    color: #bcfa9f;
    font: 700 0.68rem/1.4 var(--gb-font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.room-crest {
    grid-area: crest;
    width: clamp(2rem, 5vw, 3.85rem);
    filter: drop-shadow(0 2px 7px #001e14);
}
.room-header h1 {
    overflow: hidden;
    font-size: clamp(1.45rem, 3vw, 2.65rem);
    font-weight: 900;
    line-height: 1.14;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.room-profile {
    position: relative;
    z-index: 4;
    grid-area: profile;
    justify-self: end;
}
.room-profile summary {
    display: flex;
    min-width: 44px;
    min-height: 44px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding-inline: 0.28rem 0.5rem;
    list-style: none;
    border-radius: 999px;
    color: #f4fcf8;
}
.profile-icon {
    display: grid;
    width: 29px;
    height: 29px;
    place-items: center;
    border: 1px solid #c4fbed52;
    border-radius: 50%;
    background: linear-gradient(155deg, #4c9d8b8a, #082e3270);
    box-shadow: inset 0 1px #e1fff439;
}
.profile-icon svg {
    width: 21px;
    height: 21px;
}
.profile-chevron {
    width: 13px;
    height: 13px;
    flex: none;
    transition: transform 150ms ease;
}
.room-profile[open] .profile-chevron {
    transform: rotate(180deg);
}
.room-profile summary::-webkit-details-marker {
    display: none;
}
.room-profile > .room-profile-popover {
    position: absolute;
    z-index: 40;
    right: 0;
    top: calc(100% + 0.38rem);
    min-width: 12rem;
    padding: 0.36rem;
    border: 1px solid #8ddbaf55;
    border-radius: 0.9rem;
    background: linear-gradient(155deg, #0b332af5, #05201bf8);
    box-shadow:
        0 14px 36px #00130fc4,
        inset 0 1px #e2ffd020;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: grid;
    gap: 0.14rem;
    text-shadow: none;
}
.room-profile-popover a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 36px;
    padding: 0.36rem 0.56rem;
    border-radius: 0.55rem;
    color: #e8f8ec;
    font-size: 0.79rem;
    font-weight: 680;
    text-decoration: none;
    white-space: nowrap;
}
.room-profile-popover a .ui-icon {
    width: 1rem;
    height: 1rem;
    color: #9de8bd;
}
.room-profile-popover a:hover {
    background: #a4ecd31c;
    color: #ffffff;
}
.room-tools,
.room-access {
    display: flex;
    align-items: center;
    min-width: 0;
    flex-wrap: wrap;
    gap: 0.4rem;
    text-shadow: none;
}
.room-access {
    grid-area: access;
}
.room-tools {
    grid-area: tools;
    justify-content: flex-end;
}
.room-connection {
    border-radius: 999px;
    font-weight: 700;
}
.lobby-frame :deep(.btn-secondary),
.room-tools :deep(.btn-danger) {
    min-height: 44px;
    min-width: 44px;
    padding: 0.32rem 0.62rem;
    border-color: #92e4c44f;
    border-radius: 8px;
    background: #082d28e6;
    color: #f4fcf8;
    white-space: nowrap;
}
.lobby-frame :deep(.btn-secondary:not(:disabled):hover),
.room-tools :deep(.btn-danger:not(:disabled):hover) {
    border-color: #a3f66b;
    background: #135040;
}
.room-tools :deep(.btn),
.room-access :deep(.code-button),
.room-profile summary {
    border: 1px solid #d0f9ed38;
    background: linear-gradient(150deg, #d6fff323, #83cabb0c 56%, #041f2e45), #11353461;
    backdrop-filter: blur(9px);
    box-shadow:
        inset 0 1px #e5fff420,
        0 3px 12px #001b2136;
}
.room-tools :deep(.btn:not(:disabled):hover),
.room-access :deep(.code-button:not(:disabled):hover),
.room-profile summary:hover,
.room-profile[open] summary {
    border-color: #c8fae774;
    background: linear-gradient(150deg, #caffea30, #3b897947), #123d3a8c;
}
.room-tools :deep(.btn-danger) {
    color: #f4fcf8;
    background: linear-gradient(150deg, #c0e8fc20, #19445617), #0a263e65;
}
.lobby-frame :deep(.code-button strong) {
    color: #bcfa9f;
    font-family: var(--gb-font-mono);
    letter-spacing: 0.085em;
}
.room-tools :deep(.invite-label) {
    display: none;
}
.room-tools :deep(.invite-compact-label) {
    display: inline;
}
.lobby-feedback :deep(.connection-strip) {
    margin-top: 0.35rem;
    padding: 0.3rem 0.5rem;
}
.lobby-feedback :deep(.connection-failure-pill) {
    position: static;
    margin-top: 0.35rem;
}
.lobby-content {
    display: grid;
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    max-height: 26.5rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(0.5rem, 1.4vw, 1.1rem);
    margin-top: clamp(0.65rem, 2dvh, 1.15rem);
}
.lobby-panel {
    min-width: 0;
    min-height: 0;
    padding: clamp(0.55rem, 1.65vw, 1.25rem);
    border: 1px solid #70cda675;
    border-radius: 13px;
    background: linear-gradient(150deg, #0c3838ed, #032523f5 69%);
    box-shadow:
        inset 0 1px #a4f4d01f,
        0 8px 24px #00161365;
}
.match-panel {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}
.match-summary {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    outline-offset: -2px;
}
.lobby-actions {
    flex: none;
    min-width: 0;
}
.lobby-actions :deep(.ready-heading) {
    display: none;
}
.lobby-actions :deep(.ready-actions) {
    gap: 0.35rem;
    margin-top: 0;
}
.lobby-actions :deep(.ready-actions > button) {
    min-height: 48px;
    border-radius: 999px;
}
.lobby-actions :deep(.ready-actions > .ready-fluid),
.lobby-actions :deep(.ready-actions > button:last-child:not(.undo-ready):not(.ready-prompt):not(:disabled)) {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow: var(--gb-scenic-action-shadow);
}
.lobby-actions :deep(.ready-actions > .ready-fluid:focus-visible) {
    outline-color: var(--gb-scenic-action-ink);
}
.lobby-actions :deep(.ready-actions > .ready-fluid:enabled:hover),
.lobby-actions :deep(.ready-actions > button:last-child:not(.undo-ready):not(.ready-prompt):enabled:hover) {
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow: var(--gb-scenic-action-hover-shadow);
}
.lobby-actions :deep(.ready-prompt:not(:has(.spinner))::before) {
    content: "";
    width: 0;
    height: 0;
    margin-inline-end: 0.15rem;
    border-block: 0.4rem solid transparent;
    border-inline-start: 0.63rem solid currentColor;
}
.lobby-actions :deep(.ready-feedback:not(:empty)) {
    margin-top: 0.25rem;
}
:global(.app-root:has(.lobby-frame) > .build-notice) {
    @apply sr-only;
}
@media (prefers-reduced-motion: no-preference) {
    .lobby-scenery img {
        animation: settle-scene 550ms ease-out both;
    }
    .room-header,
    .lobby-panel {
        animation: reveal-lobby 360ms ease-out both;
    }
    .match-panel {
        animation-delay: 55ms;
    }
    .lobby-actions {
        animation: reveal-lobby 340ms 110ms ease-out both;
    }
    .lobby-actions :deep(.ready-confirmation ~ button:last-child:not(.undo-ready):not(:disabled)) {
        animation: start-ready 240ms ease-out both;
    }
}
@keyframes start-ready {
    from {
        opacity: 0.8;
        transform: scale(0.975);
    }
}
@keyframes settle-scene {
    from {
        transform: scale(1.025);
    }
}
@keyframes reveal-lobby {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
}
@media (max-width: 760px) and (orientation: portrait) {
    .scenic-lobby {
        --edge: 0.48rem;
        --lobby-image: url("/images/emerald-lake-portrait.webp");
    }
    .lobby-frame {
        padding-top: max(0.42rem, env(safe-area-inset-top));
        padding-bottom: max(0.45rem, env(safe-area-inset-bottom));
    }
    .room-header {
        grid-template-areas:
            "brand brand profile"
            "crest title title"
            "access access tools";
        gap: 0.28rem 0.42rem;
    }
    .room-brand {
        margin: 0;
        font-size: 1.05rem;
        gap: 0.38rem;
    }
    .room-brand img {
        width: 22px;
        height: auto;
    }
    .room-crest {
        width: 1.55rem;
    }
    .room-header h1 {
        font: italic 900 clamp(1.1rem, 4.6vw, 1.45rem) / 1.1 var(--gb-font-display);
        letter-spacing: -0.03em;
    }
    .room-title p,
    .profile-chevron,
    .edit-suffix {
        display: none;
    }
    .room-profile summary {
        min-width: 36px;
        min-height: 36px;
        width: 36px;
        height: 36px;
        padding: 0;
    }
    .profile-icon {
        width: 100%;
        height: 100%;
        border: 0;
        background: transparent;
        box-shadow: none;
    }
    .profile-icon .ui-icon {
        width: 18px;
        height: 18px;
    }
    .room-access,
    .room-tools {
        gap: 0.26rem;
        flex-wrap: nowrap;
    }
    .room-access :deep(.code-label) {
        display: none;
    }
    .room-connection {
        padding: 0.22rem 0.5rem;
        font-size: 0.68rem;
    }
    .room-tools :deep(.btn),
    .room-access :deep(.code-button) {
        min-height: 32px;
        min-width: 32px;
        padding: 0.18rem 0.54rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 740;
        gap: 0.28rem;
    }
    .room-tools :deep(.btn .ui-icon),
    .room-access :deep(.code-button .ui-icon) {
        width: 0.85rem;
        height: 0.85rem;
    }
    .room-tools :deep(.btn-danger) {
        border-color: #ff998952;
        background: #3a1d1cc8;
        color: #ffd0ad;
    }
    .lobby-content {
        max-height: none;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr) minmax(0, auto);
        gap: 0.42rem;
        margin-top: 0.4rem;
    }
    .match-panel {
        gap: 0.45rem;
        max-height: 55dvh;
    }
    .lobby-panel {
        padding: 0.5rem 0.56rem;
        border-radius: 0.95rem;
    }
    .roster-panel {
        background: linear-gradient(160deg, #0b3739ed, #032523ab 85%);
    }
    .lobby-actions :deep(.ready-actions > button) {
        min-height: 42px;
        font-size: 0.84rem;
    }
    .lobby-actions :deep(.ready-actions > .undo-ready) {
        font-size: 0.78rem;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .scenic-lobby {
        --edge: 0.45rem;
    }
    .lobby-frame {
        padding-top: max(0.3rem, env(safe-area-inset-top));
        padding-bottom: max(0.36rem, env(safe-area-inset-bottom));
    }
    .room-header {
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        grid-template-areas: "brand title access tools";
        gap: 0.35rem;
    }
    .room-brand {
        margin: 0;
    }
    .room-brand img {
        width: 1.35rem;
        height: auto;
    }
    .room-brand span,
    .room-title p,
    .room-crest,
    .room-profile,
    .edit-suffix {
        display: none;
    }
    .room-header h1 {
        font: italic 900 clamp(1.02rem, 2.5vw, 1.35rem) / 1.1 var(--gb-font-display);
        letter-spacing: -0.025em;
    }
    .room-access,
    .room-tools {
        gap: 0.25rem;
        flex-wrap: nowrap;
    }
    .room-access :deep(.code-label) {
        display: none;
    }
    .room-connection {
        padding: 0.2rem 0.48rem;
        font-size: 0.68rem;
    }
    .room-tools :deep(.btn),
    .room-access :deep(.code-button) {
        min-height: 32px;
        min-width: 32px;
        padding: 0.16rem 0.52rem;
        border-radius: 999px;
        font-size: 0.71rem;
        font-weight: 740;
        gap: 0.26rem;
    }
    .room-tools :deep(.btn .ui-icon),
    .room-access :deep(.code-button .ui-icon) {
        width: 0.84rem;
        height: 0.84rem;
    }
    .room-tools :deep(.btn-danger) {
        border-color: #ff998952;
        background: #3a1d1cc8;
        color: #ffd0ad;
    }
    .lobby-content {
        grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
        gap: 0.42rem;
        margin-top: 0.34rem;
        max-height: none;
    }
    .lobby-panel {
        padding: 0.46rem 0.54rem;
        border-radius: 0.9rem;
    }
    .match-panel {
        gap: 0.4rem;
    }
    .match-summary {
        display: flex;
        flex-direction: column;
    }
    .lobby-actions :deep(.ready-actions > button) {
        min-height: 38px;
        font-size: 0.8rem;
    }
    .lobby-actions :deep(.ready-actions > .undo-ready) {
        font-size: 0.74rem;
    }
    .lobby-feedback :deep(.connection-strip > div) {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
}
@media (max-width: 370px), (orientation: landscape) and (max-width: 600px) {
    .room-connection {
        gap: 0.22rem;
        padding-inline: 0.36rem;
        font-size: 0.64rem;
    }
    .lobby-frame :deep(.room-tools .btn),
    .lobby-frame :deep(.code-button) {
        gap: 0.2rem;
        padding-inline: 0.4rem;
        font-size: 0.68rem;
    }
}
</style>
