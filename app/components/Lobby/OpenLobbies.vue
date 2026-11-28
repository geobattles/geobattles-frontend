<template>
    <div class="open-lobbies">
        <div class="directory-tools">
            <label class="directory-search" data-viewport-field>
                <span class="sr-only">Find a lobby</span>
                <input
                    :value="search"
                    type="search"
                    class="input"
                    placeholder="Search name or code"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    enterkeyhint="search"
                    @input="search = ($event.target as HTMLInputElement).value"
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
                            <strong>{{ entry.name }}</strong
                            ><code>{{ entry.ID }}</code>
                        </div>
                        <span v-if="entry.hostName" class="lobby-host">Host {{ entry.hostName }}</span>
                    </div>
                    <div class="lobby-details">
                        <span class="lobby-capacity"
                            ><UiIcon name="users" /><span class="sr-only">Connected players</span> {{ entry.connected }} / {{ entry.maxPlayers }}
                            <span v-if="entry.occupied > entry.connected">· {{ entry.occupied - entry.connected }} reserved</span>
                        </span>
                        <span>{{ entry.phase === "FINISHED" ? "Rematch" : isActive(entry) ? "Round " + entry.currentRound + " / " + entry.numRounds : "Waiting" }}</span>
                    </div>
                    <button
                        class="directory-button lobby-join"
                        type="button"
                        :disabled="!joinable(entry) || !!working"
                        :aria-busy="working === entry.ID"
                        :aria-label="joinLabel(entry) + ' ' + entry.name"
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
import type { LobbySummary } from "~/types/appTypes";

const props = defineProps<{ active: boolean; working?: string; actionError?: string }>();
const emit = defineEmits<{ join: [id: string]; create: [] }>();
const lobby = useLobbyStore();
const player = usePlayerInfo();
const auth = useAuthStore();
const search = ref("");
const sort = ref("name");
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const loaded = ref(false);
const error = ref("");
let request: AbortController | undefined;
const isActive = (entry: LobbySummary) => entry.phase === "PLAYING" || entry.phase === "MID-ROUND";
const joinable = (entry: LobbySummary) => (entry.retained ? !entry.starting || entry.spectating : entry.openToNew || entry.openToSpectators) === true;
const joinLabel = (entry: LobbySummary) => {
    if (entry.retained) return joinable(entry) ? "Return" : "Starting";
    if (entry.openToNew) return "Join";
    if (entry.openToSpectators) return "Watch";
    return entry.starting ? "Starting" : isActive(entry) ? "In progress" : "Full";
};
const filtered = computed(() =>
    Object.values(lobby.lobbyList)
        .filter((entry) => (entry.name + " " + entry.ID).toLowerCase().includes(search.value.toLowerCase().trim()))
        .sort((a, b) => (sort.value === "players" ? b.connected - a.connected : sort.value === "round" ? b.currentRound - a.currentRound : a.name.localeCompare(b.name)))
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
    if (!props.active || request || (background && (document.hidden || !navigator.onLine))) return;
    const current = new AbortController();
    request = current;
    loading.value = true;
    try {
        await lobby.fetchLobbyList(current.signal);
        if (!current.signal.aborted) {
            loaded.value = true;
            error.value = "";
        }
    } catch {
        if (!current.signal.aborted) error.value = "Couldn’t load lobbies. Refresh to try again.";
    } finally {
        if (request === current) {
            request = undefined;
            loading.value = false;
        }
    }
}

onMounted(() => {
    watch(
        [() => props.active, () => player.value.ID, () => auth.isAuthenticated],
        ([active, id, authenticated], previous, onCleanup) => {
            if (previous[0] === undefined || previous[1] !== id || previous[2] !== authenticated) {
                lobby.lobbyList = {};
                error.value = "";
                loaded.value = false;
            }
            if (!active) return;
            void refresh(false);
            const timer = setInterval(() => void refresh(true), 5000);
            onCleanup(() => {
                clearInterval(timer);
                request?.abort();
                request = undefined;
                loading.value = false;
            });
        },
        { immediate: true }
    );
});
</script>

<style scoped>
.open-lobbies {
    display: flex;
    flex: 1 1 auto;
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
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 5.5rem;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    border: 1px solid #92dcc333;
    border-radius: 0.75rem;
    background: #031e1ccc;
}
.directory-error,
.directory-empty {
    padding: 0.75rem;
    margin: 0;
    color: #b7d5ca;
    font-size: 0.82rem;
}
.directory-empty {
    display: grid;
    flex: 1 1 auto;
    place-items: center;
    text-align: center;
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
    padding: 0.04rem 0.34rem;
    border-radius: 999px;
    background: #b8efa018;
    color: #b8efa0;
    font-size: 0.68rem;
    font-weight: 700;
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
@media (max-width: 760px), (orientation: landscape) and (max-height: 540px) {
    .open-lobbies {
        gap: 0.42rem;
    }
    .directory-tools {
        gap: 0.28rem;
    }
    .directory-tools .input {
        height: 36px;
        min-height: 36px;
        padding: 0.22rem 0.52rem;
        border-radius: 0.58rem;
        font-size: 0.8rem;
    }
    .directory-button {
        min-width: 36px;
        min-height: 36px;
        gap: 0.3rem;
        padding: 0.2rem 0.56rem;
        border-radius: 0.58rem;
        font-size: 0.74rem;
    }
    .directory-button .ui-icon,
    .lobby-capacity .ui-icon {
        width: 0.86rem;
        height: 0.86rem;
    }
    .directory-results {
        border-radius: 0.68rem;
    }
    .directory-error,
    .directory-empty {
        padding: 0.52rem;
        font-size: 0.76rem;
    }
    .lobby-list {
        gap: 0.22rem;
        padding: 0.22rem;
    }
    .directory-row {
        gap: 0.14rem 0.42rem;
        padding: 0.36rem 0.44rem;
        border-radius: 0.56rem;
    }
    .lobby-identity {
        padding-inline-start: 0.12rem;
    }
    .lobby-title {
        gap: 0.12rem 0.34rem;
    }
    .lobby-title strong {
        font-size: 0.8rem;
        font-weight: 760;
    }
    .lobby-title code {
        font-size: 0.64rem;
    }
    .lobby-host,
    .lobby-details,
    .directory-footer {
        font-size: 0.69rem;
    }
    .lobby-join {
        min-width: 0;
        min-height: 32px;
        padding: 0.18rem 0.72rem;
        border-radius: 999px;
        font-size: 0.73rem;
    }
    .directory-pagination {
        gap: 0.3rem;
    }
    .directory-pagination .input {
        height: 32px;
        min-height: 32px;
        padding: 0.14rem 0.38rem;
        border-radius: 0.52rem;
        font-size: 0.74rem;
    }
    .directory-pagination .directory-button {
        min-width: 32px;
        min-height: 32px;
        padding: 0;
        border-radius: 999px;
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
        padding-inline: 0.38rem;
    }
    .directory-row {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.14rem 0.42rem;
    }
    .lobby-details {
        grid-row: 2;
        display: flex;
        flex-wrap: wrap;
        gap: 0.12rem 0.42rem;
        padding-inline-start: 0.12rem;
    }
    .lobby-join {
        grid-area: 1 / 2 / span 2;
    }
}
</style>
