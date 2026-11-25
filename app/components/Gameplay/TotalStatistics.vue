<template>
    <table class="total-table">
        <caption class="sr-only">
            Final standings and rematch readiness
        </caption>
        <thead>
            <tr>
                <th scope="col" class="place-col">Place</th>
                <th scope="col">Player</th>
                <th scope="col" class="score-col">Points</th>
                <th scope="col" class="ready-col">Rematch</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="row in rows" :key="row.id" :class="{ 'own-row': row.id === player.ID }">
                <td class="final-place">
                    <span v-if="row.rank !== undefined" class="place-number" :data-rank="row.rank">{{ row.rank }}</span>
                    <span v-else>—<span class="sr-only">Joined for rematch</span></span>
                </td>
                <th scope="row">
                    <span class="final-player">
                        <PlayerAvatar :color="getPlayerColorByID(row.id)" />
                        <span class="final-name" :title="getPlayerNameFromID(row.id)">{{ getPlayerNameFromID(row.id) }}</span>
                        <span v-if="row.id === player.ID" class="self-label">You</span>
                    </span>
                </th>
                <td class="final-points">{{ row.score?.toLocaleString() ?? "—" }}</td>
                <td class="final-readiness">
                    <template v-if="row.member?.ready">
                        <span class="final-ready"><UiIcon name="check" />Ready</span>
                        <div v-if="!row.member.connected">Offline</div>
                    </template>
                    <span v-else>{{ row.member ? (row.member.connected ? "Waiting" : row.member.away ? "Away" : "Offline") : "Left lobby" }}</span>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script setup lang="ts">
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import type { RankedResult } from "~/utils/resultUtils";

const props = defineProps<{ ranked: RankedResult[] }>();
const player = usePlayerInfo();
const { lobbySettings } = useLobbyState();
const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
const rows = computed(() => {
    const members = lobbySettings.value?.playerList ?? {};
    const scoredPlayers = new Set(props.ranked.map(({ id }) => id));
    return [
        ...props.ranked.map((row) => ({ ...row, member: members[row.id] })),
        ...Object.entries(members)
            .filter(([id, member]) => !scoredPlayers.has(id) && (member.connected || member.ready))
            .map(([id, member]) => ({ id, member, rank: undefined, score: undefined })),
    ];
});
</script>

<style scoped>
.total-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    color: #f1faf2;
    font-size: clamp(0.75rem, 1.32vw, 0.94rem);
    line-height: 1.22;
}
.total-table :is(th, td) {
    border-bottom: 1px solid #a0d8b123;
    padding: clamp(0.38rem, 0.78dvh, 0.73rem) clamp(0.27rem, 0.72vw, 0.62rem);
}
.total-table thead th {
    color: #b8d3c3;
    font: 650 0.7rem / 1.3 var(--gb-font-display);
    text-align: start;
}
.total-table thead .score-col {
    text-align: end;
}
.place-col {
    width: 3.2rem;
}
.score-col {
    width: 5.1rem;
}
.ready-col {
    width: clamp(4.5rem, 12vw, 6rem);
}
.place-number {
    display: inline-grid;
    place-items: center;
    min-width: 1.55em;
    aspect-ratio: 1;
    border-radius: 0.3rem;
    background: #193d30;
    color: #d8ebdc;
    font: 750 0.86em / 1 var(--gb-font-mono);
}
.place-number[data-rank="1"] {
    background: #684c285e;
    color: #ffe6a2;
}
.place-number[data-rank="2"] {
    background: #6d8c984f;
    color: #e0edfa;
}
.place-number[data-rank="3"] {
    background: #955b3c54;
    color: #ffd0a5;
}
.final-player {
    --player-avatar-size: clamp(0.95rem, 3.5vw, 1.62rem);
    display: flex;
    align-items: center;
    gap: 0.38rem;
    min-width: 0;
    text-align: start;
}
.final-name {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 700;
}
.self-label {
    color: #d2fa98;
    font-size: 0.71em;
    font-weight: 630;
}
.final-points {
    color: #efffcc;
    font-style: italic;
    font-weight: 850;
    font-variant-numeric: tabular-nums;
    text-align: end;
}
.final-readiness {
    color: #bed5c8;
    font-size: 0.82em;
}
.final-ready {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    color: #c5f39f;
}
.own-row > :is(th, td) {
    background: #abf47e1b;
}
.own-row > :first-child {
    box-shadow: inset 2px 0 #c5f394;
}
@media (max-width: 540px), (orientation: landscape) and (max-height: 520px) {
    .place-col {
        width: 2.34rem;
    }
    .score-col {
        width: 4.05rem;
    }
    .ready-col {
        width: 3.75rem;
    }
    .total-table :is(th, td) {
        padding-block: 0.32rem;
    }
    .final-player {
        --player-avatar-size: 1.03rem;
    }
}
@media (orientation: landscape) {
    .total-table {
        font-size: clamp(0.72rem, 1.3vw, 0.89rem);
        line-height: 1.16;
    }
    .total-table :is(th, td) {
        padding-block: 0.25rem;
    }
    .total-table thead th {
        position: sticky;
        z-index: 1;
        inset-block-start: 0;
        background: #10382e;
    }
    .final-player {
        --player-avatar-size: clamp(1rem, 2.55vw, 1.24rem);
    }
    .final-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .final-points {
        white-space: nowrap;
    }
}
</style>
