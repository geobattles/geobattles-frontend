<template>
    <section ref="screen" class="countdown-screen" :class="{ 'has-standings': standings.length > 0, 'countdown-light': light }" :aria-labelledby="titleId">
        <div class="scenic-layer" aria-hidden="true">
            <picture>
                <source media="(max-width: 800px) and (orientation: portrait)" srcset="/images/emerald-horizon-portrait.webp" />
                <img src="/images/emerald-horizon.webp" width="1672" height="941" alt="" fetchpriority="high" />
            </picture>
            <div class="scene-shade" />
            <div class="scene-contours" />
        </div>
        <div class="countdown-brand">
            <img src="/images/emerald-mark.svg" width="30" height="32" alt="" />
            <span>Geo<b>Battles</b></span>
        </div>
        <div class="countdown-stage">
            <header class="round-heading">
                <h1 :id="titleId" :aria-label="roundCount ? `Round ${round} of ${roundCount} starting` : `Round ${round} starting`">
                    <span class="round-number">
                        Round {{ round }}<small v-if="roundCount"> / {{ roundCount }}</small>
                    </span>
                    <em>Starting</em>
                </h1>
            </header>
            <div class="orbit-slot">
                <GameplayCountdownOrbit :seconds="seconds" :light="light" />
                <p class="sr-only" role="status" aria-atomic="true">
                    {{ seconds ? `${seconds} ${seconds === 1 ? "second" : "seconds"} until the round starts` : "" }}
                </p>
            </div>
            <GameplayCountdownLeaderboard v-if="standings.length" class="standings-slot" :rows="standings" />
        </div>
    </section>
</template>

<script setup lang="ts">
import { rankTotalResults } from "~/utils/resultUtils";

const props = defineProps<{ remaining: () => number }>();
const titleId = useId();
const screen = useTemplateRef<HTMLElement>("screen");
const { lobbySettings } = useLobbyState();
const totals = useTotalResults();
const round = computed(() => lobbySettings.value?.currentRound ?? 1);
const roundCount = computed(() => lobbySettings.value?.conf.numRounds);
const standings = computed(() => (round.value > 1 ? rankTotalResults(totals.value).slice(0, 3) : []));
const { seconds, light } = useCountdown(() => props.remaining(), screen);
</script>

<style scoped>
.countdown-screen {
    --countdown-beat: 0;
    --countdown-progress: 0;
    --globe-size: 40rem;
    --screen-inline: clamp(1rem, 4.2vw, 4.5rem);
    --screen-block: clamp(0.85rem, 4.4dvh, 3rem);
    --reveal-center: 50% 55%;
    position: fixed;
    z-index: 44;
    isolation: isolate;
    inset: var(--gb-screen-top, 0px) 0 auto;
    height: var(--gb-viewport-height);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: clamp(0.5rem, 2dvh, 1.25rem);
    overflow: hidden;
    padding: max(var(--screen-block), env(safe-area-inset-top)) max(var(--screen-inline), env(safe-area-inset-right)) max(var(--screen-block), env(safe-area-inset-bottom))
        max(var(--screen-inline), env(safe-area-inset-left));
    background: #0b2825;
    color: var(--gb-text);
}
.countdown-screen.has-standings {
    --reveal-center: 67% 57%;
}
.scenic-layer,
.scenic-layer picture,
.scenic-layer img,
.scene-shade,
.scene-contours {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
.scenic-layer {
    z-index: -1;
}
.scenic-layer img {
    object-fit: cover;
    object-position: 58% 55%;
}
.scene-shade {
    background:
        radial-gradient(ellipse at var(--reveal-center), #467e5021, transparent 62%), linear-gradient(90deg, #031c1869, #07292033 53%, #061e1626),
        linear-gradient(180deg, #071d1ad6, #0b2b256e 28%, #09282224 70%, #041e1b18);
}
.scene-contours {
    background: url("/images/atlas-relief.svg") center / cover no-repeat;
    mask-image: radial-gradient(ellipse at 68% 47%, #000 15%, #000b 38%, transparent 85%);
    opacity: 0.45;
}
.countdown-brand {
    display: flex;
    align-items: center;
    gap: 0.58rem;
    justify-self: start;
    font: italic 900 clamp(1.05rem, 1.65vw, 1.5rem) / 1 var(--gb-font-display);
    letter-spacing: -0.055em;
    text-shadow: 0 2px 12px #001b15;
}
.countdown-brand img {
    display: block;
    width: clamp(1.3rem, 2.5vw, 2rem);
    height: auto;
}
.countdown-brand b {
    color: #c9ef8d;
}
.countdown-stage {
    align-self: center;
    justify-self: center;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas:
        "heading"
        "orbit";
    inline-size: min(100%, 69rem);
    block-size: min(100%, 47rem);
    min-block-size: 0;
    min-inline-size: 0;
    gap: clamp(0.45rem, 2.2dvh, 1.25rem) clamp(1rem, 3.8vw, 4rem);
}
.has-standings .countdown-stage {
    grid-template-columns: minmax(0, 0.87fr) minmax(0, 1.13fr);
    grid-template-rows: minmax(0, 0.68fr) auto auto minmax(0, 1.32fr);
    grid-template-areas:
        ". orbit"
        "heading orbit"
        "standings orbit"
        ". orbit";
    padding-block-end: clamp(0rem, 6dvh, 3.5rem);
}
.round-heading {
    grid-area: heading;
    justify-self: center;
    text-align: center;
    text-shadow: 0 3px 14px #021611e0;
}
.has-standings .round-heading {
    justify-self: stretch;
    text-align: start;
}
.round-heading h1 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 0.12em 0.34em;
    font: italic 900 clamp(1.6rem, 3.1vw, 3.15rem) / 1.05 var(--gb-font-display);
    letter-spacing: -0.035em;
    text-transform: uppercase;
}
.has-standings .round-heading h1 {
    justify-content: start;
}
.round-number {
    white-space: nowrap;
}
.round-number small {
    margin-inline-start: 0.2em;
    color: #d8e9cd;
    font: 650 0.44em / 1 var(--gb-font-mono);
    letter-spacing: 0;
    vertical-align: 0.24em;
}
.round-heading em {
    color: #d0f58e;
}
.round-heading::after {
    display: block;
    block-size: 2px;
    inline-size: min(100%, 28rem);
    margin: clamp(0.5rem, 2.1dvh, 1.2rem) auto 0;
    background: linear-gradient(90deg, transparent, #c7fb8d 34%, #f1ffd9 49%, #b5f186 64%, transparent);
    box-shadow: 0 0 13px #c3fb7360;
    content: "";
}
.has-standings .round-heading::after {
    margin-inline: 0;
    background: linear-gradient(90deg, #daffa6, #efffd6 28%, #92da7b9c 56%, transparent);
}
.orbit-slot {
    grid-area: orbit;
    display: grid;
    place-items: center;
    min-block-size: 0;
    min-inline-size: 0;
    container-type: size;
}
.standings-slot {
    grid-area: standings;
}
.round-reveal-leave-active {
    transition: opacity 210ms ease-out;
    pointer-events: none;
}
.round-reveal-leave-active .orbit-slot {
    --countdown-beat: 1;
    --countdown-progress: 1;
}
.round-reveal-leave-to {
    opacity: 0;
}
@media (prefers-reduced-motion: no-preference) {
    .scenic-layer picture {
        transform: scale(calc(1.025 + var(--countdown-progress) * 0.027));
        transform-origin: var(--reveal-center);
    }
    .countdown-light .scenic-layer picture {
        transform: none;
    }
    .round-reveal-leave-active:not(.countdown-light)::after {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at var(--reveal-center), #d4ffa54d, #9ff29d14 24%, transparent 52%);
        animation: reveal-glow 210ms ease-out both;
        content: "";
    }
    @keyframes reveal-glow {
        0% {
            opacity: 0.25;
            transform: scale(0.94);
        }
        40% {
            opacity: 0.8;
        }
        100% {
            opacity: 0;
            transform: scale(1.15);
        }
    }
}
@media (prefers-reduced-motion: reduce) {
    .round-reveal-leave-active {
        transition-duration: 100ms;
    }
}
@media (orientation: portrait) {
    .countdown-screen,
    .countdown-screen.has-standings {
        --screen-inline: clamp(0.9rem, 5vw, 2.75rem);
        --screen-block: clamp(0.85rem, 3.2dvh, 2rem);
        --reveal-center: 50% 46%;
    }
    .scenic-layer img {
        object-position: 50% 52%;
    }
    .scene-shade {
        background: linear-gradient(180deg, #061e1de6 3%, #0a2e28b3 27%, #0b2b2850 70%, #041c19bc);
    }
    .scene-contours {
        opacity: 0.37;
    }
    .countdown-stage,
    .has-standings .countdown-stage {
        block-size: min(100%, 53rem);
        padding-block-end: clamp(0.35rem, 2.2dvh, 1rem);
    }
    .has-standings .countdown-stage {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr) auto;
        grid-template-areas:
            "heading"
            "orbit"
            "standings";
    }
    .round-heading h1 {
        font-size: clamp(1.56rem, 6.7vw, 2.9rem);
    }
    .has-standings .round-heading {
        justify-self: center;
        text-align: center;
    }
    .has-standings .round-heading h1 {
        justify-content: center;
    }
    .has-standings .round-heading::after {
        margin-inline: auto;
        background: linear-gradient(90deg, transparent, #d9fa9f, transparent);
    }
    .standings-slot {
        justify-self: center;
    }
}
@media (max-height: 520px) and (orientation: landscape) {
    .countdown-screen {
        --screen-inline: clamp(0.8rem, 4vw, 2.3rem);
        --screen-block: clamp(0.45rem, 2.3dvh, 0.8rem);
        gap: 0.4rem;
    }
    .countdown-brand {
        font-size: 1rem;
    }
    .countdown-brand img {
        width: 1.25rem;
    }
    .countdown-stage {
        inline-size: min(100%, 54rem);
        gap: 0.55rem clamp(0.8rem, 3vw, 2.25rem);
    }
    .has-standings .countdown-stage {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr) auto auto minmax(0, 1fr);
        padding-block-end: 0;
    }
    .round-heading h1 {
        font-size: clamp(1.15rem, min(4.4vw, 7dvh), 2.25rem);
    }
    .round-heading::after {
        margin-block-start: 0.45rem;
    }
    .scene-contours {
        opacity: 0.38;
    }
    .scenic-layer picture {
        transform: none;
    }
}
</style>
