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
                >
                    <td>
                        <span class="player-identity"
                            ><span class="player-swatch" :style="{ backgroundColor: getPlayerColorByID(id) }" /><span class="live-player-name" :title="getPlayerNameFromID(id)">{{
                                getPlayerNameFromID(id)
                            }}</span>
                            <span v-if="effects.get(id)?.kind === 'lead'" :key="`lead-${effects.get(id)?.attempt}`" class="rank-cue rank-cue-lead" title="Takes the lead">
                                <UiIcon name="crown" /><span>Lead</span>
                            </span>
                            <span v-else-if="effects.get(id)?.kind === 'climb'" :key="`climb-${effects.get(id)?.attempt}`" class="rank-cue rank-cue-climb" title="Moved up">
                                ↑{{ effects.get(id)?.passed }}
                            </span></span
                        >
                    </td>
                    <td class="numeric" :title="`${result.lives} guesses remaining`">
                        <span class="live-attempt"
                            ><span v-if="effects.has(id)" :key="effects.get(id)?.attempt" class="guess-pin" title="Guess placed"><UiIcon name="pin" /></span
                            >{{ result.lives }}</span
                        >
                    </td>
                    <td class="numeric live-distance">{{ formatGuessDistance(result) }}</td>
                    <td class="numeric accent font-semibold">{{ result.baseScr || 0 }}</td>
                </tr>
            </TransitionGroup>
        </table>
        <p v-if="!entries.length" class="field-help p-3">Waiting for the round to begin.</p>
        <p v-if="playerHooks" class="sr-only" role="status">{{ announcement }}</p>
    </div>
</template>
<script setup lang="ts">
import type { LiveGuessFeedback } from "~/utils/resultUtils";

const props = defineProps<{ playerHooks?: boolean; compact?: boolean }>();
const game = useGameMode();
const activeHooks = computed(() => props.playerHooks && ["PLAYING", "STARTING"].includes(game.modeLogic.currentState));
const results = useResultsStore();
const lobby = useLobbyStore();
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
        announcement.value = `${getPlayerNameFromID(cue.playerId)} placed guess ${cue.attempt}${summary}.`;
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
.live-attempt {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
}
.guess-pin {
    color: #b7cfdf;
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
    color: var(--gb-accent);
}
.live-table tr[data-guess-effect] {
    --guess-tint: #b7cfdf;
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
    .live-table tr[data-guess-effect="lead"] > td {
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
.is-compact .player-identity {
    gap: 4px;
}
.is-compact .player-swatch {
    width: 6px;
    height: 6px;
}
.is-compact .rank-cue-lead > span {
    display: none;
}
</style>
