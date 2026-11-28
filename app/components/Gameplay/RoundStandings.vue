<template>
    <section class="round-standings" :class="{ 'compact-standings': compact, 'compact-round': compactRound, 'round-only': roundOnly }" aria-label="Leaderboard">
        <div v-if="!roundOnly" class="standings-header">
            <h2>
                <span class="standings-emblem" aria-hidden="true"><UiIcon name="trophy" /></span><span>Leaderboard</span>
            </h2>
            <div class="score-views" role="group" aria-label="Leaderboard view">
                <button type="button" :aria-pressed="view === 'overall'" :aria-controls="listId" @click="changeView('overall')">Total Points</button>
                <button type="button" :aria-pressed="view === 'round'" :aria-controls="listId" @click="changeView('round')">This Round</button>
            </div>
        </div>
        <div :id="listId" ref="list" class="standings-scroll" role="region" :aria-label="view === 'round' ? 'This round standings' : 'Total points standings'" tabindex="0">
            <template v-if="rows.length">
                <div v-if="compact" class="standings-columns" aria-hidden="true">
                    <span>Rank</span>
                    <span>Player</span>
                    <span class="standing-distance">Distance</span>
                    <span class="standing-points">{{ view === "overall" ? "Total" : "Round pts" }}</span>
                </div>
                <ol class="standings-list" role="list">
                    <li
                        v-for="row in rows"
                        :key="row.id"
                        class="standing"
                        :class="{ 'is-own': row.id === player.ID, 'is-expanded': compactRound && selectedId === row.id }"
                        :data-rank="row.rank"
                    >
                        <span class="standing-rank" :data-rank="row.rank"><span class="sr-only">Rank </span>{{ row.rank }}</span>
                        <span class="standing-player">
                            <PlayerAvatar :color="getPlayerColorByID(row.id)" />
                            <span class="standing-identity">
                                <span class="standing-name" :title="row.name">{{ row.name }}</span>
                                <small v-if="row.id === player.ID">You</small>
                                <small v-else-if="row.presence" class="offline-label">{{ row.presence }}</small>
                            </span>
                        </span>
                        <span v-if="compact" class="standing-distance"><span class="sr-only">Best distance </span>{{ row.distance }}</span>
                        <button
                            v-if="compactRound && row.modifiers"
                            class="round-score-trigger"
                            type="button"
                            :aria-expanded="selectedId === row.id"
                            :aria-label="`Round score details for ${row.name} with ${row.score} points`"
                            :aria-describedby="row.modifiers.hasDuels || row.modifiers.doubleUsed || row.result?.placeScr ? listId + '-effects-' + row.id : undefined"
                            @click="selectedId = selectedId === row.id ? null : row.id"
                        >
                            <span :id="listId + '-effects-' + row.id" class="round-badges">
                                <span v-if="row.result?.placeScr" class="round-badge gain"
                                    ><UiIcon name="trophy" /><span class="sr-only">Placement {{ row.result.placeScr }}</span></span
                                >
                                <span v-if="row.modifiers.doubleUsed" class="round-badge gain">Double<span class="sr-only"> Score</span></span>
                                <span v-if="row.modifiers.hasDuels" class="round-badge" :class="{ gain: row.modifiers.duelPoints > 0, loss: row.modifiers.duelPoints < 0 }">
                                    <template v-if="row.modifiers.duels.length > 1">
                                        <span>{{ row.modifiers.duels.length }} duels</span> <span>{{ row.modifiers.duelPoints }} net</span>
                                    </template>
                                    <template v-else><UiIcon name="target" /><span class="sr-only">Duel </span>{{ row.modifiers.duelPoints }}</template>
                                </span>
                            </span>
                            <span class="standing-points">{{ row.score }}</span
                            ><UiIcon class="details-chevron" :class="{ 'is-open': selectedId === row.id }" name="chevron-up" />
                        </button>
                        <span v-else class="standing-points">
                            <span class="sr-only">{{ view === "overall" ? "Total points " : "Round points " }}</span
                            >{{ row.score }}
                        </span>
                        <GameplayRoundScoreBreakdown
                            v-if="row.result && row.modifiers && (!compact || (compactRound && selectedId === row.id))"
                            class="standing-breakdown"
                            :class="{ 'compact-breakdown': compact }"
                            :player-id="row.id"
                            :result="row.result"
                            :modifiers="row.modifiers"
                            :detailed="compact"
                        />
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
import type { PowerupEffect } from "~/types/powerups";
import { formatGuessDistance, hasGuess, rankRoundResults, type RankedResult, type StandingsView } from "~/utils/resultUtils";
import { roundPowerupEffects, roundScoreModifiers } from "~/utils/roundPowerups";

const props = defineProps<{ overall: RankedResult[]; round: Results; guesses: Results; compact: boolean; roundOnly?: boolean }>();
const player = usePlayerInfo();
const { lobbySettings } = useLobbyState();
const { getPlayerNameFromID, getPlayerColorByID } = usePlayerLookup();
const listId = useId();
const list = useTemplateRef("list");
const view = defineModel<StandingsView>("view", { required: true });
const compactRound = computed(() => props.compact && view.value === "round");
const selectedId = ref<string | null>(null);
const scrollPositions = { overall: 0, round: 0 };
const roundRanks = computed(() => rankRoundResults(props.round));
const effectsByPlayer = computed(() => {
    const snapshot = lobbySettings.value;
    const byPlayer = new Map<string, PowerupEffect[]>();
    for (const effect of roundPowerupEffects(snapshot, snapshot?.currentRound ?? 0, "APPLIED")) {
        for (const id of effect.target ? [effect.source, effect.target] : [effect.source]) {
            const existing = byPlayer.get(id);
            if (existing) existing.push(effect);
            else byPlayer.set(id, [effect]);
        }
    }
    return byPlayer;
});
const rows = computed(() =>
    (view.value === "overall" ? props.overall : roundRanks.value).map((row) => {
        const snapshot = lobbySettings.value;
        const member = snapshot?.playerList[row.id];
        const result = props.round[row.id];
        const best = props.guesses[row.id];
        const guess = best && hasGuess(best) ? best : result;
        return {
            ...row,
            result,
            modifiers: view.value === "round" && result ? roundScoreModifiers(row.id, result, effectsByPlayer.value.get(row.id)) : undefined,
            name: getPlayerNameFromID(row.id),
            presence: !member ? (snapshot ? "Left lobby" : undefined) : member.connected ? undefined : member.away ? "Away" : "Offline",
            distance: guess && hasGuess(guess) ? formatGuessDistance(guess) : result ? "No guess" : "—",
        };
    })
);
watch([compactRound, () => lobbySettings.value?.gameId, () => lobbySettings.value?.currentRound], () => (selectedId.value = null));
const changeView = async (next: StandingsView) => {
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
.round-only {
    grid-template-rows: minmax(0, 1fr);
}
.standing-breakdown {
    grid-column: 2 / -1;
    align-self: start;
    margin-block: -0.15rem 0.25rem;
}
.standing:has(.standing-breakdown) {
    row-gap: 0.32rem;
    padding-block-start: 0.4rem;
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
.standings-header h2 .standings-emblem {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: 1.55em;
    block-size: 1.55em;
    border: 1px solid #ffca6242;
    border-radius: 50%;
    background: #ffca621a;
    color: #ffe28f;
}
.standings-header h2 .ui-icon {
    inline-size: 0.92em;
    block-size: 0.92em;
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
.standing-distance {
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
    --standing-columns: max-content minmax(0, 1fr) max-content max-content;
    --standing-gap: clamp(0.24rem, 0.8vw, 0.5rem);
    --standing-pad: clamp(0.28rem, 1vw, 0.52rem);
    --list-pad: 0.24rem;
    container-type: inline-size;
    border-color: #90cfa376;
    border-radius: 0.9rem;
    background: linear-gradient(156deg, #114035, #072e26 55%, #062a22);
    box-shadow: inset 0 1px #d9ffce1f;
}
.compact-standings .standings-header {
    gap: 0.45rem;
    padding: 0.34rem 0.52rem;
    background: url("/images/atlas-relief.svg") right center / 28rem auto no-repeat;
}
.compact-standings .standings-header h2 {
    min-width: 0;
    gap: 0.42rem;
    font: italic 850 clamp(0.84rem, 3.6cqi, 1.06rem) / 1.1 var(--gb-font-display);
    letter-spacing: -0.025em;
}
.compact-standings .standings-header h2 > span:not(.standings-emblem) {
    overflow: hidden;
    text-overflow: ellipsis;
}
.compact-standings .score-views {
    flex: none;
    align-items: center;
    gap: 2px;
    padding: 2px;
    border: 1px solid #9be0a54a;
    border-radius: 999px;
    background: #05201ae6;
    box-shadow: inset 0 1px 3px #00140f80;
}
.compact-standings .score-views button {
    min-height: 30px;
    padding: 0.18rem clamp(0.5rem, 1.8vw, 0.78rem);
    border-radius: 999px;
    color: #bad8c9;
    font-size: clamp(0.66rem, 2.7cqi, 0.76rem);
    font-weight: 760;
    line-height: 1.1;
    transition:
        background-color 140ms ease,
        color 140ms ease,
        box-shadow 140ms ease;
}
.compact-standings .score-views button:hover:not([aria-pressed="true"]) {
    background: #ffffff12;
    color: #edf9f1;
}
.compact-standings .score-views [aria-pressed="true"] {
    background: linear-gradient(145deg, #ddffa6, #9be95f 78%);
    box-shadow:
        inset 0 1px #f8ffe6b8,
        0 2px 8px #7fe6553b;
    color: var(--gb-scenic-action-ink);
}
.standings-columns {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    padding: 0.24rem calc(var(--list-pad) + var(--standing-pad) + 1px);
    border-bottom: 1px solid #b7e6b62b;
    background: #123c33;
    color: #c2ded1;
    font-size: clamp(0.57rem, 1.65vw, 0.68rem);
    font-weight: 720;
    line-height: 1.16;
}
.standings-columns .standing-points {
    color: inherit;
    font: inherit;
}
.compact-standings .standings-scroll {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content max-content;
    align-content: start;
    column-gap: clamp(0.28rem, 1vw, 0.5rem);
    padding-inline: 0.28rem;
}
.compact-standings :is(.standings-columns, .standings-list, .standing) {
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    column-gap: inherit;
}
.compact-standings .standings-columns {
    margin-inline: -0.28rem;
    padding: 0.24rem calc(0.28rem + var(--standing-pad));
}
.compact-standings .standings-list {
    gap: 0.16rem;
    padding: 0.22rem 0;
}
.compact-standings .standing {
    --player-avatar-size: clamp(1rem, 2.8vw, 1.32rem);
    min-height: clamp(1.72rem, 3.4dvh, 2.15rem);
    padding: 0.12rem var(--standing-pad);
    border-color: #a9e0b02c;
    border-radius: 0.48rem;
    background: #082921;
    font-size: clamp(0.71rem, 2.75cqi, 0.85rem);
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
    font-weight: 740;
}
.standing .standing-distance {
    color: #d2e8dc;
    font: 650 clamp(0.65rem, 2.55cqi, 0.78rem) / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
/* Size each numeric column once across the list. Long player names take the remaining space. */
.compact-round .standing {
    position: relative;
    min-height: 2.05rem;
    font-size: clamp(0.7rem, 2.7cqi, 0.82rem);
}
.compact-round .standing-player,
.compact-round .standing-identity {
    gap: 0.22rem;
}
.compact-round .standing-distance {
    font-size: clamp(0.64rem, 2.45cqi, 0.76rem);
}
.round-score-trigger,
.round-badges,
.round-badge {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
}
.round-score-trigger {
    justify-content: flex-end;
    gap: 0.32rem;
    text-align: end;
}
.round-score-trigger::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
}
.compact-round .standing:focus-within {
    outline: 2px solid var(--gb-accent);
    outline-offset: -2px;
}
.round-score-trigger:focus-visible {
    outline: none;
}
.round-badges {
    gap: 0.18rem;
}
.round-badges:empty {
    display: none;
}
.round-badge {
    gap: 0.16rem;
    padding: 0.12rem 0.24rem;
    border-radius: 0.25rem;
    background: #a1c3ba1d;
    color: #d2e2dc;
    font: 700 clamp(0.65rem, 2.8cqi, 0.75rem) / 1.15 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
.round-badge.gain {
    background: #9ce8a21c;
    color: #c2f5ab;
}
.round-badge.loss {
    background: #f49a8a22;
    color: #ffbbab;
}
.round-badge .ui-icon {
    width: 0.95em;
    height: 0.95em;
}
.details-chevron {
    width: 0.68rem;
    height: 0.68rem;
    transform: rotate(90deg);
    color: #bad5c4;
    transition: transform 160ms ease;
}
.details-chevron.is-open {
    transform: rotate(180deg);
    color: var(--recap-accent);
}
.compact-round .standing.is-expanded {
    border-color: #b6efa370;
    padding-block: 0.24rem 0.34rem;
}
.compact-breakdown {
    grid-column: 1 / -1;
    margin-block: 0.22rem 0.04rem;
    font-size: 0.74rem;
}
.compact-breakdown :deep(.score-parts),
.compact-breakdown :deep(.duel-group ul) {
    border-radius: 0.55rem;
    background: #051d18cc;
}
.compact-breakdown :deep(.score-parts > div),
.compact-breakdown :deep(.duel-group li) {
    padding: 0.28rem 0.52rem;
}
.compact-breakdown :deep(.score-total) {
    display: none;
}
.compact-breakdown :deep(.duel-group h3) {
    font-size: 0.7rem;
    margin-bottom: 0.2rem;
}
@container (max-width: 325px) {
    .compact-round .standing-player :deep(.player-avatar) {
        display: none;
    }
}
@container (max-width: 355px) {
    .compact-standings .score-views button {
        padding-inline: 0.36rem;
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
