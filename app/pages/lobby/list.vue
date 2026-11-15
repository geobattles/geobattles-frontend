<template>
    <div class="game-shell">
        <Header />
        <main id="main-content" class="page-shell directory-shell">
            <div class="page-heading">
                <div>
                    <p class="eyebrow">Multiplayer</p>
                    <h1 class="command-heading">Open lobbies</h1>
                </div>
                <div class="btn-row">
                    <NuxtLink class="btn btn-secondary" to="/lobby/join">Game code</NuxtLink
                    ><button class="btn" type="button" :disabled="!!working" @click="create">
                        <span v-if="working === 'create'" class="spinner" /><UiIcon v-else name="plus" />Create lobby
                    </button>
                </div>
            </div>
            <section class="directory-board">
                <div class="list-tools">
                    <div class="field list-search">
                        <label for="lobby-search">Find a lobby</label><input id="lobby-search" v-model="search" type="search" class="input" placeholder="Search by name or code" />
                    </div>
                    <div class="field">
                        <label for="lobby-sort">Sort by</label
                        ><select id="lobby-sort" v-model="sort" class="input">
                            <option value="name">Lobby name</option>
                            <option value="players">Most players</option>
                            <option value="round">Round</option>
                        </select>
                    </div>
                    <button class="btn btn-secondary" type="button" :disabled="loading" :aria-busy="loading" @click="refresh(false)">
                        <span v-if="loading" class="spinner" /><UiIcon v-else name="refresh" />Refresh
                    </button>
                </div>
                <p v-if="error" class="notice notice-error directory-error" role="alert">{{ error }} Refresh to try again.</p>
                <div v-if="!loaded" class="empty-state" role="status">
                    <h2>{{ loading ? "Loading lobbies…" : "Lobbies unavailable" }}</h2>
                    <p class="muted">You can also join with a game code.</p>
                </div>
                <div v-else-if="!filtered.length" class="empty-state">
                    <h2>{{ search ? "No matching lobbies" : "No open lobbies" }}</h2>
                    <p class="muted">{{ search ? "Try another name or code." : "Create a lobby and invite a friend." }}</p>
                </div>
                <ul v-else class="lobby-list" aria-label="Available GeoBattles lobbies">
                    <li v-for="entry in pageEntries" :key="entry.ID" class="lobby-row">
                        <div class="lobby-name">
                            <h2>{{ entry.conf.name }}</h2>
                            <span class="lobby-id"><span class="sr-only">Game code: </span>{{ entry.ID }}</span>
                        </div>
                        <div class="lobby-meta">
                            <p class="lobby-count" title="Connected players / lobby capacity">
                                <UiIcon name="users" /><span>{{ connectedCount(entry) }} / {{ entry.conf.maxPlayers }} online</span>
                            </p>
                            <p class="lobby-status" :class="{ 'is-active': isActive(entry) }">
                                {{ entry.phase === "FINISHED" ? "Finished · rematch" : isActive(entry) ? `Round ${entry.currentRound} / ${entry.conf.numRounds}` : "Waiting" }}
                            </p>
                        </div>
                        <button
                            class="btn btn-secondary lobby-action"
                            :class="{ 'lobby-joinable': joinable(entry) }"
                            type="button"
                            :disabled="!joinable(entry) || !!working"
                            :aria-busy="working === entry.ID"
                            :aria-label="`${joinable(entry) ? (member(entry) ? 'Return to' : 'Join') : isActive(entry) ? 'In progress:' : 'Full:'} ${entry.conf.name}`"
                            @click="join(entry.ID)"
                        >
                            <span v-if="working === entry.ID" class="spinner" />{{
                                joinable(entry) ? (member(entry) ? "Return" : "Join") : isActive(entry) ? "In progress" : "Full"
                            }}
                        </button>
                    </li>
                </ul>
                <footer v-if="filtered.length" class="list-footer">
                    <p class="field-help" role="status">{{ filtered.length }} {{ filtered.length === 1 ? "lobby" : "lobbies" }} · Page {{ page }} of {{ pages }}</p>
                    <div class="btn-row">
                        <label class="sr-only" for="lobby-page-size">Lobbies per page</label
                        ><select id="lobby-page-size" class="input page-size" v-model.number="pageSize">
                            <option :value="5">5</option>
                            <option :value="10">10</option>
                            <option :value="20">20</option></select
                        ><button type="button" class="btn btn-secondary" :disabled="page <= 1" @click="page--">Previous</button
                        ><button type="button" class="btn btn-secondary" :disabled="page >= pages" @click="page++">Next</button>
                    </div>
                </footer>
            </section>
        </main>
    </div>
</template>
<script setup lang="ts">
import type { LobbyInfo } from "~/types/appTypes";
const lobby = useLobbyStore();
const auth = useAuthStore();
const player = usePlayerInfo();
const toast = useToast();
const search = ref("");
const sort = ref("name");
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const loaded = ref(false);
const error = ref("");
const working = ref<string | null>(null);
const pending = ref<string | null>(null);
let disposed = false;
let timer: ReturnType<typeof setInterval> | undefined;
const connectedCount = (entry: LobbyInfo) => Object.values(entry.playerList || {}).filter((person) => person.connected).length;
const isActive = (entry: LobbyInfo) => entry.phase === "PLAYING" || entry.phase === "MID-ROUND";
const member = (entry: LobbyInfo) => !!player.value.ID && !!entry.playerList?.[player.value.ID];
const joinable = (entry: LobbyInfo) => member(entry) || (!isActive(entry) && Object.keys(entry.playerList || {}).length < entry.conf.maxPlayers);
const filtered = computed(() =>
    Object.values(lobby.lobbyList)
        .filter((entry) => `${entry.conf.name} ${entry.ID}`.toLocaleLowerCase().includes(search.value.toLocaleLowerCase().trim()))
        .sort((a, b) =>
            sort.value === "players" ? connectedCount(b) - connectedCount(a) : sort.value === "round" ? b.currentRound - a.currentRound : a.conf.name.localeCompare(b.conf.name)
        )
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
const pageEntries = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
watch([search, sort, pageSize], () => {
    page.value = 1;
});
watch(pages, (count) => {
    page.value = Math.min(page.value, count);
});
const refresh = async (background: boolean) => {
    if (disposed || loading.value || (background && (document.hidden || !navigator.onLine))) return;
    loading.value = true;
    try {
        await lobby.fetchLobbyList();
        if (!disposed) {
            loaded.value = true;
            error.value = "";
        }
    } catch {
        if (!disposed) error.value = "Could not reach the lobby directory.";
    } finally {
        if (!disposed) loading.value = false;
    }
};
const perform = async (id: string) => {
    if (disposed || working.value) return;
    if (!auth.isAuthenticated) {
        pending.value = id;
        auth.isLoginDialog = true;
        return;
    }
    working.value = id;
    pending.value = null;
    try {
        if (id === "create") await lobby.createLobby();
        else await lobby.joinLobby(id);
    } catch (cause) {
        toast.add({
            severity: "error",
            summary: id === "create" ? "Could not create a lobby" : "Could not join the lobby",
            detail: cause instanceof Error ? cause.message : "Please try again.",
        });
    } finally {
        if (!disposed) working.value = null;
    }
};
const create = () => perform("create");
const join = (id: string) => perform(id);
watch(
    () => auth.isAuthenticated,
    (signedIn) => {
        if (signedIn && pending.value) void perform(pending.value);
    }
);
watch(
    () => auth.isLoginDialog,
    (open) => {
        if (!open && !auth.isAuthenticated) pending.value = null;
    }
);
onMounted(() => {
    void refresh(false);
    timer = setInterval(() => {
        void refresh(true);
    }, 5000);
});
onBeforeUnmount(() => {
    disposed = true;
    clearInterval(timer);
});
useHead({ title: "Find a lobby" });
</script>
<style scoped>
.directory-shell {
    max-width: 1100px;
    padding: clamp(1rem, 3vw, 2rem) clamp(0.75rem, 3vw, 2rem);
}
.page-heading {
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1rem;
}
h1 {
    font-size: clamp(1.55rem, 4vw, 2rem);
}
.directory-board {
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
    background: var(--gb-surface);
    box-shadow: 0 16px 48px #0003;
}
.btn-row {
    gap: 0.5rem;
}
.btn {
    padding: 0.55rem 0.8rem;
    font-size: 0.85rem;
}
.list-tools {
    padding: 1rem;
    background: #1e201e;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(9rem, 0.45fr) auto;
    align-items: flex-end;
    gap: 0.75rem;
    border-bottom: 1px solid var(--gb-line);
}
.field {
    gap: 0.25rem;
}
.input {
    min-height: 44px;
    padding: 0.5rem 0.65rem;
    font-size: 1rem;
}
.directory-error {
    margin: 0.75rem 1rem;
}
.empty-state {
    padding: 2.5rem 1.25rem;
    text-align: left;
}
.empty-state h2 {
    font-size: 1.1rem;
}
.empty-state p {
    font-size: 0.85rem;
    margin: 0.5rem 0 0;
}
.lobby-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.lobby-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 8rem minmax(7rem, 0.65fr) 6.5rem;
    grid-template-areas: "name count status action";
    gap: 0.75rem;
    align-items: center;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--gb-line);
}
.lobby-row:last-child {
    border-bottom: 0;
}
.lobby-row:focus-within {
    background: var(--gb-raised);
}
.lobby-name {
    grid-area: name;
    min-width: 0;
}
.lobby-name h2 {
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: 0;
    text-wrap: wrap;
    overflow-wrap: anywhere;
}
.lobby-id {
    display: block;
    color: var(--gb-muted);
    font: 500 0.72rem var(--gb-font-mono);
    letter-spacing: 0.1em;
    margin-top: 0.2rem;
}
.lobby-meta {
    display: contents;
}
.lobby-count {
    grid-area: count;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--gb-muted);
    font-size: 0.8rem;
}
.lobby-status {
    grid-area: status;
    color: var(--gb-accent);
    font-size: 0.8rem;
    overflow-wrap: anywhere;
}
.lobby-status.is-active {
    color: var(--gb-coral);
}
.lobby-action {
    grid-area: action;
    justify-self: stretch;
}
.lobby-joinable {
    color: var(--gb-accent);
    border-color: var(--gb-accent-end);
    background: #b6e38808;
}
.list-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--gb-line);
    background: #1e201e;
}
.page-size {
    width: auto;
    min-height: 44px;
    padding: 0.5rem;
}
@media (max-width: 640px), (max-width: 850px) and (max-height: 540px) {
    .directory-shell {
        padding: 0.5rem;
    }
    h1 {
        font-size: var(--gb-mobile-heading);
    }
    .page-heading {
        gap: 0.35rem;
        margin-bottom: 0.5rem;
    }
    .list-footer,
    .list-tools {
        padding: var(--gb-mobile-space);
    }
    .page-heading .eyebrow {
        margin-bottom: 0.1rem;
        font-size: 0.65rem;
    }
    .btn {
        font-size: var(--gb-mobile-button);
        padding: 0.45rem 0.6rem;
    }
    .input {
        font-size: 1rem;
    }
    .list-tools {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.5rem;
    }
    .list-search {
        grid-column: 1 / -1;
    }
    .lobby-row {
        grid-template-columns: minmax(0, 1fr) minmax(4.5rem, auto);
        grid-template-areas: "name action" "meta action";
        gap: 0.15rem 0.5rem;
        padding: 0.5rem;
    }
    .lobby-name {
        display: flex;
        align-items: baseline;
        gap: 0.25rem 0.5rem;
        flex-wrap: wrap;
    }
    .lobby-name h2 {
        font-size: var(--gb-mobile-body);
    }
    .lobby-id {
        margin: 0;
        font-size: var(--gb-mobile-help);
        letter-spacing: 0.05em;
    }
    .lobby-meta {
        grid-area: meta;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.1rem 0.5rem;
        min-width: 0;
    }
    .lobby-count,
    .lobby-status {
        font-size: var(--gb-mobile-help);
        line-height: 1.3;
    }
    .lobby-count :deep(svg) {
        width: 14px;
        height: 14px;
    }
    .lobby-action {
        max-width: 6.5rem;
    }
    .list-footer .btn-row {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>
