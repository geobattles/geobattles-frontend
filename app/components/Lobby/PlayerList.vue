<template>
    <section class="player-roster" :class="{ staging }" aria-label="Lobby explorers">
        <div class="panel-heading roster-heading">
            <h2 class="roster-title"><UiIcon v-if="staging" name="users" /> {{ staging ? "Players" : "Crew" }}<span v-if="!staging"> / Players</span></h2>
            <span v-if="staging" class="roster-ready">{{ lobby.readyPlayerCount }} ready</span>
            <span class="roster-count">{{ entries.length }} / {{ lobby.lobbySettings?.conf.maxPlayers }}</span>
        </div>
        <div
            ref="viewport"
            :id="staging ? rosterId : undefined"
            :class="{ 'crew-scroll': staging }"
            :tabindex="overflows ? 0 : undefined"
            :role="overflows ? 'region' : undefined"
            :aria-label="overflows ? 'All players' : undefined"
            @scroll.passive="updateRosterScroll"
        >
            <TransitionGroup tag="ul" name="crew-change" class="crew-list">
                <li
                    v-for="[id, member] in entries"
                    :key="id"
                    data-testid="player-row"
                    :data-player-name="member.name"
                    :data-connected="String(member.connected)"
                    :data-ready="String(member.ready === true)"
                    :data-host="String(lobby.lobbySettings?.admin === id)"
                    class="crew-row"
                    :class="{ 'crew-away': !member.connected, 'crew-self': id === player.ID }"
                >
                    <span v-if="staging" class="crew-avatar scenic-avatar" :data-scene="avatarScene(id)" :style="{ '--player-color': member.color }" aria-hidden="true" />
                    <PlayerAvatar v-else class="crew-avatar" :color="member.color" />
                    <div class="crew-name">
                        <span>{{ member.name }} <span v-if="id === player.ID" class="muted text-xs">(you)</span></span
                        ><small v-if="lobby.lobbySettings?.admin === id"><UiIcon name="crown" />Host</small>
                    </div>
                    <span class="badge" :class="member.connected ? (member.ready ? 'badge-success' : '') : 'badge-warn'"
                        ><UiIcon v-if="member.ready && member.connected" name="check" />{{ !member.connected ? "Reconnecting" : member.ready ? "Ready" : "Not ready" }}</span
                    >
                </li>
            </TransitionGroup>
        </div>
        <button v-if="staging && overflows" class="roster-more btn btn-quiet" type="button" :aria-controls="rosterId" @click="scrollRoster">
            {{ atEnd ? "Back to top" : "Show more" }} <span aria-hidden="true">{{ atEnd ? "↑" : "⌄" }}</span>
        </button>
        <p v-if="away" class="field-help mt-2">Waiting for disconnected players to return.</p>
    </section>
</template>
<script setup lang="ts">
import PlayerAvatar from "../Ui/PlayerAvatar.vue";

const props = defineProps<{ staging?: boolean }>();
const rosterId = useId();
const viewport = ref<HTMLDivElement | null>(null);
const overflows = ref(false);
const atEnd = ref(false);
function avatarScene(id: string) {
    return Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
}
function updateRosterScroll() {
    const box = viewport.value;
    if (box) atEnd.value = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
}
function scrollRoster() {
    const box = viewport.value;
    if (!box) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    box.scrollTo({ top: atEnd.value ? 0 : box.scrollTop + box.clientHeight, behavior });
}
let observer: ResizeObserver | undefined;
onMounted(() => {
    const list = viewport.value?.firstElementChild;
    if (!props.staging || !viewport.value || !list) return;
    observer = new ResizeObserver(() => {
        const box = viewport.value;
        overflows.value = !!box && box.clientHeight > 0 && box.scrollHeight > box.clientHeight;
        updateRosterScroll();
    });
    observer.observe(viewport.value);
    observer.observe(list);
});
onBeforeUnmount(() => observer?.disconnect());
const lobby = useLobbyStore();
const player = usePlayerInfo();
const entries = computed(() => {
    const members = Object.entries(lobby.lobbySettings?.playerList ?? {});
    if (!props.staging) return members;
    const priority = (id: string) => (id === player.value.ID ? 0 : id === lobby.lobbySettings?.admin ? 1 : 2);
    return members.sort(([a, first], [b, second]) => priority(a) - priority(b) || first.name.localeCompare(second.name) || a.localeCompare(b));
});
const away = computed(() => entries.value.some(([, member]) => !member.connected));
</script>
<style scoped>
.roster-title {
    font-size: 1rem;
    font-weight: 800;
}
.roster-title span {
    font: 600 0.74rem var(--gb-font-mono);
    color: var(--gb-muted);
}
.roster-count {
    color: var(--gb-muted);
    font: 600 0.72rem var(--gb-font-mono);
    font-variant-numeric: tabular-nums;
}
.crew-list {
    display: grid;
    padding: 0;
    margin: 0;
    list-style: none;
    gap: 0.25rem;
}
.crew-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 52px;
    padding: 0.6rem 0.7rem;
    background: var(--gb-bg);
    border-inline-start: 3px solid var(--gb-line);
}
.crew-self {
    border-inline-start-color: var(--gb-accent);
}
.crew-avatar {
    --player-avatar-size: 32px;
}
.crew-name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.85rem;
    font-weight: 700;
}
.crew-name small {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.1rem;
    font: 500 0.62rem / 1.4 var(--gb-font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--gb-accent);
}
.crew-name small > svg {
    width: 12px;
    height: 12px;
}
.crew-row > .badge {
    flex: none;
    font-size: 0.7rem;
    border-color: transparent;
    background: none;
}
.crew-row > .badge-success {
    color: var(--gb-success);
    background: color-mix(in srgb, var(--gb-success) 10%, transparent);
}
.crew-away .crew-name {
    color: var(--gb-muted);
}
.staging {
    display: flex;
    min-height: 0;
    flex-direction: column;
}
.staging .roster-heading {
    flex: none;
    justify-content: flex-start;
    gap: 0.55rem;
    margin: 0 0 0.55rem;
}
.staging .roster-title {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-right: auto;
    font-size: 1rem;
}
.staging .roster-title svg,
.roster-ready {
    color: #a3f66b;
}
.roster-ready {
    font-size: 0.75rem;
}
.crew-scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    outline-offset: -2px;
}
.staging .crew-list {
    position: relative;
    gap: 0;
    overflow: clip;
    border-radius: 9px;
    background: #031d1da8;
}
.staging .crew-row {
    min-height: 43px;
    padding: 0.35rem 0.65rem;
    border-inline-start-color: transparent;
    background: transparent;
}
.staging .crew-row + .crew-row {
    border-top: 1px solid #88e1c01e;
}
.staging .crew-self {
    border-inline-start-color: #a3f66b;
    background: linear-gradient(90deg, #2d78534a, transparent 84%);
}
.staging .crew-avatar {
    --player-avatar-size: 30px;
    border-radius: 50%;
    background: #194839;
}
.staging .scenic-avatar {
    width: var(--player-avatar-size);
    aspect-ratio: 1;
    flex: none;
    border: 1px solid color-mix(in srgb, var(--player-color, #a3f66b), #e0fff4 65%);
    background: url("/images/emerald-lake-portrait.webp") 52% 64% / 145% auto;
}
.staging .scenic-avatar[data-scene="1"] {
    background-position: 92% 82%;
}
.staging .scenic-avatar[data-scene="2"],
.staging .scenic-avatar[data-scene="3"] {
    background-image: url("/images/emerald-horizon-portrait.webp");
    background-position: 30% 38%;
}
.staging .scenic-avatar[data-scene="3"] {
    background-position: 73% 60%;
}
.roster-more {
    min-height: 44px;
    flex: none;
    align-self: center;
    padding: 0.2rem 0.65rem;
    color: #d4f6e6;
    font-size: 0.73rem;
}
.staging .crew-name small {
    display: inline-flex;
    margin: 0 0 0 0.35rem;
}
.staging .crew-row > .badge {
    border-radius: 999px;
    background: #12514d9e;
    color: #e1f7ed;
    transition:
        background-color 160ms,
        color 160ms;
}
.staging .crew-row > .badge-success {
    background: #176744c9;
    color: #c1ff9a;
}
.staging .crew-row > .badge-warn {
    color: var(--gb-coral);
    background: #4d2e2edb;
}
@media (prefers-reduced-motion: no-preference) {
    .staging .crew-change-enter-active,
    .staging .crew-change-leave-active,
    .staging .crew-change-move {
        transition:
            transform 190ms ease,
            opacity 190ms ease,
            background-color 190ms ease;
    }
    .staging .crew-change-leave-active {
        position: absolute;
        width: 100%;
        pointer-events: none;
    }
    .staging .crew-change-enter-from,
    .staging .crew-change-leave-to {
        transform: translateX(-0.35rem);
        opacity: 0;
        background: #31835688;
    }
}
@media (max-width: 760px), (orientation: landscape) and (max-height: 540px) {
    .roster-title span {
        display: none;
    }
    .staging .crew-row {
        gap: 0.4rem;
        min-height: 34px;
        padding: 0.2rem 0.35rem;
    }
    .staging .crew-avatar {
        --player-avatar-size: 24px;
    }
    .staging .crew-row > .badge {
        padding: 0.13rem 0.35rem;
    }
}
</style>
