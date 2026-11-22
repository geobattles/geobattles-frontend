<template>
    <section class="round-standings" :class="{ 'compact-standings': compact, 'with-round-points': showRoundPoints }" aria-label="Leaderboard">
        <div class="standings-header">
            <h2><UiIcon name="trophy" /><span>Leaderboard</span></h2>
            <div class="score-views" role="group" aria-label="Leaderboard view">
                <button type="button" :aria-pressed="view === 'overall'" :aria-controls="listId" @click="changeView('overall')">Total Points</button>
                <button type="button" :aria-pressed="view === 'round'" :aria-controls="listId" @click="changeView('round')">This Round</button>
            </div>
        </div>
        <div :id="listId" ref="list" class="standings-scroll" role="region" :aria-label="view === 'round' ? 'This round standings' : 'Total points standings'" tabindex="0">
            <template v-if="rows.length">
                <div v-if="compact" class="standings-columns" aria-hidden="true">
                    <span>#</span>
                    <span>Player</span>
                    <span v-if="!showRoundPoints" class="standing-distance">Distance</span>
                    <span class="standing-points">{{ view === "overall" ? "Total" : "Points" }}</span>
                    <span v-if="showRoundPoints" class="standing-round-points">Round</span>
                </div>
                <ol class="standings-list" role="list">
                    <li v-for="row in rows" :key="row.id" class="standing" :class="{ 'is-own': row.id === player.ID }" :data-rank="row.rank">
                        <span class="standing-rank" :data-rank="row.rank"><span class="sr-only">Rank </span>{{ row.rank }}</span>
                        <span class="standing-player">
                            <PlayerAvatar :color="getPlayerColorByID(row.id)" />
                            <span class="standing-identity">
                                <span class="standing-name" :title="row.name">{{ row.name }}</span>
                                <small v-if="row.id === player.ID">You</small>
                                <small v-else-if="lobbySettings?.playerList[row.id]?.connected === false" class="offline-label" title="Disconnected">Offline</small>
                            </span>
                        </span>
                        <span v-if="compact && !showRoundPoints" class="standing-distance"><span class="sr-only">Best distance </span>{{ row.distance }}</span>
                        <span class="standing-points">
                            <span class="sr-only">{{ view === "overall" ? "Total points " : "Round points " }}</span
                            >{{ row.score.toLocaleString() }}
                        </span>
                        <span v-if="showRoundPoints" class="standing-round-points"><span class="sr-only">Round points </span>{{ row.roundPoints }}</span>
                    </li>
                </ol>
            </template>
            <p v-else class="standings-empty" role="status">Waiting for scores…</p>
        </div>
    </section>
</template>

<script setup lang="ts">
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import type { Results } from "~/types/appTypes";
import { formatGuessDistance, hasGuess, rankRoundResults, roundResultPoints, type RankedResult } from "~/utils/resultUtils";

const props = defineProps<{ overall: RankedResult[]; round: Results; guesses: Results; compact: boolean; landscape: boolean }>();
const player = usePlayerInfo();
const { lobbySettings } = useLobbyState();
const { getPlayerNameFromID, getPlayerColorByID } = usePlayerLookup();
const listId = useId();
const list = useTemplateRef("list");
const view = ref<"overall" | "round">("overall");
const scrollPositions = { overall: 0, round: 0 };
const showRoundPoints = computed(() => props.landscape && view.value === "overall");
const roundRanks = computed(() => rankRoundResults(props.round));
const rows = computed(() =>
    (view.value === "overall" ? props.overall : roundRanks.value).map((row) => {
        const result = props.round[row.id];
        const best = props.guesses[row.id];
        const guess = best && hasGuess(best) ? best : result;
        return {
            ...row,
            name: getPlayerNameFromID(row.id),
            distance: guess && hasGuess(guess) ? formatGuessDistance(guess) : result ? "No guess" : "—",
            roundPoints: result ? roundResultPoints(result).toLocaleString() : "—",
        };
    })
);
const changeView = async (next: typeof view.value) => {
    if (next === view.value) return;
    scrollPositions[view.value] = list.value?.scrollTop ?? 0;
    view.value = next;
    await nextTick();
    if (next === view.value) list.value?.scrollTo(0, scrollPositions[next]);
};
</script>

<style scoped>
.round-standings {
    --standing-columns: 1.65rem minmax(0, 1fr) auto;
    --standing-gap: clamp(0.33rem, 1.2vw, 0.75rem);
    --standing-pad: clamp(0.25rem, 1.1vw, 0.8rem);
    --list-pad: clamp(0.25rem, 0.7vw, 0.56rem);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-width: 0;
    min-height: 0;
    border: 1px solid #95cda63e;
    border-radius: 0.83rem;
    background: #072e25ed;
}
.standings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    gap: 0.24rem;
    padding-inline: clamp(0.33rem, 1.15vw, 0.8rem);
    border-bottom: 1px solid #addbae2b;
}
.standings-header h2 {
    display: flex;
    align-items: center;
    gap: 0.34em;
    font-size: clamp(0.67rem, 2.2vw, 1rem);
    font-weight: 800;
    white-space: nowrap;
}
.standings-header h2 .ui-icon {
    color: #e4ee94;
}
.score-views {
    display: flex;
    justify-content: end;
    min-width: 0;
}
.score-views button {
    position: relative;
    min-height: 44px;
    padding: 0.25rem clamp(0.29rem, 1vw, 0.75rem);
    color: var(--recap-muted);
    font-size: clamp(0.66rem, 1.86vw, 0.82rem);
    font-weight: 680;
    white-space: nowrap;
}
.score-views [aria-pressed="true"] {
    color: var(--recap-accent);
    box-shadow: inset 0 -2px var(--recap-accent);
}
.score-views button:focus-visible,
.standings-scroll:focus-visible {
    outline-offset: -2px;
}
.standings-scroll {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
}
.standings-list {
    display: grid;
    gap: clamp(0.22rem, 0.65dvh, 0.42rem);
    margin: 0;
    padding: var(--list-pad);
    list-style: none;
}
.standing,
.standings-columns {
    display: grid;
    grid-template-columns: var(--standing-columns);
    align-items: center;
    gap: var(--standing-gap);
}
.standing {
    --player-avatar-size: clamp(1.15rem, 3.3vw, 1.85rem);
    min-height: clamp(1.67rem, 4.4dvh, 2.7rem);
    padding: 0.16rem var(--standing-pad);
    border: 1px solid #b1e3b217;
    border-radius: 0.5rem;
    background: #09271f;
    font-size: clamp(0.74rem, 2.3vw, 1rem);
}
.standing.is-own {
    border-color: #bcf58a7a;
    background: linear-gradient(95deg, #305435, #152f25);
}
.standing-rank {
    display: inline-grid;
    place-items: center;
    min-width: 1.55em;
    border-radius: 0.32rem;
    color: #c6dac9;
    font: 770 0.9em / 1.55 var(--gb-font-mono);
}
.standing-rank[data-rank="1"] {
    color: #ffe395;
    background: #b2781d45;
}
.standing-rank[data-rank="2"] {
    color: #e1edef;
    background: #7c8f9749;
}
.standing-rank[data-rank="3"] {
    color: #ffcda8;
    background: #b5683b4d;
}
.standing-player,
.standing-identity {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
}
.standing-player {
    gap: var(--standing-gap);
}
.standing-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.standing-identity small {
    color: var(--recap-accent);
    font-size: 0.72em;
}
.standing-identity .offline-label {
    color: var(--recap-muted);
}
.standing-points {
    color: #ecffc6;
    font: italic 800 1em / 1.2 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
.standing-points,
.standing-distance,
.standing-round-points {
    text-align: end;
    white-space: nowrap;
}
.standings-columns > :first-child {
    text-align: center;
}
.standings-empty {
    padding: 0.55rem 0.8rem;
    color: var(--recap-muted);
    font-size: 0.84rem;
}
.compact-standings {
    --standing-columns: 1.55rem minmax(0, 1fr) max(5.65rem, 24%) max(3.4rem, 17%);
    --standing-gap: clamp(0.28rem, 0.95vw, 0.62rem);
    --standing-pad: clamp(0.32rem, 1.25vw, 0.74rem);
    --list-pad: 0.3rem;
    container-type: inline-size;
    border-color: #90cfa376;
    border-radius: 0.9rem;
    background: linear-gradient(156deg, #114035, #072e26 55%, #062a22);
    box-shadow: inset 0 1px #d9ffce1f;
}
.with-round-points {
    --standing-columns: 1.55rem minmax(0, 1fr) max(3.3rem, 20%) max(2.75rem, 16%);
}
.compact-standings .standings-header {
    gap: 0.3rem;
    padding-inline: clamp(0.37rem, 1.15vw, 0.75rem);
    background: url("/images/atlas-relief.svg") right center / 30rem auto no-repeat;
}
.compact-standings .standings-header h2 {
    min-width: 0;
    font: italic 850 clamp(0.9rem, 4.55cqi, 1.38rem) / 1.08 var(--gb-font-display);
    letter-spacing: -0.03em;
}
.compact-standings .standings-header h2 .ui-icon {
    flex: none;
}
.compact-standings .standings-header h2 > span {
    overflow: hidden;
    text-overflow: ellipsis;
}
.compact-standings .score-views {
    flex: none;
    align-items: center;
    padding: 1px;
    border: 1px solid #a1df9e53;
    border-radius: 999px;
    background: #092c24;
}
.compact-standings .score-views button {
    padding-inline: clamp(0.36rem, 1.4vw, 0.72rem);
    border-radius: 999px;
    font-size: clamp(0.72rem, 3.35cqi, 0.82rem);
}
.compact-standings .score-views [aria-pressed="true"] {
    background: linear-gradient(135deg, #e6ffc0, #bbef86);
    box-shadow: inset 0 1px #f6ffe1;
    color: var(--gb-scenic-action-ink);
}
.standings-columns {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    padding: 0.32rem calc(var(--list-pad) + var(--standing-pad) + 1px);
    border-bottom: 1px solid #b7e6b62b;
    background: #123c33;
    color: #c2ded1;
    font-size: clamp(0.59rem, 1.78vw, 0.73rem);
    font-weight: 720;
    line-height: 1.16;
}
.standings-columns .standing-points {
    color: inherit;
    font: inherit;
}
.compact-standings .standings-list {
    gap: 0.22rem;
}
.compact-standings .standing {
    --player-avatar-size: clamp(1.22rem, 3.3vw, 1.66rem);
    min-height: clamp(1.98rem, 4.25dvh, 2.7rem);
    border-color: #a9e0b02c;
    border-radius: 0.56rem;
    background: #082921;
    font-size: clamp(0.79rem, 2.2vw, 1.01rem);
}
.compact-standings .standing[data-rank="1"]:not(.is-own) {
    border-color: #ecc16e72;
    background: linear-gradient(95deg, #4a482d, #193027 84%);
    color: #fff6d4;
}
.compact-standings .standing.is-own {
    border-color: #c8f889a1;
    background: linear-gradient(95deg, #315d39, #193c2d 82%);
}
.compact-standings .standing-name {
    font-weight: 760;
}
.standing .standing-distance,
.standing .standing-round-points {
    color: #d2e8dc;
    font: 650 clamp(0.69rem, 3.6cqi, 0.91rem) / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
@container (max-width: 355px) {
    .compact-standings .standings-header h2 .ui-icon {
        @apply sr-only;
    }
    .compact-standings .score-views button {
        padding-inline: 0.3rem;
    }
}
@container (max-width: 320px) {
    .compact-standings .standing-identity .offline-label {
        @apply sr-only;
    }
}
@media (orientation: landscape) and (max-height: 340px) {
    .compact-standings {
        --list-pad: 0.22rem;
    }
    .compact-standings .standing {
        --player-avatar-size: 1.1rem;
        min-height: 1.72rem;
        font-size: 0.8rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .compact-standings .score-views button {
        transition:
            background-color 140ms ease,
            color 140ms ease;
    }
}
</style>
