<template>
    <div class="countdown-orbit" :class="{ 'orbit-light': light }" aria-hidden="true">
        <div class="planet">
            <img src="/images/emerald-countdown-earth.webp" width="800" height="800" alt="" fetchpriority="high" />
        </div>
        <svg class="orbital-rings" viewBox="0 0 640 640" fill="none" focusable="false">
            <defs>
                <radialGradient :id="dial">
                    <stop stop-color="#08251d" stop-opacity=".9" />
                    <stop offset=".77" stop-color="#0c2d23" stop-opacity=".68" />
                    <stop offset="1" stop-color="#16392c" stop-opacity=".36" />
                </radialGradient>
                <linearGradient :id="track" x1="15%" y1="0" x2="85%" y2="100%">
                    <stop stop-color="#e5ffd0" stop-opacity=".7" />
                    <stop offset=".52" stop-color="#a2ed8d" stop-opacity=".22" />
                    <stop offset="1" stop-color="#a2ed8d" stop-opacity=".48" />
                </linearGradient>
                <linearGradient :id="arc" x1="4%" y1="88%" x2="82%" y2="5%">
                    <stop stop-color="#57cba2" />
                    <stop offset=".6" stop-color="#b3f273" />
                    <stop offset="1" stop-color="#efffbc" />
                </linearGradient>
            </defs>
            <circle cx="320" cy="367" r="252" stroke="#afd589" stroke-opacity=".22" />
            <circle cx="320" cy="367" r="234" stroke="#a0e6a0" stroke-opacity=".15" />
            <circle cx="320" cy="367" r="217" :fill="`url(#${dial})`" :stroke="`url(#${track})`" stroke-width="2" />
            <circle cx="320" cy="367" r="184" pathLength="288" stroke="#c9f4a8" stroke-opacity=".56" stroke-width="3.2" stroke-dasharray=".6 3.4" />
            <circle cx="320" cy="367" r="183" pathLength="48" stroke="#e3ffb8" stroke-opacity=".69" stroke-width="6" stroke-dasharray=".16 3.84" />
            <g transform="rotate(-90 320 367)">
                <circle class="beat-arc" cx="320" cy="367" r="217" pathLength="100" :stroke="`url(#${arc})`" stroke-width="5" stroke-linecap="round" />
                <circle class="flare-trail" cx="320" cy="367" r="217" pathLength="100" stroke="#cfff8f" stroke-width="14" stroke-linecap="round" />
            </g>
        </svg>
        <div class="beat-pulse" />
        <div class="secondary-flare" />
        <div class="primary-flare" />
        <div class="numeral-center">
            <span v-if="seconds > 0" class="countdown-numeral">{{ seconds }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ seconds: number; light: boolean }>();
const id = useId();
const dial = id + "-dial";
const track = id + "-track";
const arc = id + "-arc";
</script>

<style scoped>
.countdown-orbit {
    --beat-light: max(0, 1 - var(--countdown-beat) * 3.6);
    --arc-length: calc(100 * var(--countdown-beat));
    --trail-length: min(18, var(--arc-length));
    position: relative;
    isolation: isolate;
    inline-size: min(100cqw, 100cqh, var(--globe-size));
    aspect-ratio: 1;
    container-type: inline-size;
}
.countdown-orbit::before {
    position: absolute;
    z-index: -1;
    inset: 0 -5% -5%;
    background: radial-gradient(ellipse 48% 18% at 50% 82%, #a6f98832, #56c68415 42%, transparent);
    opacity: calc(0.48 + var(--countdown-progress) * 0.52);
    content: "";
}
.planet,
.orbital-rings,
.numeral-center {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.planet {
    background: radial-gradient(circle at 49% 49%, #193e36 0 43%, #5d9d7448 46%, transparent 47%);
    mask-image: linear-gradient(#000 8%, #000e 30%, #0009 61%, transparent 94%);
}
.planet img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.orbital-rings {
    overflow: visible;
}
.beat-arc {
    stroke-dasharray: 100;
    stroke-dashoffset: calc(100 - var(--arc-length));
    opacity: calc(0.83 + var(--countdown-progress) * 0.17);
}
.flare-trail {
    stroke-dasharray: var(--trail-length) 100;
    stroke-dashoffset: calc(var(--trail-length) - var(--arc-length));
    opacity: calc(0.12 + var(--beat-light) * 0.13 + var(--countdown-progress) * 0.08);
}
.primary-flare,
.secondary-flare,
.beat-pulse {
    /* Match the SVG dial (center 320, 367 and radius 217 in a 640px viewBox). */
    --ring-top: 23.4375%;
    --ring-side: 16.09375%;
    position: absolute;
    inset: var(--ring-top) var(--ring-side) auto;
    aspect-ratio: 1;
    border-radius: 50%;
}
.primary-flare::before,
.secondary-flare::before {
    position: absolute;
    inset: 0 auto auto 50%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    content: "";
}
.primary-flare {
    transform: rotate(calc(360deg * var(--countdown-beat)));
    opacity: calc(0.65 + var(--beat-light) * 0.16 + var(--countdown-progress) * 0.19);
}
.primary-flare::before {
    width: 11cqw;
    background: radial-gradient(circle, #fbffe0 0 9%, #eaffb9db 14%, #c6fa8c62 29%, transparent 70%), radial-gradient(ellipse 48% 16%, #ffffd57d, transparent);
}
.secondary-flare {
    --ring-top: 17.96875%;
    --ring-side: 10.625%;
    transform: rotate(calc(-60deg - 160deg * var(--countdown-progress)));
    opacity: 0.62;
}
.secondary-flare::before {
    width: 5.4cqw;
    background: radial-gradient(circle, #d7ffce 0 9%, #b3f3b4ad 15%, #80edb83c 36%, transparent 70%);
}
.secondary-flare::after {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: conic-gradient(from -54deg, #7decbc00, #7decba8c 52deg, transparent 54deg);
    mask-image: radial-gradient(closest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px), transparent);
    content: "";
}
.beat-pulse {
    border: 1px solid #d8ffa0;
    opacity: calc(0.43 * var(--beat-light));
    transform: scale(calc(1 + min(0.14, 0.42 * var(--countdown-beat))));
}
.numeral-center {
    display: grid;
    place-items: center;
    padding-block-start: 14.6875%;
}
.countdown-numeral {
    display: block;
    padding-inline: 0.12em 0.17em;
    background: linear-gradient(155deg, #f4ffdb 7%, #deffa6 37%, #b3ed79 73%, #84d18b 100%);
    background-clip: text;
    color: #ddffac;
    font:
        italic 900 55cqw / 0.93 system-ui,
        sans-serif;
    font-variant-numeric: tabular-nums;
    -webkit-text-fill-color: transparent;
    -webkit-text-stroke: 0.004em #eaffe1a0;
    filter: drop-shadow(0 0.03em 0.043em #071e11cc) drop-shadow(0 0 0.042em #c5fd7070);
    opacity: clamp(0.68, 0.68 + min(3 * var(--countdown-beat), 4.5 * (1 - var(--countdown-beat))), 1);
    transform: scale(calc(0.955 + min(0.045, 0.34 * var(--countdown-beat))));
}
.orbit-light :is(.secondary-flare, .flare-trail, .beat-pulse) {
    display: none;
}
.orbit-light .beat-arc {
    stroke-dashoffset: 0;
    opacity: 0.58;
}
.orbit-light .countdown-numeral {
    background: none;
    color: #ddffac;
    -webkit-text-fill-color: currentColor;
    -webkit-text-stroke: 0;
    text-shadow: 0 0.03em 0.06em #061c18;
    filter: none;
    opacity: 1;
    transform: none;
}
@media (prefers-reduced-motion: no-preference) {
    .orbit-light .primary-flare {
        animation: rotate-countdown-flare 1s linear var(--countdown-delay, 0s) infinite;
    }
    @keyframes rotate-countdown-flare {
        from {
            transform: rotate(0turn);
        }
        to {
            transform: rotate(1turn);
        }
    }
}
@media (prefers-reduced-motion: reduce) {
    .primary-flare,
    .secondary-flare,
    .beat-pulse,
    .flare-trail {
        display: none;
    }
    .beat-arc {
        stroke-dashoffset: 0;
        opacity: 0.52;
    }
    .countdown-numeral {
        opacity: 1;
        transform: none;
    }
}
@media (forced-colors: active) {
    .countdown-numeral,
    .orbit-light .countdown-numeral {
        -webkit-text-fill-color: CanvasText;
        -webkit-text-stroke: 0;
        filter: none;
    }
}
</style>
