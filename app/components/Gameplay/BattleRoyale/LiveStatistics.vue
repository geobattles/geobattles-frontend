<template>
    <div class="live-statistics table-scroll" :class="{ 'is-compact': compact, 'is-hud': playerHooks, 'is-peek': peek }">
        <table class="data-table live-table">
            <caption class="sr-only">
                This round’s live results
            </caption>
            <thead v-if="!peek">
                <tr>
                    <th scope="col">{{ playerHooks || compact ? "Player" : "Explorer" }}</th>
                    <th scope="col" class="numeric">Left</th>
                    <th scope="col" class="numeric" :aria-label="compact ? 'Best distance' : undefined">{{ compact ? "Best" : "Distance" }}</th>
                    <th scope="col" class="numeric">{{ compact ? "Pts" : "Base pts" }}</th>
                </tr>
            </thead>
            <TransitionGroup tag="tbody" :move-class="effects.size ? 'live-rank-move' : 'live-rank-still'">
                <tr
                    v-for="row in topRows"
                    :key="row.id"
                    :id="playerHooks ? `live-player-${row.id}` : undefined"
                    :data-testid="activeHooks ? 'player-row' : undefined"
                    :data-player-name="lobby.lobbySettings?.playerList[row.id]?.name"
                    :data-connected="String(lobby.lobbySettings?.playerList[row.id]?.connected === true)"
                    :data-ready="String(lobby.lobbySettings?.playerList[row.id]?.ready === true)"
                    :data-host="String(lobby.lobbySettings?.admin === row.id)"
                    :data-guess-effect="effects.get(row.id)?.kind"
                    :class="{ 'is-attacking-you': powerupIndicators.get(row.id)?.targets.includes(player.ID ?? ''), 'is-you': playerHooks && row.id === player.ID }"
                >
                    <td>
                        <span class="player-identity">
                            <span v-if="compact && playerHooks" class="live-rank-num" :data-rank="row.rank ?? undefined">{{ row.rank ? `#${row.rank}` : "–" }}</span>
                            <PlayerAvatar :color="getPlayerColorByID(row.id)" />
                            <span class="live-player-name" :title="getPlayerNameFromID(row.id)">{{ getPlayerNameFromID(row.id) }}</span>
                            <span v-if="playerHooks && row.id === player.ID" :class="compact ? 'sr-only' : 'your-row'">You</span>
                            <small v-if="lobby.lobbySettings?.playerList[row.id]?.connected === false" class="player-connection">{{
                                lobby.lobbySettings.playerList[row.id]?.away ? "Away" : "Offline"
                            }}</small>
                            <GameplayPlayerPowerupIndicators :indicator="powerupIndicators.get(row.id)" :player-id="row.id" />
                            <span v-if="effects.get(row.id)?.kind === 'lead'" :key="`lead-${effects.get(row.id)?.attempt}`" class="rank-cue rank-cue-lead" title="Takes the lead">
                                <UiIcon name="crown" /><span>Lead</span>
                            </span>
                            <span v-else-if="effects.get(row.id)?.kind === 'climb'" :key="`climb-${effects.get(row.id)?.attempt}`" class="rank-cue rank-cue-climb" title="Moved up">
                                ↑{{ effects.get(row.id)?.passed }}
                            </span>
                        </span>
                    </td>
                    <td class="numeric" :title="`${row.result.lives} guesses remaining`">
                        <span class="live-attempt"
                            ><span v-if="effects.has(row.id)" :key="effects.get(row.id)?.attempt" class="guess-pin" title="Guess placed"><UiIcon name="pin" /></span
                            >{{ row.result.lives }}</span
                        >
                    </td>
                    <td class="numeric live-distance">
                        <span class="distance-reading">{{ formatGuessDistance(row.result) }}</span>
                    </td>
                    <td class="numeric live-points">{{ row.result.baseScr || 0 }}</td>
                </tr>
                <tr v-if="hiddenBetween > 0" key="__gap-between__" class="peek-gap-row">
                    <td colspan="4">
                        <span class="peek-gap-pill">··· {{ hiddenBetween }} {{ hiddenBetween === 1 ? "player" : "players" }} in between ···</span>
                    </td>
                </tr>
                <tr
                    v-if="pinnedOwnRow"
                    :key="pinnedOwnRow.id"
                    :id="playerHooks ? `live-player-${pinnedOwnRow.id}` : undefined"
                    :data-testid="activeHooks ? 'player-row' : undefined"
                    :data-player-name="lobby.lobbySettings?.playerList[pinnedOwnRow.id]?.name"
                    :data-connected="String(lobby.lobbySettings?.playerList[pinnedOwnRow.id]?.connected === true)"
                    :data-ready="String(lobby.lobbySettings?.playerList[pinnedOwnRow.id]?.ready === true)"
                    :data-host="String(lobby.lobbySettings?.admin === pinnedOwnRow.id)"
                    :data-guess-effect="effects.get(pinnedOwnRow.id)?.kind"
                    :class="{
                        'is-attacking-you': powerupIndicators.get(pinnedOwnRow.id)?.targets.includes(player.ID ?? ''),
                        'is-you': true,
                    }"
                >
                    <td>
                        <span class="player-identity">
                            <span v-if="compact && playerHooks" class="live-rank-num" :data-rank="pinnedOwnRow.rank ?? undefined">{{
                                pinnedOwnRow.rank ? `#${pinnedOwnRow.rank}` : "–"
                            }}</span>
                            <PlayerAvatar :color="getPlayerColorByID(pinnedOwnRow.id)" />
                            <span class="live-player-name" :title="getPlayerNameFromID(pinnedOwnRow.id)">{{ getPlayerNameFromID(pinnedOwnRow.id) }}</span>
                            <span class="sr-only">You</span>
                            <GameplayPlayerPowerupIndicators :indicator="powerupIndicators.get(pinnedOwnRow.id)" :player-id="pinnedOwnRow.id" />
                        </span>
                    </td>
                    <td class="numeric" :title="`${pinnedOwnRow.result.lives} guesses remaining`">
                        <span class="live-attempt"
                            ><span v-if="effects.has(pinnedOwnRow.id)" :key="effects.get(pinnedOwnRow.id)?.attempt" class="guess-pin" title="Guess placed"
                                ><UiIcon name="pin" /></span
                            >{{ pinnedOwnRow.result.lives }}</span
                        >
                    </td>
                    <td class="numeric live-distance">
                        <span class="distance-reading">{{ formatGuessDistance(pinnedOwnRow.result) }}</span>
                    </td>
                    <td class="numeric live-points">{{ pinnedOwnRow.result.baseScr || 0 }}</td>
                </tr>
                <tr v-if="hiddenBelow > 0" key="__gap-below__" class="peek-gap-row">
                    <td colspan="4">
                        <span class="peek-gap-pill">+{{ hiddenBelow }} more · tap to view all</span>
                    </td>
                </tr>
            </TransitionGroup>
        </table>
        <p v-if="!entries.length" class="field-help p-3">Waiting for the round to begin.</p>
        <p v-if="playerHooks" class="sr-only" role="status">{{ announcement }}</p>
    </div>
</template>
<script setup lang="ts">
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import { guessDistance, hasGuess, type LiveGuessFeedback } from "~/utils/resultUtils";

const props = defineProps<{ playerHooks?: boolean; compact?: boolean; peek?: boolean }>();
const game = useGameMode();
const activeHooks = computed(() => props.playerHooks && ["PLAYING", "STARTING"].includes(game.modeLogic.currentState));
const results = useResultsStore();
const player = usePlayerInfo();
const lobby = useLobbyStore();
const powerupIndicators = useLivePowerupIndicators();
const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
const entries = computed(() => Object.entries(results.liveResults).filter(([id]) => !!lobby.lobbySettings?.playerList[id]));
const rankedEntries = computed(() => {
    const list = entries.value;
    return list.map(([id, result]) => {
        if (!hasGuess(result)) return { id, result, rank: null as number | null };
        const dist = guessDistance(result);
        const rank = 1 + list.filter(([, other]) => hasGuess(other) && guessDistance(other) < dist).length;
        return { id, result, rank };
    });
});
const peekLimit = 5;
const peekLayout = computed(() => {
    const all = rankedEntries.value;
    if (!props.peek || all.length <= peekLimit) {
        return { top: all, pinnedOwn: null as (typeof all)[number] | null, hiddenBetween: 0, hiddenBelow: 0 };
    }
    const ownId = player.value.ID;
    const ownIndex = ownId ? all.findIndex((row) => row.id === ownId) : -1;
    if (ownIndex < 0 || ownIndex < peekLimit) {
        return { top: all.slice(0, peekLimit), pinnedOwn: null, hiddenBetween: 0, hiddenBelow: all.length - peekLimit };
    }
    return {
        top: all.slice(0, peekLimit - 1),
        pinnedOwn: all[ownIndex]!,
        hiddenBetween: ownIndex - (peekLimit - 1),
        hiddenBelow: all.length - 1 - ownIndex,
    };
});
const topRows = computed(() => peekLayout.value.top);
const pinnedOwnRow = computed(() => peekLayout.value.pinnedOwn);
const hiddenBetween = computed(() => peekLayout.value.hiddenBetween);
const hiddenBelow = computed(() => peekLayout.value.hiddenBelow);
const effects = reactive(new Map<string, LiveGuessFeedback>());
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const announcement = ref("");

if (props.playerHooks) {
    const ui = useUIManagerStore();
    const socket = useWebSocketStore();
    const clearFeedback = () => {
        timers.forEach(clearTimeout);
        timers.clear();
        effects.clear();
        announcement.value = "";
    };
    const onGuess = (event: CustomEvent<LiveGuessFeedback>) => {
        if (game.modeLogic.currentState !== "PLAYING") return;
        const cue = event.detail;
        if (cue.kind === "lead") {
            for (const [id, earlier] of effects) {
                if (earlier.kind === "lead") effects.set(id, { ...earlier, kind: "guess" });
            }
        }
        effects.set(cue.playerId, cue);
        clearTimeout(timers.get(cue.playerId));
        const summary = cue.kind === "lead" ? " and took the lead" : cue.kind === "climb" ? ` and moved up ${cue.passed} ${cue.passed === 1 ? "place" : "places"}` : "";
        announcement.value = cue.playerId === player.value.ID ? "" : `${getPlayerNameFromID(cue.playerId)} placed guess ${cue.attempt}${summary}.`;
        timers.set(
            cue.playerId,
            setTimeout(
                () => {
                    effects.delete(cue.playerId);
                    timers.delete(cue.playerId);
                },
                cue.kind === "lead" ? 2200 : 1600
            )
        );
    };
    watch([() => lobby.lobbySettings?.ID, () => game.modeLogic.currentRound, () => game.modeLogic.currentState, () => socket.isConnected], clearFeedback, { flush: "sync" });
    onMounted(() => ui.on("liveGuess", onGuess));
    onBeforeUnmount(() => {
        ui.off("liveGuess", onGuess);
        clearFeedback();
    });
}
</script>
<style scoped>
.live-matchup {
    display: block;
    color: #ffd1c9;
    font-size: 0.72em;
    line-height: 1.3;
    overflow-wrap: anywhere;
}
.live-statistics {
    --score-surface: #101f19;
    --score-heading: #1c3229;
    --score-rule: #8db39a29;
    background: var(--score-surface);
}
.live-table {
    table-layout: fixed;
    color: var(--gb-text);
    font-size: 0.84rem;
    line-height: 1.4;
}
.live-table :is(th, td) {
    box-sizing: border-box;
    padding: 0.48rem 0.55rem;
    border-bottom-color: var(--score-rule);
}
.live-table th {
    background: var(--score-heading);
    color: #b4cabb;
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
    background: var(--gb-surface);
}
.live-table td:nth-child(2) {
    color: var(--gb-muted);
}
.live-table .live-distance {
    color: var(--gb-success);
    font-weight: 700;
    background: #70d9af08;
}
.distance-reading {
    padding-inline: 0.35em;
    border-radius: 2px;
    background: #70d9af10;
}
.live-points {
    color: var(--gb-text);
    font-weight: 600;
}
.player-identity {
    --player-avatar-size: 12px;
    min-width: 0;
    gap: 0.275rem;
    font-weight: 600;
}
.live-player-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.live-attempt {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
}
.guess-pin {
    color: #c3d8c7;
    display: inline-flex;
}
.guess-pin :deep(svg) {
    width: 0.82rem;
    height: 0.82rem;
}
.rank-cue {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 0.15em;
    padding: 0.05em 0.32em;
    border: 1px solid currentColor;
    border-radius: 4px;
    font: 700 0.72em / 1.45 var(--gb-font-mono);
}
.rank-cue-lead {
    color: #ffdc91;
}
.rank-cue-climb {
    color: var(--gb-success);
}
.live-table tr[data-guess-effect] {
    --guess-tint: #c3d8c7;
}
.live-table tr[data-guess-effect="climb"] {
    --guess-tint: var(--gb-accent);
}
.live-table tr[data-guess-effect="lead"] {
    --guess-tint: #ffdc91;
}
.live-table tr[data-guess-effect] > td {
    background: color-mix(in srgb, var(--guess-tint) 8%, var(--gb-surface));
}
.live-table tr[data-guess-effect] > td:first-child {
    box-shadow: inset 2px 0 var(--guess-tint);
}
.live-table tr.is-attacking-you > td {
    background: #ff7e6b24;
    box-shadow: none;
    animation: none;
}
.live-table tr.is-attacking-you > td:first-child {
    box-shadow: inset 2.5px 0 #ff9989;
}
.live-table tr.is-attacking-you > td:last-child {
    box-shadow: none;
}
@media (prefers-reduced-motion: no-preference) {
    .live-rank-move {
        transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .guess-pin {
        animation: guess-land 260ms cubic-bezier(0.2, 0.75, 0.3, 1) both;
    }
    .rank-cue-climb {
        animation: rank-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .rank-cue-lead {
        animation: lead-land 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .live-table tr[data-guess-effect="lead"]:not(.is-attacking-you) > td {
        animation: lead-wash 1.25s ease-out;
    }
}
@keyframes guess-land {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
}
@keyframes rank-rise {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
}
@keyframes lead-land {
    0% {
        opacity: 0;
        transform: scale(0.72);
    }
    55% {
        opacity: 1;
        transform: scale(1.08);
    }
    100% {
        transform: scale(1);
    }
}
@keyframes lead-wash {
    from {
        background-color: color-mix(in srgb, var(--guess-tint) 24%, var(--gb-surface));
    }
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
    width: 36px;
}
.is-compact .live-table :is(th, td):nth-child(3) {
    width: 80px;
}
.is-compact .live-table :is(th, td):nth-child(4) {
    width: 48px;
}
.is-compact .distance-reading {
    padding-inline: 0.18em;
}
.is-compact .player-identity {
    --player-avatar-size: 8px;
    gap: 4px;
    --powerup-badge-size: 0.96rem;
    --powerup-badge-gap: 3px;
}
.is-compact .rank-cue-lead > span {
    display: none;
}
.live-statistics.is-hud {
    --score-surface: transparent;
    --score-heading: #092d28;
    --score-rule: #b7dab220;
    padding: 0.22rem 0.55rem 0.5rem;
    overflow: visible;
}
.is-hud .live-table {
    border-collapse: separate;
    border-spacing: 0 0.18rem;
    font-size: 0.88rem;
}
.is-hud .live-table :is(th, td) {
    padding: 0.4rem 0.44rem;
}
.is-hud .live-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    color: #cce5d4;
    text-transform: uppercase;
}
.is-hud .live-table :is(th, td):nth-child(2) {
    width: 2.45rem;
}
.is-hud .live-table :is(th, td):nth-child(3) {
    width: 5.4rem;
}
.is-hud .live-table :is(th, td):nth-child(4) {
    width: 4rem;
}
.is-hud .live-table tbody tr:nth-child(even) {
    background: none;
}
.is-hud .live-table tbody td:first-child {
    border-radius: 0.5rem 0 0 0.5rem;
}
.is-hud .live-table tbody td:last-child {
    border-radius: 0 0.5rem 0.5rem 0;
}
.is-hud .live-table tr.is-you:not(.is-attacking-you) td {
    background: #aee87523;
    border-bottom-color: #c0f69765;
    color: #f1ffd4;
}
.is-hud .live-table tr.is-you:not(.is-attacking-you) td:first-child {
    box-shadow: inset 2px 0 #d9ff94;
}
.is-hud .live-points {
    color: #d9f997;
}
.is-hud .player-identity {
    --player-avatar-size: 1.22rem;
    gap: 0.32rem;
}
.is-hud .player-identity :deep(.player-avatar) {
    border-radius: 50%;
    background: #0a3227;
}
.your-row {
    flex: none;
    padding: 0.13em 0.35em;
    border-radius: 0.26rem;
    background: #c2f28628;
    color: #e7ffc2;
    font-size: 0.67em;
    font-weight: 750;
}
.live-statistics.is-hud.is-compact {
    padding: 0.12rem 0.32rem 0.24rem;
}
.is-hud.is-compact .live-table {
    border-spacing: 0 0.12rem;
    font-size: 0.72rem;
}
.is-hud.is-compact .live-table :is(td, th) {
    padding: 0.24rem 0.2rem;
}
.is-hud.is-compact .live-table .numeric {
    white-space: nowrap;
}
.is-hud.is-compact .live-table :is(td, th):nth-child(2) {
    width: 1.9rem;
}
.is-hud.is-compact .live-table :is(td, th):nth-child(3) {
    width: 5rem;
}
.is-hud.is-compact .live-table :is(td, th):nth-child(4) {
    width: 2.35rem;
}
.is-hud.is-compact .player-identity {
    --player-avatar-size: 0.92rem;
    gap: 0.22rem;
}
.live-statistics.is-hud.is-compact.is-peek {
    padding: 0.08rem 0.28rem;
}
.is-hud.is-compact.is-peek .live-table {
    table-layout: auto;
    inline-size: 100%;
    border-spacing: 0 0.08rem;
    font-size: 0.72rem;
}
.is-hud.is-compact.is-peek .live-table td {
    padding: 0.16rem 0.26rem;
    border-bottom: 0;
}
.is-hud.is-compact.is-peek .live-table td:first-child {
    padding-inline-end: 0.55rem;
}
.is-hud.is-compact.is-peek .live-table td:nth-child(2),
.is-hud.is-compact.is-peek .live-table td:nth-child(3),
.is-hud.is-compact.is-peek .live-table td:nth-child(4) {
    width: 1%;
    white-space: nowrap;
}
.is-hud.is-compact.is-peek .live-player-name {
    max-inline-size: min(9.5rem, 36vw);
}
.live-rank-num {
    flex: none;
    min-inline-size: 1.25rem;
    color: #9dc0ae;
    font: 800 0.65rem / 1 var(--gb-font-mono);
    font-variant-numeric: tabular-nums;
}
.live-rank-num[data-rank="1"] {
    color: #ffca62;
}
.live-rank-num[data-rank="2"] {
    color: #dbe9ed;
}
.live-rank-num[data-rank="3"] {
    color: #f6b68d;
}
.peek-gap-row td {
    padding: 0.1rem 0.2rem !important;
    border-bottom: 0 !important;
    text-align: center;
}
.peek-gap-pill {
    display: inline-block;
    padding: 0.06rem 0.45rem;
    border-radius: 999px;
    background: #b6efa318;
    color: #b7d8c5;
    font: 700 0.62rem / 1.25 var(--gb-font-display);
    letter-spacing: 0.02em;
}
.player-connection {
    flex: none;
    color: var(--gb-muted);
    font-size: 0.65rem;
}
</style>
