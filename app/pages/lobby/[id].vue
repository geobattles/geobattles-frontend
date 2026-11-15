<template>
    <div class="game-shell">
        <Header />
        <main id="main-content" class="page-shell waiting-lobby">
            <div class="page-heading">
                <div>
                    <p class="eyebrow">Ready room</p>
                    <h1 class="command-heading" data-testid="lobby-name">{{ mounted ? lobby.lobbySettings?.conf.name || "Lobby" : "Lobby" }}</h1>
                </div>
                <LobbyLeave class="lobby-leave" @click="leave" />
            </div>
            <ClientOnly>
                <div class="lobby-layout">
                    <section class="lobby-actions" aria-label="Get ready to play">
                        <LobbyStartGame />
                    </section>
                    <section class="room-invite" aria-label="Invite friends">
                        <div class="room-code">
                            <span class="section-label">Game code</span
                            ><strong data-testid="lobby-code" class="lobby-code">{{ lobby.lobbySettings?.ID || route.params.id }}</strong>
                        </div>
                        <SocketConnectionStatus />
                        <LobbyInviteLink />
                    </section>
                    <section class="lobby-players">
                        <LobbyPlayerList />
                    </section>
                    <section class="lobby-settings">
                        <div class="panel-heading">
                            <h2>Settings</h2>
                            <button v-if="lobby.isPlayerAdmin()" type="button" class="btn btn-secondary" :disabled="!isConnected" @click="lobby.modifySettingsModal = true">
                                <UiIcon name="settings" />Edit settings
                            </button>
                        </div>
                        <details :open="settingsOpen" @toggle="settingsOpen = ($event.target as HTMLDetailsElement).open">
                            <summary class="settings-toggle">
                                <span
                                    >{{ lobby.lobbySettings?.conf.numRounds }} rounds · {{ lobby.lobbySettings?.conf.roundTime }}s ·
                                    {{ lobby.lobbySettings?.conf.numAttempt }} guesses</span
                                ><span class="accent">{{ settingsOpen ? "Less" : "Details" }}</span>
                            </summary>
                            <div class="settings-body"><LobbyDisplaySettings /></div>
                        </details>
                    </section>
                </div>
                <GameplayLostConnectionDialog @leaveLobby="leave" /><UiDialog v-model:open="lobby.modifySettingsModal" title="Lobby settings" wide
                    ><LobbyModifySettings @close="lobby.modifySettingsModal = false" /></UiDialog
                ><template #fallback
                    ><section class="panel">
                        <h2>Connecting to lobby {{ route.params.id }}</h2>
                        <p class="muted mt-3">Waiting for the server to confirm your place.</p>
                    </section></template
                ></ClientOnly
            >
        </main>
    </div>
</template>
<script setup lang="ts">
definePageMeta({ key: (route) => `lobby-${String(route.params.id)}` });
const lobby = useLobbyStore();
const mounted = ref(false);
const settingsOpen = ref(false);
let layoutQuery: MediaQueryList | undefined;
const syncSettingsLayout = () => {
    settingsOpen.value = layoutQuery?.matches ?? false;
};
const { connectionState } = useSocketState();
const isConnected = computed(() => connectionState.value === "connected");
const route = useRoute();
const { goHome: leave } = useLobbyLeaveGuard();
const { fetchCountryList } = useCountryActions();
onMounted(() => {
    mounted.value = true;
    layoutQuery = window.matchMedia("(min-width: 900px), (min-width: 560px) and (orientation: landscape)");
    syncSettingsLayout();
    layoutQuery.addEventListener("change", syncSettingsLayout);
    void fetchCountryList().catch(() => console.warn("Country list could not be loaded."));
});
onBeforeUnmount(() => layoutQuery?.removeEventListener("change", syncSettingsLayout));
useHead({ title: "Lobby" });
</script>
<style scoped>
.waiting-lobby {
    max-width: 1120px;
    padding-block: clamp(0.625rem, 2vw, 1.75rem);
}
.waiting-lobby .page-heading {
    margin-bottom: 1rem;
    align-items: center;
}
.waiting-lobby .eyebrow {
    margin-bottom: 0.25rem;
}
.waiting-lobby :deep(.panel-heading) {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}
.waiting-lobby :deep(.btn) {
    min-width: 44px;
    font-size: 0.8rem;
    padding: 0.5rem 0.7rem;
}
.waiting-lobby :deep(.badge) {
    padding: 0.25rem 0.45rem;
    font-size: 0.7rem;
}
.waiting-lobby :deep(.divider) {
    margin-block: 0.75rem;
}
.waiting-lobby :deep(.settings-display h3) {
    font-size: 0.85rem;
}
.waiting-lobby h1 {
    font-size: clamp(1.4rem, 3vw, 2rem);
}
.waiting-lobby h2 {
    font-size: 1rem;
}
.lobby-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "actions" "invite" "players" "settings";
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
    background: var(--gb-surface);
    box-shadow: 0 16px 48px #0003;
}
.lobby-layout > section {
    min-width: 0;
    padding: 1rem;
}
.lobby-actions {
    grid-area: actions;
    background: var(--gb-raised);
    border-bottom: 1px solid var(--gb-line);
}
.room-invite {
    grid-area: invite;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    background: #1e201e;
    border-bottom: 1px solid var(--gb-line);
}
.lobby-layout > .room-invite {
    padding-block: 0.625rem;
}
.room-code {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-right: auto;
}
.lobby-code {
    color: var(--gb-accent);
    font: 700 1.4rem / 1.25 var(--gb-font-mono);
    letter-spacing: 0.18em;
    padding: 0.35rem 0.4rem 0.35rem 0.6rem;
    border: 1px solid #b6e38845;
    border-radius: 2px;
    background: var(--gb-bg);
}
.lobby-players {
    grid-area: players;
}
.lobby-settings {
    grid-area: settings;
    border-top: 1px solid var(--gb-line);
    background: #202220;
}
.room-invite > * {
    min-width: 0;
    max-width: 100%;
}
.settings-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    gap: 0.5rem;
    font-size: 0.8rem;
    cursor: pointer;
    list-style: none;
}
.settings-toggle::-webkit-details-marker {
    display: none;
}
.settings-toggle > .accent {
    font: 600 0.68rem var(--gb-font-mono);
    text-transform: uppercase;
}
.settings-body {
    padding-top: 0.75rem;
    border-top: 1px solid var(--gb-line);
}
@media (min-width: 900px), (min-width: 560px) and (orientation: landscape) {
    .lobby-layout {
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        grid-template-areas: "invite invite" "players actions" "players settings";
        grid-template-rows: auto auto 1fr;
    }
    .lobby-actions,
    .lobby-settings {
        border-left: 1px solid var(--gb-line);
    }
    .lobby-actions {
        border-bottom: 0;
    }
}
@media (max-height: 540px) and (orientation: landscape) {
    .waiting-lobby {
        padding-block: 0.625rem;
    }
    .waiting-lobby .page-heading {
        margin-bottom: 0.5rem;
    }
    .lobby-layout > section {
        padding: 0.625rem;
    }
    .lobby-settings .panel-heading {
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }
}
@media (max-width: 640px) {
    .waiting-lobby .page-heading {
        flex-wrap: nowrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    .page-heading > div {
        min-width: 0;
    }
    .waiting-lobby .eyebrow {
        font-size: 0.65rem;
        margin-bottom: 0.1rem;
    }
    .waiting-lobby h1 {
        font-size: 1.25rem;
    }
    .waiting-lobby .lobby-leave {
        flex: none;
        width: 44px;
        height: 44px;
        padding: 0;
        font-size: 0;
        gap: 0;
    }
    .lobby-leave :deep(svg) {
        font-size: 1.1rem;
    }
    .lobby-layout > section {
        padding: 0.625rem;
    }
    .room-invite {
        gap: 0.4rem 0.6rem;
    }
    .room-code {
        gap: 0.4rem;
    }
    .room-code > .section-label {
        font-size: 0.6rem;
    }
    .lobby-code {
        font-size: 1.15rem;
        letter-spacing: 0.12em;
    }
}
</style>
