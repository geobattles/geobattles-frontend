<template>
    <section class="countdown-leaderboard" :aria-labelledby="titleId">
        <header class="leaderboard-header">
            <h2 :id="titleId"><UiIcon name="trophy" />Leaderboard</h2>
            <span>Top 3</span>
        </header>
        <ul class="leaderboard-rows" role="list">
            <li v-for="(row, index) in rows" :key="row.id" :data-rank="row.rank" :style="{ '--row-delay': index * 45 + 'ms' }">
                <span class="medal">
                    <svg viewBox="0 0 44 36" fill="none" aria-hidden="true" focusable="false">
                        <path
                            d="M19 33C8 30 4 23 5 10m1 6c-3-2-4-5-3-8m3 11 3-7m-1 11-6-5m8 8 1-7m2 10-8-3m11 5-2-7m4 8-7 1"
                            stroke="currentColor"
                            stroke-width="1.45"
                            stroke-linecap="round"
                        />
                        <path
                            d="M19 33C8 30 4 23 5 10m1 6c-3-2-4-5-3-8m3 11 3-7m-1 11-6-5m8 8 1-7m2 10-8-3m11 5-2-7m4 8-7 1"
                            stroke="currentColor"
                            stroke-width="1.45"
                            stroke-linecap="round"
                            transform="translate(44 0) scale(-1 1)"
                        />
                    </svg>
                    <span class="sr-only">Rank </span>{{ row.rank }}
                </span>
                <PlayerAvatar :color="getPlayerColorByID(row.id)" />
                <span class="standing-name">{{ getPlayerNameFromID(row.id) }}</span>
                <strong class="standing-score">{{ scoreFormat.format(row.score) }}<span class="sr-only"> points</span></strong>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import type { rankTotalResults } from "~/utils/resultUtils";

defineProps<{ rows: ReturnType<typeof rankTotalResults> }>();
const titleId = useId();
const { getPlayerNameFromID, getPlayerColorByID } = usePlayerLookup();
const scoreFormat = new Intl.NumberFormat("en");
</script>

<style scoped>
.countdown-leaderboard {
    --player-avatar-size: clamp(1.65rem, 4.7dvh, 2.55rem);
    --row-height: clamp(2.4rem, 6.4dvh, 3.5rem);
    min-inline-size: 0;
    inline-size: min(100%, 29rem);
    padding: clamp(0.48rem, 1.8dvh, 1rem);
    border: 1px solid #b4e4a55c;
    border-radius: 1.15rem;
    background: radial-gradient(ellipse at 40% 0%, #a8e59d24, transparent 44%), linear-gradient(145deg, #214435ed, #092a24f2 60%, #1a382df2);
    box-shadow:
        0 14px 40px #03140bc0,
        inset 0 1px #e9ffd724,
        inset 0 0 1.5rem #b1f08114;
}
.leaderboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.1rem 0.45rem clamp(0.35rem, 1.55dvh, 0.85rem);
    color: #d1eda5;
}
.leaderboard-header h2,
.leaderboard-header > span {
    color: inherit;
    font: 800 clamp(0.62rem, 1.2vw, 0.88rem) / 1.2 var(--gb-font-display);
    text-transform: uppercase;
    letter-spacing: 0.11em;
    white-space: nowrap;
}
.leaderboard-header h2 {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--gb-text);
}
.leaderboard-header .ui-icon {
    inline-size: 1.18em;
    block-size: 1.18em;
    color: #e6f7c6;
}
.leaderboard-rows {
    display: grid;
    gap: clamp(0.15rem, 0.64dvh, 0.42rem);
    margin: 0;
    padding: 0;
    list-style: none;
}
.leaderboard-rows li {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    align-items: center;
    gap: clamp(0.4rem, 1.1vw, 0.86rem);
    min-block-size: var(--row-height);
    min-inline-size: 0;
    padding: 0.15rem clamp(0.38rem, 1.25vw, 0.75rem);
    border-radius: 0.68rem;
    border: 1px solid #b3d7b412;
    background: #102c255c;
}
.leaderboard-rows li[data-rank="1"] {
    border-color: #e3ed8b56;
    background: linear-gradient(105deg, #91a75d39, #91a75d12 55%, #a7c96c29);
    box-shadow: inset 0 0 0.8rem #ceef8920;
}
.medal {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: clamp(1.75rem, 3.6vw, 2.8rem);
    min-block-size: min(var(--player-avatar-size), 1.95rem);
    color: #d29d68;
    font: italic 850 clamp(0.8rem, 2vw, 1.28rem) / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
.medal svg {
    position: absolute;
    width: 100%;
    height: 114%;
    inset: -7% 0 auto;
}
[data-rank="1"] .medal {
    color: #ffe275;
}
[data-rank="2"] .medal {
    color: #cce0de;
}
.leaderboard-rows :deep(.player-avatar) {
    border-radius: 50%;
    background: radial-gradient(circle at 32% 17%, #60966956, #102f23 72%);
}
.standing-name,
.standing-score {
    font-size: clamp(0.79rem, 1.35vw, 1.07rem);
    line-height: 1.2;
}
.standing-name {
    min-inline-size: 0;
    overflow: hidden;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.standing-score {
    color: #d5f698;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
@media (orientation: portrait) {
    .countdown-leaderboard {
        --row-height: clamp(2.1rem, 5.5dvh, 3rem);
        --player-avatar-size: clamp(1.5rem, 4.25dvh, 2.15rem);
    }
}
@media (max-height: 520px) and (orientation: landscape) {
    .countdown-leaderboard {
        --row-height: clamp(1.55rem, 10dvh, 2.45rem);
        --player-avatar-size: clamp(1.14rem, 7.6dvh, 1.76rem);
        border-radius: 0.85rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .countdown-leaderboard {
        animation: standings-in 300ms 55ms ease-out both;
    }
    .leaderboard-rows li {
        animation: standings-in 240ms calc(90ms + var(--row-delay)) ease-out both;
    }
}
@keyframes standings-in {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
}
</style>
