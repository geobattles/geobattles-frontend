<template>
    <span v-if="indicator" class="player-powerups">
        <span v-if="indicator.doubleScore" class="powerup-chip boost" title="Double Score · base points doubled this round"
            ><span aria-hidden="true">×2</span><span class="sr-only">Double Score</span></span
        >
        <span v-if="indicator.targets.length" class="powerup-chip" :class="{ danger: attackingYou }" :title="outgoing">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 3 1 4 6.5 6.5M13 3l-1 4-6.5 6.5M3 10l3 3m7-3-3 3" /></svg>
            <span class="sr-only">{{ outgoing }}</span>
        </span>
        <span v-if="indicator.attackers.length" class="powerup-chip danger" :title="incoming">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="4" />
                <path d="M8 2v3m0 6v3M2 8h3m6 0h3" />
            </svg>
            <span class="sr-only">{{ incoming }}</span>
            <span v-if="indicator.attackers.length > 1">{{ indicator.attackers.length }}</span>
        </span>
    </span>
</template>
<script setup lang="ts">
import type { LivePowerupIndicator } from "~/composables/useLivePowerupIndicators";
const props = defineProps<{ indicator?: LivePowerupIndicator }>();
const player = usePlayerInfo();
const { getPlayerNameFromID } = usePlayerLookup();
const attackingYou = computed(() => props.indicator?.targets.includes(player.value.ID ?? ""));
const outgoing = computed(() => "Challenged " + props.indicator?.targets.map(getPlayerNameFromID).join(", "));
const incoming = computed(() => "Challenged by " + props.indicator?.attackers.map(getPlayerNameFromID).join(", "));
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
