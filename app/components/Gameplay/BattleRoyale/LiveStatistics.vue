<template>
    <div class="live-statistics table-scroll" :class="{ 'is-compact': compact, 'is-hud': playerHooks }">
        <table class="data-table live-table">
            <caption class="sr-only">
                This round’s live results
            </caption>
            <thead>
                <tr>
                    <th scope="col">{{ playerHooks || compact ? "Player" : "Explorer" }}</th>
                    <th scope="col" class="numeric">Left</th>
                    <th scope="col" class="numeric" :aria-label="compact ? 'Best distance' : undefined">{{ compact ? "Best" : "Distance" }}</th>
                    <th scope="col" class="numeric">{{ compact ? "Pts" : "Base pts" }}</th>
                </tr>
            </thead>
            <TransitionGroup tag="tbody" :move-class="effects.size ? 'live-rank-move' : 'live-rank-still'">
                <tr
                    v-for="[id, result] in entries"
                    :key="id"
                    :id="playerHooks ? `live-player-${id}` : undefined"
                    :data-testid="activeHooks ? 'player-row' : undefined"
                    :data-player-name="lobby.lobbySettings?.playerList[id]?.name"
                    :data-connected="String(lobby.lobbySettings?.playerList[id]?.connected === true)"
                    :data-ready="String(lobby.lobbySettings?.playerList[id]?.ready === true)"
                    :data-host="String(lobby.lobbySettings?.admin === id)"
                    :data-guess-effect="effects.get(id)?.kind"
                    :class="{ 'is-attacking-you': powerupIndicators.get(id)?.targets.includes(player.ID ?? ''), 'is-you': playerHooks && id === player.ID }"
                >
                    <td>
                        <span class="player-identity">
                            <PlayerAvatar :color="getPlayerColorByID(id)" />
                            <span class="live-player-name" :title="getPlayerNameFromID(id)">{{ getPlayerNameFromID(id) }}</span>
                            <span v-if="playerHooks && id === player.ID" :class="compact ? 'sr-only' : 'your-row'">You</span>
                            <small v-if="lobby.lobbySettings?.playerList[id]?.connected === false" class="player-connection">{{
                                lobby.lobbySettings.playerList[id]?.away ? "Away" : "Offline"
                            }}</small>
                            <GameplayPlayerPowerupIndicators :indicator="powerupIndicators.get(id)" />
                            <span v-if="effects.get(id)?.kind === 'lead'" :key="`lead-${effects.get(id)?.attempt}`" class="rank-cue rank-cue-lead" title="Takes the lead">
                                <UiIcon name="crown" /><span>Lead</span>
                            </span>
                            <span v-else-if="effects.get(id)?.kind === 'climb'" :key="`climb-${effects.get(id)?.attempt}`" class="rank-cue rank-cue-climb" title="Moved up">
                                ↑{{ effects.get(id)?.passed }}
                            </span>
                        </span>
                        <small v-if="powerupIndicators.get(id)?.targets.length" class="live-matchup" aria-hidden="true">
                            {{ getPlayerNameFromID(id) }} → {{ powerupIndicators.get(id)?.targets.map(getPlayerNameFromID).join(", ") }}
                        </small>
                    </td>
                    <td class="numeric" :title="`${result.lives} guesses remaining`">
                        <span class="live-attempt"
                            ><span v-if="effects.has(id)" :key="effects.get(id)?.attempt" class="guess-pin" title="Guess placed"><UiIcon name="pin" /></span
                            >{{ result.lives }}</span
                        >
                    </td>
                    <td class="numeric live-distance">
                        <span class="distance-reading">{{ formatGuessDistance(result) }}</span>
                    </td>
                    <td class="numeric live-points">{{ result.baseScr || 0 }}</td>
                </tr>
            </TransitionGroup>
        </table>
        <p v-if="!entries.length" class="field-help p-3">Waiting for the round to begin.</p>
        <p v-if="playerHooks" class="sr-only" role="status">{{ announcement }}</p>
    </div>
</template>
<script setup lang="ts">
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import type { LiveGuessFeedback } from "~/utils/resultUtils";

const props = defineProps<{ playerHooks?: boolean; compact?: boolean }>();
const game = useGameMode();
const activeHooks = computed(() => props.playerHooks && ["PLAYING", "STARTING"].includes(game.modeLogic.currentState));
const results = useResultsStore();
const player = usePlayerInfo();
const lobby = useLobbyStore();
const powerupIndicators = useLivePowerupIndicators();
const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
const entries = computed(() => Object.entries(results.liveResults).filter(([id]) => !!lobby.lobbySettings?.playerList[id]));
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
    background: #392929;
    box-shadow:
        inset 0 1px #d77a7059,
        inset 0 -1px #d77a7059;
    animation: none;
}
.live-table tr.is-attacking-you > td:first-child {
    box-shadow:
        inset 2px 0 #d77a70a6,
        inset 0 1px #d77a7059,
        inset 0 -1px #d77a7059;
}
.live-table tr.is-attacking-you > td:last-child {
    box-shadow:
        inset -1px 0 #d77a7059,
        inset 0 1px #d77a7059,
        inset 0 -1px #d77a7059;
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
    gap: 2px;
    --powerup-badge-size: 0.72rem;
    --powerup-badge-gap: 2px;
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
.player-connection {
    flex: none;
    color: var(--gb-muted);
    font-size: 0.65rem;
}
</style>
