<template>
    <div class="live-statistics table-scroll" :class="{ 'is-compact': compact }">
        <table class="data-table live-table">
            <caption class="sr-only">
                This round’s live results
            </caption>
            <thead>
                <tr>
                    <th scope="col">{{ compact ? "Player" : "Explorer" }}</th>
                    <th scope="col" class="numeric">Left</th>
                    <th scope="col" class="numeric">Distance</th>
                    <th scope="col" class="numeric">{{ compact ? "Pts" : "Base pts" }}</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="[id, result] in entries"
                    :key="id"
                    :id="playerHooks ? `live-player-${id}` : undefined"
                    :data-testid="activeHooks ? 'player-row' : undefined"
                    :data-player-name="lobby.lobbySettings?.playerList[id]?.name"
                    :data-connected="String(lobby.lobbySettings?.playerList[id]?.connected === true)"
                    :data-ready="String(lobby.lobbySettings?.playerList[id]?.ready === true)"
                    :data-host="String(lobby.lobbySettings?.admin === id)"
                >
                    <td>
                        <span class="player-identity"
                            ><span class="player-swatch" :style="{ backgroundColor: getPlayerColorByID(id) }" /><span class="live-player-name" :title="getPlayerNameFromID(id)">{{
                                getPlayerNameFromID(id)
                            }}</span></span
                        >
                    </td>
                    <td class="numeric" :title="`${result.lives} guesses remaining`">{{ result.lives }}</td>
                    <td class="numeric live-distance">{{ formatGuessDistance(result) }}</td>
                    <td class="numeric accent font-semibold">{{ result.baseScr || 0 }}</td>
                </tr>
            </tbody>
        </table>
        <p v-if="!entries.length" class="field-help p-3">Waiting for the round to begin.</p>
    </div>
</template>
<script setup lang="ts">
const props = defineProps<{ playerHooks?: boolean; compact?: boolean }>();
const game = useGameMode();
const activeHooks = computed(() => props.playerHooks && ["PLAYING", "STARTING"].includes(game.modeLogic.currentState));
const results = useResultsStore();
const lobby = useLobbyStore();
const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
const entries = computed(() => Object.entries(results.liveResults).filter(([id]) => !!lobby.lobbySettings?.playerList[id]));
</script>
<style scoped>
.live-statistics {
    background: var(--gb-surface);
}
.live-table {
    table-layout: fixed;
    color: var(--gb-text);
    font-size: 0.84rem;
    line-height: 1.4;
}
.live-table :is(th, td) {
    box-sizing: border-box;
    padding: 0.85rem 0.55rem;
}
.live-table th {
    background: #1e201e;
    color: var(--gb-muted);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.035em;
    text-transform: uppercase;
}
.live-table .numeric {
    font-variant-numeric: tabular-nums;
}
.live-table :is(th, td):nth-child(2) {
    width: 44px;
}
.live-table :is(th, td):nth-child(3) {
    width: 102px;
}
.live-table :is(th, td):nth-child(4) {
    width: 76px;
}
.live-table tbody tr:nth-child(even) {
    background: color-mix(in srgb, var(--gb-raised) 45%, var(--gb-surface));
}
.live-table td:nth-child(2) {
    color: var(--gb-muted);
}
.live-table td:nth-child(3) {
    color: var(--gb-accent);
    font-weight: 700;
    background: #b6e38805;
}
.live-table td:nth-child(4) {
    color: var(--gb-text);
}
.player-identity {
    min-width: 0;
    gap: 0.4rem;
    font-weight: 600;
}
.live-player-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.is-compact .live-table {
    font-size: 0.7rem;
    line-height: 1.25;
}
.is-compact .live-table :is(th, td) {
    padding: 7px 4px;
}
.is-compact .live-table th {
    font-size: 0.62rem;
    letter-spacing: 0;
    text-transform: none;
}
.is-compact .live-table :is(th, td):nth-child(2) {
    width: 30px;
}
.is-compact .live-table :is(th, td):nth-child(3) {
    width: 80px;
}
.is-compact .live-table :is(th, td):nth-child(4) {
    width: 48px;
}
.is-compact .player-identity {
    gap: 4px;
}
.is-compact .player-swatch {
    width: 6px;
    height: 6px;
}
</style>
