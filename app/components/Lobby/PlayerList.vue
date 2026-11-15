<template>
    <section class="player-roster" aria-label="Lobby explorers">
        <div class="panel-heading">
            <h2 class="roster-title">Players</h2>
            <span class="roster-count">{{ entries.length }} / {{ lobby.lobbySettings?.conf.maxPlayers }}</span>
        </div>
        <ul class="crew-list">
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
                <span class="crew-avatar" :style="{ color: member.color }"><UiIcon name="user" /></span>
                <div class="crew-name">
                    <span>{{ member.name }} <span v-if="id === player.ID" class="muted text-xs">(you)</span></span
                    ><small v-if="lobby.lobbySettings?.admin === id"><UiIcon name="crown" />Host</small>
                </div>
                <span class="badge" :class="member.connected ? (member.ready ? 'badge-success' : '') : 'badge-warn'"
                    ><UiIcon v-if="member.ready && member.connected" name="check" />{{ !member.connected ? "Reconnecting" : member.ready ? "Ready" : "Not ready" }}</span
                >
            </li>
        </ul>
        <p v-if="away" class="field-help mt-2">Waiting for disconnected players to return.</p>
    </section>
</template>
<script setup lang="ts">
const lobby = useLobbyStore();
const player = usePlayerInfo();
const entries = computed(() => Object.entries(lobby.lobbySettings?.playerList ?? {}));
const away = computed(() => entries.value.some(([, member]) => !member.connected));
</script>
<style scoped>
.roster-title {
    font-size: 1rem;
    font-weight: 800;
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
}
.crew-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 52px;
    padding: 0.6rem 0.3rem;
    border-top: 1px solid var(--gb-line);
}
.crew-self {
    background: color-mix(in srgb, var(--gb-accent) 5%, transparent);
}
.crew-avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 3px;
    background: var(--gb-bg);
    border: 1px solid currentColor;
    flex: none;
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
    background: #b6e3880d;
}
.crew-away .crew-name {
    color: var(--gb-muted);
}
@media (max-width: 640px), (max-height: 540px) and (orientation: landscape) {
    .crew-row {
        min-height: 44px;
        padding-block: 0.35rem;
        gap: 0.5rem;
    }
    .crew-avatar {
        width: 28px;
        height: 28px;
    }
    .crew-name {
        font-size: 0.8rem;
    }
}
</style>
