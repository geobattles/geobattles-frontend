<template>
    <div class="open-lobbies">
        <div class="directory-tools">
            <label class="directory-search" data-viewport-field>
                <span class="sr-only">Find a lobby</span>
                <input
                    v-model="search"
                    type="search"
                    class="input"
                    placeholder="Search name or code"
                    autocomplete="off"
                    enterkeyhint="search"
                    @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                />
            </label>
            <label class="directory-sort">
                <span class="sr-only">Sort by</span>
                <select v-model="sort" class="input">
                    <option value="name">Lobby name</option>
                    <option value="players">Most players</option>
                    <option value="round">Round</option>
                </select>
            </label>
            <button class="directory-button refresh-lobbies" type="button" aria-label="Refresh lobbies" title="Refresh lobbies" :disabled="loading" @click="refresh(false)">
                <span v-if="loading" class="spinner" aria-hidden="true" /><UiIcon v-else name="refresh" />
            </button>
            <button class="directory-button create-lobby" type="button" :disabled="!!working" :aria-busy="working === 'create'" @click="emit('create')">
                <span v-if="working === 'create'" class="spinner" aria-hidden="true" /><UiIcon v-else name="plus" /><span>Create lobby</span>
            </button>
        </div>
        <div class="directory-results" :aria-busy="loading">
            <p v-if="error || actionError" class="directory-error" role="alert">{{ actionError || error }}</p>
            <p v-if="!loaded && !error" class="directory-empty" role="status">Loading lobbies…</p>
            <p v-else-if="loaded && !filtered.length" class="directory-empty" role="status">{{ search.trim() ? "No matching lobbies" : "No open lobbies" }}</p>
            <ul v-else-if="loaded" class="lobby-list" aria-label="Available GeoBattles lobbies">
                <li v-for="entry in pageEntries" :key="entry.ID" class="directory-row">
                    <div class="lobby-identity">
                        <div class="lobby-title">
                            <strong>{{ entry.conf.name }}</strong
                            ><code>{{ entry.ID }}</code>
                        </div>
                        <span v-if="entry.playerList?.[entry.admin]?.name" class="lobby-host">Host {{ entry.playerList[entry.admin]?.name }}</span>
                    </div>
                    <div class="lobby-details">
                        <span class="lobby-capacity" aria-label="Connected players"><UiIcon name="users" /> {{ connectedCount(entry) }} / {{ entry.conf.maxPlayers }}</span>
                        <span>{{ entry.phase === "FINISHED" ? "Rematch" : isActive(entry) ? "Round " + entry.currentRound + " / " + entry.conf.numRounds : "Waiting" }}</span>
                    </div>
                    <button
                        class="directory-button lobby-join"
                        type="button"
                        :disabled="!joinable(entry) || !!working"
                        :aria-busy="working === entry.ID"
                        :aria-label="joinLabel(entry) + ' ' + entry.conf.name"
                        @click="emit('join', entry.ID)"
                    >
                        <span v-if="working === entry.ID" class="spinner" aria-hidden="true" />{{ joinLabel(entry) }}
                    </button>
                </li>
            </ul>
        </div>
        <div v-if="filtered.length" class="directory-footer">
            <span role="status">{{ filtered.length }} {{ filtered.length === 1 ? "lobby" : "lobbies" }}</span>
            <div class="directory-pagination">
                <label class="sr-only" for="lobby-page-size">Lobbies per page</label>
                <select id="lobby-page-size" v-model.number="pageSize" class="input">
                    <option :value="5">5</option>
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                </select>
                <button class="directory-button page-previous" :disabled="page <= 1" type="button" aria-label="Previous page" @click="page--"><UiIcon name="arrow" /></button>
                <span aria-label="Current page">{{ page }} / {{ pages }}</span>
                <button class="directory-button" :disabled="page >= pages" type="button" aria-label="Next page" @click="page++"><UiIcon name="arrow" /></button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { LobbyInfo } from "~/types/appTypes";

const props = defineProps<{ active: boolean; working?: string; actionError?: string }>();
const emit = defineEmits<{ join: [id: string]; create: [] }>();
const lobby = useLobbyStore();
const player = usePlayerInfo();
const search = ref("");
const sort = ref("name");
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const loaded = ref(false);
const error = ref("");
let disposed = false;
const connectedCount = (entry: LobbyInfo) => Object.values(entry.playerList || {}).filter((person) => person.connected).length;
const isActive = (entry: LobbyInfo) => entry.phase === "PLAYING" || entry.phase === "MID-ROUND";
const member = (entry: LobbyInfo) => !!player.value.ID && !!entry.playerList?.[player.value.ID];
const joinable = (entry: LobbyInfo) => member(entry) || (!isActive(entry) && Object.keys(entry.playerList || {}).length < entry.conf.maxPlayers);
const joinLabel = (entry: LobbyInfo) => (joinable(entry) ? (member(entry) ? "Return" : "Join") : isActive(entry) ? "In progress" : "Full");
const filtered = computed(() =>
    Object.values(lobby.lobbyList)
        .filter((entry) => (entry.conf.name + " " + entry.ID).toLowerCase().includes(search.value.toLowerCase().trim()))
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

async function refresh(background: boolean) {
    if (disposed || loading.value || (background && (document.hidden || !navigator.onLine))) return;
    loading.value = true;
    try {
        await lobby.fetchLobbyList();
        if (!disposed) {
            loaded.value = true;
            error.value = "";
        }
    } catch {
        if (!disposed) error.value = "Couldn’t load lobbies. Refresh to try again.";
    } finally {
        if (!disposed) loading.value = false;
    }
}

onMounted(() => {
    watch(
        () => props.active,
        (active, _previous, onCleanup) => {
            if (!active) return;
            void refresh(false);
            const timer = setInterval(() => void refresh(true), 5000);
            onCleanup(() => clearInterval(timer));
        },
        { immediate: true }
    );
});
onBeforeUnmount(() => {
    disposed = true;
});
</script>

<style scoped>
.open-lobbies {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    max-height: 100%;
    min-height: 0;
    min-width: 0;
}
.directory-tools {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(6rem, auto) auto auto;
    flex: none;
    align-items: center;
    gap: 0.35rem;
}
.directory-tools label {
    min-width: 0;
}
.directory-tools .input,
.directory-pagination .input {
    width: 100%;
    height: 44px;
    min-height: 44px;
    padding: 0.35rem 0.55rem;
    border: 1px solid #92dcc350;
    border-radius: 0.65rem;
    background: #082824;
    color: #eefbf4;
    font-size: 1rem;
}
.directory-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-width: 44px;
    min-height: 44px;
    padding: 0.3rem 0.6rem;
    border: 1px solid #9ce1c545;
    border-radius: 0.65rem;
    background: #153d34;
    color: #ecfaf5;
    font-size: 0.78rem;
    font-weight: 750;
}
.directory-button .ui-icon,
.lobby-capacity .ui-icon {
    width: 1rem;
    height: 1rem;
    flex: none;
}
.directory-button:enabled:hover {
    border-color: #b0ef9d86;
    background: #235442;
}
.directory-button:disabled {
    opacity: 0.55;
}
.directory-results {
    min-height: 44px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    border: 1px solid #92dcc333;
    border-radius: 0.75rem;
    background: #031e1ccc;
}
.directory-error,
.directory-empty {
    padding: 0.65rem;
    margin: 0;
    color: #cae5dc;
    font-size: 0.85rem;
}
.directory-error {
    color: #ffd3ce;
}
.lobby-list {
    display: grid;
    gap: 0.25rem;
    margin: 0;
    padding: 0.25rem;
    list-style: none;
}
.directory-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(4.25rem, auto);
    align-items: center;
    gap: 0.55rem;
    padding: 0.45rem;
    border: 1px solid #a3dab521;
    border-radius: 0.6rem;
    background: #153b3266;
}
.lobby-identity {
    min-width: 0;
    padding-inline-start: 0.25rem;
}
.lobby-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.1rem 0.4rem;
}
.lobby-title strong {
    overflow-wrap: anywhere;
    font-size: 0.9rem;
}
.lobby-title code {
    color: #b8efa0;
    font-size: 0.72rem;
}
.lobby-host,
.lobby-details,
.directory-footer {
    color: #c0ded4;
    font-size: 0.76rem;
}
.lobby-host {
    overflow-wrap: anywhere;
}
.lobby-details {
    display: grid;
    justify-items: end;
    white-space: nowrap;
}
.lobby-capacity {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: #ddf0e8;
}
.lobby-capacity .ui-icon {
    color: #a4e9b7;
}
.lobby-join:enabled,
.lobby-join:enabled:hover {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
}
.lobby-join:enabled:hover {
    box-shadow: var(--gb-scenic-action-shadow);
}
.directory-footer,
.directory-pagination {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
}
.directory-pagination .input {
    width: auto;
}
.page-previous .ui-icon {
    rotate: 180deg;
}
@media (orientation: landscape) and (max-height: 310px) {
    .open-lobbies {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-rows: auto minmax(0, 1fr);
    }
    .directory-tools {
        grid-column: 1 / -1;
    }
    .directory-footer {
        align-self: start;
    }
    .directory-footer > span {
        @apply sr-only;
    }
}
@media (max-width: 550px) and (orientation: portrait) {
    .directory-tools {
        grid-template-columns: minmax(0, 1fr) auto auto;
    }
    .directory-search {
        grid-column: 1 / -1;
    }
    .directory-sort select {
        padding-inline: 0.35rem;
    }
    .directory-row {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.15rem 0.4rem;
    }
    .lobby-details {
        grid-row: 2;
        display: flex;
        flex-wrap: wrap;
        gap: 0.15rem 0.45rem;
        padding-inline-start: 0.25rem;
    }
    .lobby-join {
        grid-area: 1 / 2 / span 2;
    }
}
</style>
