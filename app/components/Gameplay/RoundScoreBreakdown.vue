<template>
    <div
        v-if="detailed || result.placeScr || modifiers.doubleUsed || modifiers.hasDuels"
        class="score-breakdown"
        :class="{ detailed }"
        role="group"
        aria-label="Round score breakdown"
    >
        <dl class="score-parts">
            <div v-if="detailed" class="score-total">
                <dt>Round points</dt>
                <dd>{{ roundResultPoints(result) }}</dd>
            </div>
            <div class="score-base">
                <dt>Base</dt>
                <dd>{{ result.baseScr }}</dd>
            </div>
            <div v-if="result.placeScr" class="score-bonus">
                <dt>Placement</dt>
                <dd>{{ result.placeScr }}</dd>
            </div>
            <div v-if="modifiers.doubleUsed" class="score-bonus">
                <dt><UiIcon name="bolt" />Double Score</dt>
                <dd>{{ result.dblScr ?? 0 }}</dd>
            </div>
            <div v-if="modifiers.hasDuels" :class="modifiers.duelPoints < 0 ? 'score-loss' : modifiers.duelPoints > 0 ? 'score-bonus' : 'score-draw'">
                <dt><UiIcon name="target" />{{ modifiers.duels.length > 1 ? modifiers.duels.length + " duels" : "Duel" }}</dt>
                <dd>{{ modifiers.duelPoints }}{{ detailed && modifiers.duels.length > 1 ? " net" : "" }}</dd>
            </div>
        </dl>
        <ul v-if="!detailed && modifiers.duels.length" class="duel-outcomes" aria-label="Duel outcomes">
            <li v-for="duel in modifiers.duels" :key="duel.id">
                {{ duel.incoming ? "Challenged by" : "Challenged" }} {{ getPlayerNameFromID(duel.opponent) }}
                <template v-if="duel.outcome"
                    ><span aria-hidden="true"> · </span><b>{{ duel.outcome }}</b></template
                >
            </li>
        </ul>
        <template v-if="detailed">
            <section v-for="group in groups" :key="group.label" class="duel-group">
                <h3>{{ group.label }}</h3>
                <ul>
                    <li v-for="duel in group.duels" :key="duel.id">
                        <span class="opponent"><PlayerAvatar :color="getPlayerColorByID(duel.opponent)" />{{ getPlayerNameFromID(duel.opponent) }}</span>
                        <span>{{ duel.outcome === "Won" || duel.outcome === "Lost" ? subject + " " + duel.outcome.toLowerCase() : (duel.outcome ?? "—") }}</span>
                        <b :class="{ positive: duel.outcome === 'Won', negative: duel.outcome === 'Lost' }">{{ adjustments[duel.outcome ?? "Unknown"] }}</b>
                    </li>
                </ul>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { ResultData } from "~/types/appTypes";
import PlayerAvatar from "~/components/Ui/PlayerAvatar.vue";
import { roundResultPoints } from "~/utils/resultUtils";
import { duelStake, type RoundScoreModifiers } from "~/utils/roundPowerups";

const props = defineProps<{ playerId: string; result: ResultData; modifiers: RoundScoreModifiers; detailed?: boolean }>();
const { getPlayerNameFromID, getPlayerColorByID } = usePlayerLookup();
const player = usePlayerInfo();
const subject = computed(() => (player.value.ID === props.playerId ? "You" : getPlayerNameFromID(props.playerId)));
const groups = computed(() =>
    [
        { label: player.value.ID === props.playerId ? "Challenged you" : "Challenged " + subject.value, duels: props.modifiers.duels.filter((duel) => duel.incoming) },
        { label: subject.value + " challenged", duels: props.modifiers.duels.filter((duel) => !duel.incoming) },
    ].filter((group) => group.duels.length)
);
const adjustments = { Won: duelStake, Lost: -duelStake, Draw: 0, Unknown: "—" };
</script>

<style scoped>
.score-breakdown {
    display: grid;
    gap: 0.26rem;
    min-width: 0;
    color: #c2d8ca;
    font-size: clamp(0.75rem, 1.15vw, 0.875rem);
    line-height: 1.35;
}
.score-parts {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.22rem 0.42rem;
}
.score-parts > div,
.score-parts dt {
    display: inline-flex;
    align-items: center;
    gap: 0.22rem;
    padding: 0.1rem 0.36rem;
    border-radius: 0.32rem;
    font-variant-numeric: tabular-nums;
}
.score-parts dd {
    font-weight: 750;
}
.score-parts .score-base {
    padding-inline-start: 0;
}
.score-parts .ui-icon {
    width: 0.92em;
    height: 0.92em;
}
.score-bonus {
    background: #9ce8a21c;
    color: #c2f5ab;
}
.score-loss {
    background: #f49a8a22;
    color: #ffbbab;
}
.score-draw {
    background: #abc9be20;
    color: #d1e4da;
}
.duel-outcomes {
    display: grid;
    gap: 0.1rem;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-wrap: anywhere;
}
.detailed {
    gap: 0.78rem;
    font-size: 0.86rem;
    color: #e6f4e9;
}
.detailed .score-parts,
.duel-group ul {
    display: grid;
    gap: 0;
    overflow: hidden;
    border: 1px solid #9be0a53d;
    border-radius: 0.9rem;
    background: #06241ecc;
}
.detailed .score-parts > div,
.duel-group li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.55rem;
    padding: 0.46rem 0.75rem;
    border-radius: 0;
    background: transparent;
}
.detailed .score-parts dt {
    padding: 0;
}
.detailed .score-parts > div + div,
.duel-group li + li {
    border-top: 1px solid #91c89924;
}
.score-total {
    background: #b6efa318 !important;
    color: #e2ffab;
    font-size: 0.98rem;
    font-weight: 800;
}
.duel-group h3 {
    margin: 0 0 0.32rem;
    color: #dbf6cb;
    font-weight: 720;
}
.duel-group li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    overflow-wrap: anywhere;
}
.opponent {
    --player-avatar-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
}
.duel-group b {
    font-variant-numeric: tabular-nums;
}
.positive {
    color: #c2f5ab;
}
.negative {
    color: #ffbbab;
}
</style>
