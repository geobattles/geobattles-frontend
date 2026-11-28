<template>
    <span v-if="hasVisibleChip" class="player-powerups">
        <span v-if="indicator?.doubleScore" class="powerup-chip boost" title="Double Score · base points doubled this round"
            ><span aria-hidden="true">×2</span><span class="sr-only">Double Score</span></span
        >
        <span v-if="showOutgoing" class="powerup-chip duel-out" :class="{ danger: attackingYou }" :title="outgoing">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 3 1 4 6.5 6.5M13 3l-1 4-6.5 6.5M3 10l3 3m7-3-3 3" /></svg>
            <span class="sr-only">{{ outgoing }}</span>
        </span>
        <span v-if="showIncoming" class="powerup-chip" :class="{ danger: isOwnRow || !personalOnly }" :title="incoming">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="4" />
                <path d="M8 2v3m0 6v3M2 8h3m6 0h3" />
            </svg>
            <span class="sr-only">{{ incoming }}</span>
            <span v-if="incomingCount > 1">{{ incomingCount }}</span>
        </span>
    </span>
</template>
<script setup lang="ts">
import type { LivePowerupIndicator } from "~/composables/useLivePowerupIndicators";
const props = defineProps<{ indicator?: LivePowerupIndicator; playerId?: string }>();
const player = usePlayerInfo();
const { lobbySettings } = useLobbyState();
const { getPlayerNameFromID } = usePlayerLookup();
const ownId = computed(() => player.value.ID ?? "");
const personalOnly = computed(() => Boolean(props.playerId && ownId.value && !lobbySettings.value?.spectating));
const isOwnRow = computed(() => Boolean(props.playerId && ownId.value && props.playerId === ownId.value));
const attackingYou = computed(() => Boolean(ownId.value && props.indicator?.targets.includes(ownId.value)));
const targetedByYou = computed(() => Boolean(ownId.value && props.indicator?.attackers.includes(ownId.value)));
const showOutgoing = computed(() => {
    const count = props.indicator?.targets.length ?? 0;
    if (!count) return false;
    if (!personalOnly.value) return true;
    return !isOwnRow.value && attackingYou.value;
});
const showIncoming = computed(() => {
    const count = props.indicator?.attackers.length ?? 0;
    if (!count) return false;
    if (!personalOnly.value) return true;
    return !isOwnRow.value && targetedByYou.value;
});
const incomingCount = computed(() => (!personalOnly.value ? (props.indicator?.attackers.length ?? 0) : 1));
const hasVisibleChip = computed(() => Boolean(props.indicator?.doubleScore || showOutgoing.value || showIncoming.value));
const outgoing = computed(() => "Challenged " + props.indicator?.targets.map(getPlayerNameFromID).join(", "));
const incoming = computed(() => "Challenged by " + props.indicator?.attackers.map(getPlayerNameFromID).join(", "));
</script>
<style scoped>
.player-powerups {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: var(--powerup-badge-gap, 4px);
    white-space: nowrap;
}
.powerup-chip {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.22rem;
    block-size: var(--powerup-badge-size, 1.05rem);
    min-inline-size: var(--powerup-badge-size, 1.05rem);
    padding-inline: 0.34rem;
    border: 1px solid #9ccab440;
    border-radius: 999px;
    background: #14362cb8;
    color: #d3e7db;
    font: 750 calc(var(--powerup-badge-size, 1.05rem) * 0.64) / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
}
.powerup-chip svg {
    width: 0.92em;
    height: 0.92em;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.boost {
    border-color: #70d9af5c;
    color: #96f2c9;
    background: #70d9af1f;
}
.danger {
    border-color: #ff998966;
    color: #ffd0c7;
    background: #ff7e6b29;
}
</style>
