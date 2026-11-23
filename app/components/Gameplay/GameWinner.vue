<template>
    <dialog
        ref="dialog"
        class="champion-reveal"
        :style="{ '--reveal-duration': duration + 'ms' }"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="`${id}-names ${id}-score`"
        @cancel.prevent="dismiss"
        @close="dismiss"
    >
        <div class="reveal-scene" aria-hidden="true">
            <picture class="reveal-sky">
                <source media="(orientation: portrait)" srcset="/images/emerald-horizon-portrait.webp" />
                <img src="/images/emerald-horizon.webp" width="1672" height="941" alt="" fetchpriority="high" />
            </picture>
            <div class="reveal-shade"></div>
            <div class="reveal-contours"></div>
            <div class="reveal-sunlight"></div>
        </div>
        <div class="reveal-frame">
            <header class="reveal-header">
                <span class="reveal-brand"
                    ><img src="/images/emerald-mark.svg" width="30" height="32" alt="" /><span>Geo<b>Battles</b></span></span
                >
                <button type="button" class="reveal-skip" autofocus aria-label="Skip celebration and view standings" @click="dismiss">Skip <UiIcon name="arrow" /></button>
            </header>
            <div class="reveal-stage">
                <div class="reveal-visual" aria-hidden="true">
                    <div class="reveal-horizon"></div>
                    <div class="reveal-globe">
                        <img src="/images/emerald-countdown-earth.webp" width="800" height="800" alt="" fetchpriority="high" />
                    </div>
                    <div class="reveal-orbits">
                        <svg viewBox="0 0 400 400" fill="none">
                            <circle cx="200" cy="200" r="161" stroke="#b9f4a2" stroke-opacity=".47" stroke-dasharray="2 6" />
                            <circle cx="200" cy="200" r="176" stroke="#f5c76a" stroke-opacity=".38" />
                            <ellipse cx="200" cy="200" rx="191" ry="68" transform="rotate(-24 200 200)" stroke="#ffe3a1" stroke-opacity=".9" />
                            <ellipse cx="200" cy="200" rx="192" ry="87" transform="rotate(26 200 200)" stroke="#a4f3bf" stroke-opacity=".5" />
                            <path d="M200 11v25m0 328v25M11 200h25m328 0h25" stroke="#c2efb7" stroke-opacity=".55" />
                        </svg>
                        <div class="reveal-orbit-flare"></div>
                    </div>
                    <div class="reveal-halo"></div>
                    <div class="reveal-beam"></div>
                    <div class="reveal-cup"><GameplayChampionTrophy /></div>
                    <div class="reveal-embers">
                        <i v-for="index in 18" :key="index" :style="emberStyle(index)"></i>
                    </div>
                </div>
                <div class="reveal-identity" :class="{ 'has-many-leaders': leaders.length > 2, 'has-long-name': longName }">
                    <div class="reveal-eyebrow"><span></span><UiIcon :name="solo ? 'compass' : 'trophy'" /><span></span></div>
                    <h2 :id="`${id}-title`">{{ solo ? "Expedition Complete" : leaders.length === 1 ? "GeoBattles Champion" : "GeoBattles Champions" }}</h2>
                    <ul :id="`${id}-names`" class="reveal-leaders" role="list" :tabindex="leaders.length > 2 ? 0 : undefined">
                        <li v-for="leader in leaders" :key="leader.id">{{ leader.name }}</li>
                    </ul>
                    <p :id="`${id}-score`" class="reveal-score">
                        <strong>{{ points.toLocaleString() }}</strong> {{ leaders.length > 1 ? "points each" : "points" }}
                    </p>
                </div>
            </div>
            <div class="reveal-progress" aria-hidden="true"><span></span></div>
        </div>
    </dialog>
</template>

<script setup lang="ts">
import type { ChampionIdentity } from "~/composables/useWinnerCeremony";

const props = defineProps<ChampionIdentity>();
const emit = defineEmits<{ dismiss: [] }>();
const id = useId();
const dialog = useTemplateRef("dialog");
const duration = 5000;
const longName = computed(() => props.leaders.length > 1 || props.leaders.some(({ name }) => name.length > 16));
const emberStyle = (index: number) => ({
    "--bearing": `${index * 137.5}deg`,
    "--travel": `${82 + ((index * 29) % 66)}%`,
    "--spark-size": `${2 + (index % 3)}px`,
});

let deadline = 0;
let timeout: ReturnType<typeof setTimeout> | undefined;
let closed = false;
const dismiss = () => {
    if (closed) return;
    closed = true;
    emit("dismiss");
};
const resume = () => {
    if (!document.hidden && Date.now() >= deadline) dismiss();
};
onMounted(() => {
    dialog.value?.showModal();
    deadline = Date.now() + duration;
    timeout = setTimeout(dismiss, duration);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
});
onBeforeUnmount(() => {
    closed = true;
    clearTimeout(timeout);
    document.removeEventListener("visibilitychange", resume);
    window.removeEventListener("pageshow", resume);
    dialog.value?.close();
});
</script>

<style scoped>
.champion-reveal {
    --champion-gold: #f5c76a;
    --champion-light: #ffeab0;
    --sun-x: 66%;
    --sun-y: 47%;
    --reveal-inset: clamp(0.7rem, 3.6vw, 3.8rem);
    position: fixed;
    isolation: isolate;
    inset: var(--gb-screen-top, 0px) 0 auto;
    width: 100%;
    height: var(--gb-viewport-height);
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    background: #021a16;
    color: #f8fafc;
}
.champion-reveal::backdrop {
    background: #021a16;
}
.reveal-scene,
.reveal-sky,
.reveal-shade,
.reveal-contours,
.reveal-sunlight {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.reveal-scene {
    z-index: -1;
    overflow: hidden;
}
.reveal-sky {
    transform-origin: var(--sun-x) var(--sun-y);
}
.reveal-sky img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 58% 53%;
}
.reveal-shade {
    background: linear-gradient(90deg, #021412ec 0%, #022823a3 42%, #02272338 72%, #021b1b60), linear-gradient(180deg, #0218179c 0%, transparent 36%, #041b1a73 74%, #021210e6);
}
.reveal-contours {
    background: url("/images/atlas-relief.svg") right center / min(100%, 76rem) auto no-repeat;
    opacity: 0.62;
    mask-image: linear-gradient(112deg, transparent 8%, #000 48%, transparent 100%);
}
.reveal-sunlight {
    background:
        radial-gradient(ellipse 46% 16% at var(--sun-x) var(--sun-y), #ffcd6673, #d8ab4f14 65%, transparent),
        radial-gradient(ellipse 44% 32% at var(--sun-x) var(--sun-y), #f8cc7544, transparent 80%);
}
.reveal-frame {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: clamp(0.4rem, 1.8dvh, 1.2rem);
    width: min(100%, 98rem);
    height: 100%;
    margin-inline: auto;
    padding: max(0.45rem, env(safe-area-inset-top)) max(var(--reveal-inset), env(safe-area-inset-right)) max(clamp(0.62rem, 2.9dvh, 1.8rem), env(safe-area-inset-bottom))
        max(var(--reveal-inset), env(safe-area-inset-left));
}
.reveal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
}
.reveal-brand {
    display: flex;
    align-items: center;
    gap: 0.48rem;
    font: italic 900 clamp(1.1rem, 2vw, 1.56rem) / 1 var(--gb-font-display);
    letter-spacing: -0.045em;
}
.reveal-brand img {
    width: clamp(1.15rem, 2.7vw, 1.85rem);
    height: auto;
}
.reveal-brand b {
    color: #e3fb9b;
}
.reveal-skip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding-inline: 0.85rem;
    border: 1px solid #e2eec04f;
    border-radius: 999px;
    background: #04261fb0;
    color: #f2fae6;
    font-size: 0.83rem;
    font-weight: 700;
}
.reveal-skip:hover,
.reveal-skip:focus-visible {
    border-color: var(--champion-light);
}
.reveal-skip:focus-visible {
    outline-color: var(--champion-light);
    outline-offset: 2px;
}
.reveal-stage {
    display: grid;
    grid-template-columns: minmax(0, 0.98fr) minmax(0, 1.02fr);
    grid-template-areas: "identity trophy";
    align-items: center;
    gap: clamp(0.65rem, 3.2vw, 3.6rem);
    min-height: 0;
}
.reveal-visual {
    position: relative;
    grid-area: trophy;
    justify-self: center;
    width: min(100%, 78dvh, 41.5rem);
    aspect-ratio: 1;
}
.reveal-globe,
.reveal-horizon,
.reveal-orbits,
.reveal-halo,
.reveal-beam,
.reveal-cup,
.reveal-embers {
    position: absolute;
    pointer-events: none;
}
.reveal-globe {
    inset: 8%;
}
.reveal-globe img,
.reveal-orbits svg,
.reveal-cup svg {
    display: block;
    width: 100%;
    height: 100%;
}
.reveal-globe img {
    opacity: 0.87;
}
.reveal-horizon {
    inset: 57% -19% 2%;
    background: radial-gradient(ellipse 58% 54% at 50% 56%, #ffdc8396, #f5ab4e33 23%, #82dec035 43%, transparent 80%);
}
.reveal-orbits {
    inset: 0;
}
.reveal-orbit-flare {
    position: absolute;
    inset: 6%;
}
.reveal-orbit-flare::after {
    position: absolute;
    top: 14%;
    left: 12%;
    width: 5%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, #fffbe0 0 10%, #fff0b38f 28%, transparent 71%);
    content: "";
}
.reveal-beam {
    inset: -1% -2%;
    background: radial-gradient(ellipse 16% 59% at 50% 48%, #ffe39e73 5%, #f7b95b21 53%, transparent 72%);
}
.reveal-halo {
    inset: 17%;
    border: 1px solid #ffe7a563;
    border-radius: 50%;
    background: radial-gradient(circle, #fdd6880b 25%, #eabb4163 69%, #dcbf5633 74%, transparent 100%);
}
.reveal-cup {
    inset: 17% 18% 15%;
    isolation: isolate;
    transform-origin: 50% 84%;
}
.reveal-cup::before {
    position: absolute;
    z-index: -1;
    inset: -10%;
    background: radial-gradient(ellipse at 50% 54%, #f9cb7130, transparent 64%);
    content: "";
}
.reveal-embers {
    inset: 4%;
}
.reveal-embers i {
    position: absolute;
    inset: 11%;
    opacity: 0;
}
.reveal-embers i::before {
    position: absolute;
    top: 50%;
    left: var(--travel);
    width: var(--spark-size);
    aspect-ratio: 1;
    border-radius: 35%;
    background: #ffe5a3;
    box-shadow: 0 0 0.54rem #ffdd7dbb;
    content: "";
}
.reveal-identity {
    grid-area: identity;
    min-width: 0;
    min-height: 0;
    padding-block: 0.33rem;
    text-shadow: 0 3px 16px #001811b0;
}
.reveal-eyebrow {
    display: flex;
    align-items: center;
    gap: 0.62rem;
    width: fit-content;
    color: var(--champion-light);
    font-size: 1.12rem;
}
.reveal-eyebrow span {
    width: clamp(1.2rem, 4vw, 3.7rem);
    height: 1px;
    background: linear-gradient(90deg, #f6d17807, #ffe7a4);
}
.reveal-eyebrow span:last-child {
    scale: -1 1;
}
.reveal-identity h2 {
    margin-block: 0.58em 0.25em;
    color: var(--champion-light);
    font: 800 clamp(0.82rem, 2.1vw, 1.72rem) / 1.24 var(--gb-font-display);
    letter-spacing: clamp(0.08em, 0.37vw, 0.19em);
    text-transform: uppercase;
}
.reveal-leaders {
    display: grid;
    gap: 0.16em;
    max-height: min(46dvh, 23rem);
    margin: 0;
    padding: 0 0.08em 0.11em;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    color: #fff4d7;
    font: italic 900 clamp(2.65rem, 7.05vw, 7.8rem) / 0.98 var(--gb-font-display);
    letter-spacing: -0.052em;
    overflow-wrap: anywhere;
    list-style: none;
}
.reveal-leaders li {
    width: fit-content;
    max-width: 100%;
}
@supports (background-clip: text) {
    .reveal-leaders li {
        background: linear-gradient(105deg, #fff4d7 27%, #ffe08f 47%, #fff9e7 52%, #fff4d7 70%) 100% 0 / 230% 100%;
        background-clip: text;
        color: transparent;
        text-shadow: none;
    }
}
.has-long-name .reveal-leaders {
    font-size: clamp(1.85rem, 5.15vw, 5.55rem);
    line-height: 1.04;
}
.has-many-leaders .reveal-leaders {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.22em 0.64em;
    font-size: clamp(1.38rem, 3.05vw, 2.85rem);
}
.reveal-score {
    display: flex;
    align-items: baseline;
    gap: 0.58em;
    width: fit-content;
    margin-block-start: clamp(0.52rem, 2.1dvh, 1.15rem);
    padding-top: 0.44em;
    border-top: 1px solid #ffe8a767;
    color: var(--champion-light);
    font: 600 clamp(0.73rem, 1.4vw, 1.06rem) / 1.2 var(--gb-font-mono);
    text-transform: uppercase;
}
.reveal-score strong {
    color: var(--champion-gold);
    font-size: 1.52em;
    font-variant-numeric: tabular-nums;
}
.reveal-progress {
    width: min(21rem, 76%);
    height: 2px;
    margin-inline: auto;
    overflow: hidden;
    border-radius: 999px;
    background: #c8e2b13d;
}
.reveal-progress span {
    display: block;
    height: 100%;
    transform-origin: left;
    background: linear-gradient(90deg, #b5ea9e, var(--champion-light));
}
@media (orientation: portrait) {
    .champion-reveal {
        --sun-x: 50%;
        --sun-y: 41%;
    }
    .reveal-stage {
        grid-template: "trophy" minmax(0, 1fr) "identity" auto / minmax(0, 1fr);
        justify-items: center;
        max-height: 52rem;
        margin-block: auto;
    }
    .reveal-visual {
        width: min(92vw, 48dvh, 37rem);
    }
    .reveal-eyebrow,
    .reveal-score,
    .reveal-leaders li {
        margin-inline: auto;
    }
    .reveal-identity {
        width: 100%;
        text-align: center;
    }
    .reveal-leaders {
        max-height: min(25dvh, 12rem);
        font-size: clamp(2.3rem, 10vw, 5.8rem);
    }
    .reveal-shade {
        background: linear-gradient(180deg, #001b189c, #05251c4f 35%, #021815bf 66%, #021815f5 100%);
    }
    .has-long-name .reveal-leaders {
        font-size: clamp(1.85rem, 7.2vw, 4.2rem);
    }
    .has-many-leaders .reveal-leaders {
        font-size: clamp(1.22rem, 4.9vw, 2.45rem);
    }
}
@media (orientation: landscape) and (max-height: 500px) {
    .reveal-visual {
        width: min(100%, 73dvh);
    }
    .reveal-leaders {
        font-size: clamp(2.05rem, 6.35vw, 4.35rem);
    }
    .has-long-name .reveal-leaders {
        font-size: clamp(1.55rem, 4.85vw, 3.45rem);
    }
    .has-many-leaders .reveal-leaders {
        font-size: clamp(1.12rem, 3.2vw, 2.25rem);
    }
}
@media (pointer: coarse), (max-width: 700px) {
    .reveal-embers i:nth-child(n + 11) {
        display: none;
    }
}

/* All layers use the dialog's five-second clock. */
@media (prefers-reduced-motion: no-preference) {
    .champion-reveal[open],
    .champion-reveal[open]::backdrop {
        animation: reveal-handoff var(--reveal-duration) linear both;
    }
    .reveal-sky {
        animation: reveal-scene-in var(--reveal-duration) ease-out both;
    }
    .reveal-sunlight,
    .reveal-horizon,
    .reveal-contours {
        animation: reveal-light-rise var(--reveal-duration) ease-out both;
    }
    .reveal-globe {
        animation: reveal-world var(--reveal-duration) ease-out both;
    }
    .reveal-orbits {
        animation: reveal-rings var(--reveal-duration) ease-out both;
    }
    .reveal-orbit-flare {
        animation: reveal-orbit-travel var(--reveal-duration) linear both;
    }
    .reveal-beam,
    .reveal-halo {
        animation: reveal-gold var(--reveal-duration) ease-out both;
    }
    .reveal-cup {
        animation: reveal-cup-in var(--reveal-duration) ease-out both;
    }
    .reveal-eyebrow,
    .reveal-identity h2 {
        animation: reveal-title-in var(--reveal-duration) ease-out both;
    }
    .reveal-leaders,
    .reveal-score {
        animation: reveal-name-in var(--reveal-duration) ease-out both;
    }
    .reveal-leaders li {
        animation: reveal-letter-light var(--reveal-duration) ease-out both;
    }
    .reveal-embers i {
        animation: reveal-sparks var(--reveal-duration) ease-out both;
    }
    .reveal-progress span {
        animation: reveal-time var(--reveal-duration) linear both;
    }
}
@media (prefers-reduced-motion: reduce) {
    .reveal-progress,
    .reveal-embers,
    .reveal-orbit-flare {
        visibility: hidden;
    }
}
@keyframes reveal-handoff {
    0%,
    91% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
@keyframes reveal-scene-in {
    0% {
        opacity: 0.15;
        scale: 1.02;
    }
    12% {
        opacity: 0.83;
    }
    28%,
    100% {
        opacity: 1;
    }
    100% {
        scale: 1.09;
    }
}
@keyframes reveal-light-rise {
    0%,
    8% {
        opacity: 0;
    }
    28% {
        opacity: 0.46;
    }
    67% {
        opacity: 1;
    }
    100% {
        opacity: 0.65;
    }
}
@keyframes reveal-world {
    0%,
    12% {
        opacity: 0;
        transform: translateY(9%) scale(0.76) rotate(-8deg);
    }
    28% {
        opacity: 1;
        transform: translateY(0) scale(0.94) rotate(-3deg);
    }
    82% {
        opacity: 0.88;
        transform: scale(1.05) rotate(2deg);
    }
    100% {
        opacity: 0.52;
        transform: scale(1.05) rotate(2deg);
    }
}
@keyframes reveal-rings {
    0%,
    15% {
        opacity: 0;
        transform: scale(0.7) rotate(-11deg);
    }
    30% {
        opacity: 0.84;
        transform: scale(1) rotate(-2deg);
    }
    65% {
        opacity: 1;
        transform: scale(1.04) rotate(5deg);
    }
    100% {
        opacity: 0.36;
        transform: scale(1.08) rotate(8deg);
    }
}
@keyframes reveal-orbit-travel {
    0%,
    13% {
        rotate: -12deg;
    }
    100% {
        rotate: 142deg;
    }
}
@keyframes reveal-gold {
    0%,
    27% {
        opacity: 0;
        scale: 0.78;
    }
    48% {
        opacity: 0.65;
        scale: 0.98;
    }
    65% {
        opacity: 1;
        scale: 1.12;
    }
    91% {
        opacity: 0.46;
        scale: 1.26;
    }
    100% {
        opacity: 0;
        scale: 1.31;
    }
}
@keyframes reveal-cup-in {
    0%,
    28% {
        opacity: 0;
        transform: translateY(23%) scale(0.54) rotateY(-33deg);
    }
    40% {
        opacity: 0.74;
    }
    51%,
    88% {
        opacity: 1;
        transform: translateY(0) scale(1) rotateY(0);
    }
    100% {
        opacity: 0.64;
        transform: translateY(3%) scale(0.86) rotateY(0);
    }
}
@keyframes reveal-title-in {
    0%,
    37% {
        opacity: 0;
        translate: 0 0.75rem;
    }
    48%,
    100% {
        opacity: 1;
        translate: none;
    }
}
@keyframes reveal-name-in {
    0%,
    48% {
        opacity: 0;
        transform: translateY(0.42em) scale(0.97);
    }
    65%,
    100% {
        opacity: 1;
        transform: none;
    }
}
@keyframes reveal-letter-light {
    0%,
    49% {
        background-position: 100% 0;
    }
    75%,
    100% {
        background-position: 0 0;
    }
}
@keyframes reveal-sparks {
    0%,
    57% {
        opacity: 0;
        transform: rotate(var(--bearing)) scale(0.42);
    }
    73% {
        opacity: 0.94;
    }
    92%,
    100% {
        opacity: 0;
        transform: rotate(calc(var(--bearing) + 24deg)) scale(1.28);
    }
}
@keyframes reveal-time {
    from {
        scale: 0 1;
    }
    to {
        scale: 1 1;
    }
}
</style>
