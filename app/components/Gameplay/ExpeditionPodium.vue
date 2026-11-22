<template>
    <ol class="expedition-podium" :class="{ 'podium-revealed': revealed, 'compact-podium': compact }" aria-label="Podium">
        <li v-for="place in places" :key="place.rank" class="podium-place" :data-rank="place.rank">
            <span class="podium-rank">
                <UiIcon v-if="place.rank === 1" name="trophy" />
                {{ place.players.length > 1 ? "Shared " : "" }}{{ placeLabels[place.rank] }}
            </span>
            <ul class="podium-names" :tabindex="place.players.length > 2 ? 0 : undefined" :aria-label="`${placeLabels[place.rank]} players`">
                <li v-for="player in place.players" :key="player.id">
                    <PlayerAvatar :color="getPlayerColorByID(player.id)" />
                    <span class="podium-name" :title="getPlayerNameFromID(player.id)">{{ getPlayerNameFromID(player.id) }}</span>
                </li>
            </ul>
            <p class="podium-points">
                {{ place.points.toLocaleString() }} <small>{{ place.players.length > 1 ? "pts each" : "pts" }}</small>
            </p>
        </li>
    </ol>
</template>

<script setup lang="ts">
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import type { RankedResult } from "~/utils/resultUtils";

const props = defineProps<{ rankings: RankedResult[]; revealed: boolean; compact?: boolean }>();
const { getPlayerColorByID, getPlayerNameFromID } = usePlayerLookup();
const placeLabels: Record<number, string> = { 1: "First", 2: "Second", 3: "Third" };
const places = computed(() =>
    [1, 2, 3].flatMap((rank) => {
        const players = props.rankings.filter((player) => player.rank === rank);
        return players[0] ? [{ rank, players, points: players[0].score }] : [];
    })
);
</script>

<style scoped>
.expedition-podium {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    align-items: end;
    gap: clamp(0.32rem, 1.05vw, 0.8rem);
    margin: 0;
    padding: 0;
    list-style: none;
}
.podium-place {
    --metal: #ffca9b;
    --metal-wash: #aa6a4948;
    display: grid;
    gap: 0.32rem;
    min-width: 0;
    padding: clamp(0.36rem, 1.32vw, 0.9rem);
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--metal) 37%, #153f33);
    border-radius: 0.82rem;
    background: radial-gradient(ellipse at 32% 0, var(--metal-wash), transparent 82%), #0a2c25;
    box-shadow: inset 0 1px #f7f7ca20;
}
.podium-place[data-rank="1"] {
    --metal: #ffe6a1;
    --metal-wash: #b5803a5c;
    padding-block-start: clamp(0.56rem, 1.65vw, 1.2rem);
}
.podium-place[data-rank="2"] {
    --metal: #dcecf6;
    --metal-wash: #91a9b84a;
}
.podium-rank {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    color: var(--metal);
    font-size: clamp(0.65rem, 1.5vw, 0.81rem);
    font-weight: 800;
    line-height: 1.15;
}
.podium-names {
    display: grid;
    align-content: start;
    gap: 0.25rem;
    min-width: 0;
    max-height: clamp(1.25rem, 10dvh, 4.7rem);
    padding: 0;
    overflow: auto;
    overscroll-behavior: contain;
    list-style: none;
    scrollbar-width: thin;
    font-size: clamp(0.75rem, 1.7vw, 1.08rem);
    font-weight: 760;
    line-height: 1.15;
}
.podium-names li {
    --player-avatar-size: 1.2em;
    display: flex;
    gap: 0.35em;
    align-items: start;
    min-width: 0;
    overflow-wrap: anywhere;
}
.podium-points {
    color: var(--metal);
    font: italic 850 clamp(0.88rem, 1.95vw, 1.42rem) / 1.15 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
.podium-points small {
    color: #d0e6d6;
    font-size: 0.65em;
    font-style: normal;
    font-weight: 650;
}
.compact-podium .podium-place {
    gap: 0.22rem;
    padding: clamp(0.35rem, 0.9vw, 0.7rem);
}
.compact-podium .podium-names {
    max-height: 2.55em;
    font-size: clamp(0.7rem, 1.5vw, 0.93rem);
}
.compact-podium .podium-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.compact-podium .podium-points {
    font-size: clamp(0.78rem, 1.6vw, 1.19rem);
}
@media (orientation: landscape) and (max-height: 500px), (max-width: 540px) {
    .podium-place,
    .podium-place[data-rank="1"] {
        gap: 0.24rem;
        padding: 0.4rem;
    }
    .podium-names {
        max-height: 2.55rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .podium-revealed .podium-place {
        animation: podium-arrive 250ms ease-out both;
    }
    .podium-revealed [data-rank="2"] {
        animation-delay: 55ms;
    }
    .podium-revealed [data-rank="3"] {
        animation-delay: 105ms;
    }
    @keyframes podium-arrive {
        from {
            opacity: 0.65;
            translate: 0 0.22rem;
        }
    }
}
</style>
