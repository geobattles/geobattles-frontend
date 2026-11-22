<template>
    <span v-if="indicator" class="player-powerups">
        <span v-if="indicator.doubleScore" class="powerup-chip boost" title="Double Score · base points doubled this round"
            ><span aria-hidden="true">×2</span><span class="sr-only">Double Score</span></span
        >
        <span v-if="indicator.duels" class="powerup-chip" :class="{ danger: indicator.attackingYou }" :title="indicator.attackingYou ? 'Attacking you' : 'Outgoing Duel'">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 3 1 4 6.5 6.5M13 3l-1 4-6.5 6.5M3 10l3 3m7-3-3 3" /></svg>
            <span class="sr-only">{{ indicator.attackingYou ? "Attacking you" : "Duel" }}</span>
            <span v-if="indicator.duels > 1">{{ indicator.duels }}</span>
        </span>
        <span v-if="indicator.incoming" class="powerup-chip danger" title="Under attack · incoming Duel">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="4" />
                <path d="M8 2v3m0 6v3M2 8h3m6 0h3" />
            </svg>
            <span class="sr-only">Under attack</span>
            <span v-if="indicator.incoming > 1">{{ indicator.incoming }}</span>
        </span>
    </span>
</template>
<script setup lang="ts">
import type { LivePowerupIndicator } from "~/composables/useLivePowerupIndicators";
defineProps<{ indicator?: LivePowerupIndicator }>();
</script>
<style scoped>
.player-powerups {
    display: inline-flex;
    flex: none;
    gap: var(--powerup-badge-gap, 3px);
    white-space: nowrap;
}
.powerup-chip {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    block-size: var(--powerup-badge-size, 0.95rem);
    min-inline-size: var(--powerup-badge-size, 0.95rem);
    padding-inline: 2px;
    border-radius: 3px;
    background: #88ab992b;
    color: #cce0d3;
    font: 700 calc(var(--powerup-badge-size, 0.95rem) * 0.66) / 1 var(--gb-font-mono);
    font-variant-numeric: tabular-nums;
}
.powerup-chip svg {
    width: 1.05em;
    height: 1.05em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.65;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.boost {
    color: var(--gb-success);
    background: #70d9af24;
}
.danger {
    color: #ffc3bd;
    background: #e88c8130;
}
</style>
