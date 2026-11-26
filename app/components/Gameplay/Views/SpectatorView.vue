<template>
    <section class="spectator-view" aria-labelledby="watch-title">
        <header class="watch-header">
            <span class="watch-brand">
                <img src="/images/emerald-mark.svg" alt="" width="28" height="30" /><span>Geo<b>Battles</b></span>
            </span>
            <div class="watch-header-state">
                <h1 id="watch-title" class="watch-tag"><UiIcon name="eye" />Spectating</h1>
                <span class="watch-count"
                    >{{ snapshot.numPlayers }} {{ snapshot.numPlayers === 1 ? "player" : "players" }} <span>{{ snapshot.spectatorCount ?? 0 }} watching</span></span
                >
            </div>
            <button class="watch-leave btn btn-icon btn-quiet" type="button" aria-label="Leave lobby" title="Leave lobby" @click="emit('leaveLobby')">
                <UiIcon name="leave" />
            </button>
        </header>
        <div ref="connectionSlot" class="watch-connection" />

        <div class="watch-layout">
            <section class="watch-main" aria-label="Match view">
                <header class="watch-nav">
                    <div class="watch-switch" role="group" aria-label="Spectator view">
                        <button type="button" :aria-pressed="!isReviewing" @click="view = 'live'">Match</button>
                        <button type="button" :aria-pressed="isReviewing" :disabled="!rounds.length" @click="view = 'results'">Round results</button>
                    </div>
                    <span v-if="playing && roundDeadline !== null" class="watch-clock" :aria-label="countdown + ' seconds remaining'"><UiIcon name="clock" />{{ clockLabel }}</span>
                </header>
                <GameplaySpectatorRoundMap v-if="isReviewing && answer && roundResults" :answer="answer" :results="roundResults" :players="snapshot.playerList" />
                <div v-else class="watch-scenery">
                    <picture aria-hidden="true">
                        <source media="(max-width: 650px) and (orientation: portrait)" srcset="/images/emerald-horizon-portrait.webp" />
                        <img src="/images/emerald-horizon.webp" alt="" width="1672" height="941" />
                    </picture>
                    <div class="watch-story">
                        <span class="watch-phase"><span :class="{ 'phase-live': playing }" />{{ phaseLabel }}</span>
                        <h2>{{ snapshot.conf.name }}</h2>
                        <p>
                            {{
                                playing
                                    ? "The round’s map and scores unlock when it ends."
                                    : finished
                                      ? "Review the completed rounds and final scores."
                                      : "The next round is up to the host."
                            }}
                        </p>
                    </div>
                </div>
            </section>

            <section class="watch-side" aria-labelledby="watch-standings">
                <header class="watch-table-heading">
                    <h2 id="watch-standings"><UiIcon name="trophy" />{{ isReviewing ? "Round standings" : finished ? "Final standings" : "Standings" }}</h2>
                    <label v-if="isReviewing" class="watch-round-control">
                        <span class="sr-only">Select a completed round</span>
                        <select v-model.number="selectedRound">
                            <option v-for="round in rounds" :key="round" :value="round">Round {{ round }}</option>
                        </select>
                    </label>
                </header>
                <div class="watch-table-scroll" role="region" :aria-label="isReviewing ? 'Completed round scores' : 'Settled match scores'" tabindex="0">
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Rank</th>
                                <th scope="col">Player</th>
                                <th v-if="isReviewing" scope="col">Distance</th>
                                <th scope="col">{{ isReviewing ? "Points" : "Total" }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in rows" :key="row.id" :data-rank="row.rank">
                                <td>{{ row.rank ?? "—" }}</td>
                                <th scope="row">
                                    <span class="watch-player">
                                        <UiPlayerAvatar :color="snapshot.playerList[row.id]?.color" />
                                        <span :title="snapshot.playerList[row.id]?.name">{{ snapshot.playerList[row.id]?.name ?? "Player" }}</span>
                                        <span v-if="!snapshot.playerList[row.id]?.connected" class="watch-offline" title="Offline"><span class="sr-only">Offline</span></span>
                                    </span>
                                </th>
                                <td v-if="isReviewing">{{ row.distance }}</td>
                                <td class="watch-points">{{ row.score ?? "—" }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-if="!rows.length" class="watch-empty">Waiting for the first results</p>
                </div>
            </section>

            <footer class="watch-progress">
                <div>
                    <p>
                        <strong>Round {{ snapshot.currentRound }} of {{ snapshot.conf.numRounds }}</strong
                        ><span>{{ rounds.length }} complete</span>
                    </p>
                    <progress :value="rounds.length" :max="snapshot.conf.numRounds" aria-label="Completed rounds" />
                </div>
                <p class="watch-next" role="status"><UiIcon name="users" />{{ finished ? "Rematch full. Waiting for a seat." : "Play in the next game when a seat opens" }}</p>
            </footer>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { LobbyInfo } from "~/types/appTypes";
import { formatGuessDistance, hasGuess, rankRoundResults, rankTotalResults } from "~/utils/resultUtils";

const props = defineProps<{ snapshot: LobbyInfo }>();
const emit = defineEmits<{ leaveLobby: []; connectionTarget: [target: HTMLElement | null] }>();
const connectionSlot = useTemplateRef("connectionSlot");
watch(connectionSlot, (slot) => emit("connectionTarget", slot), { flush: "post" });
onBeforeUnmount(() => emit("connectionTarget", null));
const { roundDeadline } = useLobbyState();
const playing = computed(() => props.snapshot.phase === "PLAYING");
const finished = computed(() => props.snapshot.phase === "FINISHED");
const phaseLabel = computed(() => (playing.value ? "Round in progress" : finished.value ? (props.snapshot.endedEarly ? "Match ended early" : "Match complete") : "Between rounds"));
const { countdown } = useTimer(() => playing.value);
const clockLabel = computed(() => `${Math.floor(countdown.value / 60)}:${String(countdown.value % 60).padStart(2, "0")}`);
const rounds = computed(() =>
    Object.keys(props.snapshot.revealedAnswers ?? {})
        .map(Number)
        .sort((a, b) => b - a)
);
const view = ref<"live" | "results" | null>(null);
const requestedRound = ref(0);
const selectedRound = computed({
    get: () => (rounds.value.includes(requestedRound.value) ? requestedRound.value : (rounds.value[0] ?? 0)),
    set: (round: number) => (requestedRound.value = round),
});
const isReviewing = computed(() => (view.value === "results" || (view.value === null && props.snapshot.phase === "MID-ROUND")) && !!rounds.value.length);
const answer = computed(() => props.snapshot.revealedAnswers?.[selectedRound.value]);
const roundResults = computed(() => props.snapshot.endResults[selectedRound.value]);
const rows = computed(() => {
    if (isReviewing.value) {
        const scores = roundResults.value ?? {};
        return rankRoundResults(scores).map((row) => {
            const guess = scores[row.id];
            return { ...row, distance: guess && hasGuess(guess) ? formatGuessDistance(guess) : "No guess" };
        });
    }
    const ranked = rankTotalResults(props.snapshot.totalResults);
    if (ranked.length) return ranked.map((row) => ({ ...row, distance: "" }));
    return Object.keys(props.snapshot.playerList).map((id) => ({ id, rank: undefined, score: undefined, distance: "" }));
});
</script>

<style scoped>
.spectator-view {
    --watch-edge: clamp(0.35rem, 1.65vw, 1.3rem);
    --watch-line: #9cdbb04a;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    height: var(--gb-viewport-height);
    overflow: clip;
    padding-inline: var(--gb-safe-left) var(--gb-safe-right);
    padding-block: var(--gb-safe-top) var(--gb-safe-bottom);
    background: #05251f url("/images/atlas-relief.svg") center / 55rem auto;
    color: #edf9f1;
}
.watch-header,
.watch-header-state,
.watch-brand,
.watch-tag,
.watch-nav,
.watch-clock,
.watch-table-heading,
.watch-player {
    display: flex;
    align-items: center;
    min-width: 0;
}
.watch-header {
    justify-content: space-between;
    gap: 0.45rem;
    padding: 0.35rem var(--watch-edge);
    border-bottom: 1px solid var(--watch-line);
    background: #082e27;
}
.watch-brand {
    flex: none;
    gap: 0.38rem;
    font: italic 850 clamp(1rem, 2vw, 1.45rem) / 1 var(--gb-font-display);
    letter-spacing: -0.045em;
}
.watch-brand b,
.watch-tag,
.watch-clock,
.watch-points {
    color: #d9fca6;
}
.watch-brand img {
    width: clamp(1.2rem, 2.15vw, 1.75rem);
    height: auto;
}
.watch-header-state {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.12rem 0.65rem;
}
.watch-tag {
    gap: 0.35rem;
    border: 1px solid #b1de865a;
    border-radius: 999px;
    padding: 0.24rem 0.56rem;
    background: #34593c;
    font-size: 0.76rem;
    font-weight: 760;
}
.watch-count {
    display: flex;
    gap: 0.62rem;
    color: #c0dacd;
    font-size: 0.75rem;
    white-space: nowrap;
}
.watch-leave {
    flex: none;
    width: 44px;
    height: 44px;
    color: #ffdaca;
}
.watch-connection {
    padding-inline: var(--watch-edge);
}
.watch-layout {
    display: grid;
    grid-template: minmax(0, 1fr) auto / minmax(0, 1.55fr) minmax(0, 1fr);
    gap: var(--watch-edge);
    min-height: 0;
    padding: var(--watch-edge);
}
.watch-main,
.watch-side {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--watch-line);
    border-radius: 0.9rem;
    background: #0a3229;
}
.watch-nav,
.watch-table-heading {
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.26rem 0.65rem;
    border-bottom: 1px solid var(--watch-line);
    background: #103b31 url("/images/atlas-relief.svg") center / 35rem auto;
}
.watch-switch {
    display: inline-flex;
    min-width: 0;
    border: 1px solid #a1df9e53;
    border-radius: 999px;
    padding: 2px;
    background: #082921;
}
.watch-switch button {
    min-height: 40px;
    border-radius: inherit;
    padding: 0.1rem clamp(0.48rem, 1.35vw, 0.9rem);
    font-size: clamp(0.71rem, 2vw, 0.85rem);
    font-weight: 720;
    white-space: nowrap;
}
.watch-switch button[aria-pressed="true"] {
    background: #d1f59f;
    color: #173523;
}
.watch-switch button:disabled {
    opacity: 0.52;
}
.watch-clock {
    gap: 0.3rem;
    font: 800 clamp(0.87rem, 2.4vw, 1.16rem) / 1 var(--gb-font-mono);
    font-variant-numeric: tabular-nums;
}
.watch-scenery {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: end;
    min-height: 0;
    overflow: hidden;
    background: #143c36;
}
.watch-scenery picture,
.watch-scenery::after {
    position: absolute;
    inset: 0;
    z-index: -1;
}
.watch-scenery picture img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 56% 46%;
}
.watch-scenery::after {
    content: "";
    background: linear-gradient(0deg, #061c18f7, #06281c36 70%);
}
.watch-story {
    min-width: 0;
    padding: clamp(0.7rem, 3vw, 2.6rem);
}
.watch-story h2 {
    margin-block: 0.46rem 0.28rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: italic 850 clamp(1.32rem, 4vw, 3.65rem) / 1.05 var(--gb-font-display);
    letter-spacing: -0.04em;
}
.watch-story p {
    color: #d1e6d8;
    font-size: clamp(0.76rem, 1.5vw, 0.96rem);
}
.watch-phase {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #e0fac4;
    font-size: 0.72rem;
    font-weight: 740;
}
.watch-phase span,
.watch-offline {
    flex: none;
    inline-size: 0.42rem;
    block-size: 0.42rem;
    border-radius: 50%;
    background: #91ab9e;
}
.watch-phase .phase-live {
    background: #bcf880;
    box-shadow: 0 0 0.55rem #a5e879af;
}
.watch-table-heading h2 {
    display: flex;
    align-items: center;
    gap: 0.36rem;
    font: italic 800 clamp(0.93rem, 2.25vw, 1.28rem) / 1.2 var(--gb-font-display);
}
.watch-table-heading .ui-icon {
    color: #d7f392;
}
.watch-table-heading {
    min-height: 48px;
}
.watch-round-control select {
    min-height: 38px;
    padding: 0.25rem;
    border: 1px solid var(--watch-line);
    border-radius: 0.45rem;
    background: #0b3027;
    font-size: 0.76rem;
}
.watch-table-scroll {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
}
.watch-table-scroll table {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    font-size: clamp(0.72rem, 1.6vw, 0.93rem);
    font-variant-numeric: tabular-nums;
}
.watch-table-scroll th,
.watch-table-scroll td {
    padding: 0.42rem clamp(0.26rem, 1vw, 0.68rem);
    border-bottom: 1px solid #95cda826;
    text-align: start;
}
.watch-table-scroll thead th {
    position: sticky;
    inset-block-start: 0;
    background: #10392f;
    color: #c3ded0;
    font-size: 0.71rem;
}
.watch-table-scroll thead th:first-child {
    width: 3rem;
}
.watch-table-scroll thead th:nth-last-child(2):nth-child(3) {
    width: 5rem;
}
.watch-table-scroll thead th:last-child {
    width: 4.4rem;
}
.watch-table-scroll tr > :last-child,
.watch-table-scroll tr > td:nth-child(3) {
    text-align: end;
    white-space: nowrap;
}
.watch-table-scroll thead th:nth-child(3) {
    text-align: end;
}
.watch-table-scroll tbody tr[data-rank="1"] {
    background: linear-gradient(90deg, #6b58362e, transparent 80%);
}
.watch-player {
    gap: 0.34rem;
    --player-avatar-size: 1.18rem;
}
.watch-player > span:nth-child(2) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.watch-points {
    font-weight: 790;
}
.watch-empty {
    padding: 0.7rem;
    font-size: 0.8rem;
    color: #c0dacd;
}
.watch-progress {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.45rem clamp(0.7rem, 3vw, 2rem);
    min-width: 0;
    padding: 0.55rem 0.72rem;
    border: 1px solid var(--watch-line);
    border-radius: 0.7rem;
    background: #113a30;
}
.watch-progress p {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.15rem 0.55rem;
    font-size: clamp(0.68rem, 1.65vw, 0.86rem);
}
.watch-progress p span {
    color: #c1dccb;
}
.watch-progress progress {
    display: block;
    width: 100%;
    height: 0.27rem;
    margin-block-start: 0.34rem;
    border: 0;
    border-radius: 1rem;
    overflow: hidden;
    accent-color: #c7f28f;
    background: #062520;
}
.watch-progress progress::-webkit-progress-bar {
    background: #062520;
}
.watch-progress progress::-webkit-progress-value {
    background: #c7f28f;
}
.watch-progress .watch-next {
    flex-wrap: nowrap;
    color: #dfefcb;
}
@media (orientation: portrait) {
    .watch-layout {
        grid-template: minmax(0, 1.12fr) minmax(0, 1fr) auto / minmax(0, 1fr);
    }
    .watch-progress {
        grid-template-columns: minmax(0, 1fr);
    }
}
@media (orientation: landscape) and (max-height: 480px) {
    .watch-layout {
        --watch-edge: 0.36rem;
    }
    .watch-header {
        padding-block: 0.12rem;
    }
    .watch-table-heading,
    .watch-switch button {
        min-height: 36px;
    }
    .watch-table-scroll th,
    .watch-table-scroll td {
        padding-block: 0.23rem;
    }
    .watch-progress {
        padding-block: 0.35rem;
    }
}
@media (max-width: 480px) {
    .watch-brand span {
        display: none;
    }
    .watch-count {
        gap: 0.42rem;
        font-size: 0.69rem;
    }
    .watch-header {
        padding-inline: 0.56rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .watch-main,
    .watch-side {
        animation: watch-enter 200ms ease-out;
    }
    @keyframes watch-enter {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
}
</style>
