<template>
    <svg v-if="type === 0" class="powerup-art boost-art" viewBox="0 0 200 104" fill="none" aria-hidden="true">
        <path d="M20 84H178M20 52H178M20 20H178" stroke="var(--gb-success)" stroke-opacity=".18" stroke-dasharray="2 6" />
        <path d="M27 85H91Q112 85 112 68T92 51H78Q61 51 61 37T80 23H163" stroke="var(--gb-bg)" stroke-width="18" stroke-linecap="round" />
        <path d="M27 85H91Q112 85 112 68T92 51H78Q61 51 61 37T80 23H163" stroke="var(--gb-success)" stroke-width="2" stroke-dasharray="7 4" />
        <circle cx="29" cy="85" r="5" fill="var(--gb-accent)" stroke="var(--gb-bg)" stroke-width="2" />
        <g class="score-comet" fill="var(--gb-accent)"><path d="m124 9 14 14-14 14h9l14-14-14-14zm18 0 14 14-14 14h9l14-14-14-14z" /></g>
    </svg>
    <svg v-else class="powerup-art duel-art" viewBox="0 0 200 104" fill="none" aria-hidden="true">
        <ellipse cx="100" cy="87" rx="76" ry="12" stroke="var(--gb-success)" stroke-opacity=".3" />
        <ellipse cx="100" cy="87" rx="54" ry="6" fill="#101e19" opacity=".6" />
        <g class="rival rival-left">
            <path d="M27 73 35 37 58 24 81 37 89 73 58 88Z" fill="#204533" stroke="var(--gb-success)" stroke-width="1.5" />
            <circle cx="58" cy="46" r="11" fill="#b4edd3" />
            <path d="M39 73C39 52 77 52 77 73" fill="#62b78e" />
            <path d="m39 30 8-10M28 43l-10-2" stroke="var(--gb-success)" stroke-width="2" stroke-linecap="round" />
        </g>
        <g class="rival rival-right">
            <path d="M111 73 119 37 142 24 165 37 173 73 142 88Z" fill="#742d41" stroke="#ffaaa1" stroke-width="1.5" />
            <circle cx="142" cy="46" r="11" fill="#ffd5c7" />
            <path d="M123 73C123 52 161 52 161 73" fill="#ee766b" />
            <path d="m161 30-8-10M172 43l10-2" stroke="#ffaaa1" stroke-width="2" stroke-linecap="round" />
        </g>
        <path class="duel-spark" d="m101 34-11 22h9l-1 16 13-24h-10Z" fill="#fff1c9" />
    </svg>
</template>
<script setup lang="ts">
import type { PowerupType } from "~/types/powerups";
defineProps<{ type: PowerupType }>();
</script>
<style scoped>
.powerup-art {
    display: block;
    width: 100%;
    height: 104px;
    overflow: visible;
}
.score-comet {
    animation: score-climb 420ms ease-out;
}
.rival-left {
    animation: rival-left 420ms ease-out;
}
.rival-right {
    animation: rival-right 420ms ease-out;
}
.duel-spark {
    animation: duel-glow 420ms ease-out;
}
@keyframes score-climb {
    from {
        transform: translateX(-8px);
    }
}
@keyframes rival-left {
    from {
        transform: translateX(-5px);
    }
}
@keyframes rival-right {
    from {
        transform: translateX(5px);
    }
}
@keyframes duel-glow {
    from {
        opacity: 0.65;
    }
}
@media (max-width: 850px), (max-width: 1100px) and (pointer: coarse) {
    .powerup-art {
        width: 75%;
        height: 78px;
    }
}
@media (prefers-reduced-motion: reduce) {
    .powerup-art * {
        animation: none;
    }
}
</style>
