<template>
    <section
        ref="screen"
        class="cinematic-transition"
        :class="{ 'entry-failed': failed, 'entry-waiting': !confirmed && !failed && !preview, 'entry-preview': preview }"
        :data-testid="failed ? 'connection-lost' : 'connection-joining'"
        :aria-labelledby="titleId"
    >
        <picture class="scene" aria-hidden="true">
            <source media="(max-width: 700px) and (orientation: portrait)" srcset="/images/emerald-horizon-portrait.webp" />
            <img src="/images/emerald-horizon.webp" alt="" width="1672" height="941" fetchpriority="high" />
        </picture>
        <header class="cinematic-header">
            <span class="brand"
                ><img src="/images/emerald-mark.svg" alt="" width="30" height="32" /><span>Geo<b>Battles</b></span></span
            >
            <slot name="cancel" />
        </header>
        <div class="entry-layout">
            <svg class="journey" viewBox="0 0 700 225" fill="none" aria-hidden="true" focusable="false">
                <defs>
                    <path :id="pathId" ref="trail" :d="routePath" pathLength="1" />
                    <linearGradient :id="rimId" x1="0" y1="0" x2="1" y2="1">
                        <stop stop-color="#fff3aa" />
                        <stop offset=".56" stop-color="#c4fa76" />
                        <stop offset="1" stop-color="#f9d66b" />
                    </linearGradient>
                    <radialGradient :id="pinId">
                        <stop stop-color="#51842b" />
                        <stop offset=".75" stop-color="#163c24" />
                        <stop offset="1" stop-color="#406a28" />
                    </radialGradient>
                    <mask :id="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="225">
                        <use :href="'#' + pathId" class="route-mask" stroke="white" stroke-width="8" stroke-linecap="round" />
                    </mask>
                </defs>
                <use :href="'#' + pathId" class="route-track" />
                <use :href="'#' + pathId" class="route-lit" :mask="'url(#' + maskId + ')'" />
                <circle ref="traveller" class="route-flare" r="4" />
                <g transform="translate(49 189)">
                    <ellipse class="origin-ring" rx="30" ry="7" />
                    <path class="origin-pin" d="M0 0c-7-12-15-20-15-30a15 15 0 0 1 30 0C15-20 7-12 0 0Zm0-39a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" fill-rule="evenodd" />
                </g>
                <g transform="translate(350 174)">
                    <ellipse class="ground-ring" rx="66" ry="13" />
                    <ellipse class="ground-ring inner-ring" rx="37" ry="8" />
                    <ellipse class="arrival-ripple" rx="60" ry="12" />
                    <g class="destination">
                        <path :fill="'url(#' + pinId + ')'" :stroke="'url(#' + rimId + ')'" stroke-width="4" d="M0-3c-13-17-62-55-62-99a62 62 0 0 1 124 0C62-58 13-20 0-3Z" />
                        <ellipse class="orbit" cx="0" cy="-83" rx="82" ry="16" />
                        <g class="travellers">
                            <circle cy="-123" r="12" />
                            <circle cx="-24" cy="-117" r="8" />
                            <circle cx="24" cy="-117" r="8" />
                            <path d="M-19-86v-8a19 19 0 0 1 38 0v8zm-19-6v-6a13 13 0 0 1 20-11 22 22 0 0 0-6 17zm76 0H24a22 22 0 0 0-6-17 13 13 0 0 1 20 11z" />
                        </g>
                    </g>
                </g>
            </svg>
            <div class="entry-copy">
                <h1 :id="titleId">
                    <template v-if="failed">{{ title }}</template
                    ><template v-else>Entering your <em>lobby</em></template>
                </h1>
                <p :role="failed ? undefined : 'status'">{{ !failed && confirmed && stage === 2 ? "Joining players…" : subtitle }}</p>
                <div v-if="$slots.default" class="entry-actions"><slot /></div>
            </div>
            <ol v-if="!failed" class="tracker" aria-label="Lobby entry progress">
                <li v-for="(step, index) in steps" :key="step.label" :data-stage="index" :aria-current="stage === index ? 'step' : undefined" :class="{ reached: stage >= index }">
                    <span class="checkpoint"><UiIcon :name="index === 0 && stage < 0 ? 'pin' : step.icon" /></span>
                    <span>{{ step.label }}</span>
                </li>
            </ol>
        </div>
        <label v-if="preview" class="preview"
            >Timeline · {{ previewTime }} ms
            <input v-model.number="previewTime" type="range" min="0" :max="duration" step="1" />
        </label>
    </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ title: string; subtitle: string; duration?: number; failed?: boolean; animate?: boolean; confirmed?: boolean; preview?: boolean }>(), {
    duration: 2000,
    animate: true,
});
const emit = defineEmits<{ arrived: [] }>();
const titleId = useId();
const rimId = titleId + "-rim";
const pinId = titleId + "-pin";
const maskId = titleId + "-mask";
const pathId = titleId + "-path";
const routePath = "M49 189C109 195 134 125 200 130S278 185 350 174";
const steps = [
    { label: "Lobby Found", icon: "check" },
    { label: "Opening Room", icon: "users" },
    { label: "Joining Players", icon: "pin" },
];
const screen = useTemplateRef("screen");
const trail = useTemplateRef("trail");
const traveller = useTemplateRef("traveller");
const stage = ref(-1);
const previewTime = ref(0);
let frame = 0;
let origin = 0;
let start = 0;
let length = 0;
let motion: MediaQueryList | undefined;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => value * value * (3 - 2 * value);

function paint(time: number, admitted: boolean, moving: boolean) {
    const first = ease(clamp((time - 0.1) / 0.25));
    const second = ease(clamp((time - 0.35) / 0.25));
    const progress = admitted ? (first + second) / 2 : 0;
    stage.value = !admitted ? -1 : time >= 0.6 ? 2 : time >= 0.35 ? 1 : 0;
    const style = screen.value?.style;
    style?.setProperty("--fill", String(progress));
    style?.setProperty("--draw", String(1 - progress));
    style?.setProperty("--beam", moving && progress > 0 && progress < 1 ? "1" : "0");
    style?.setProperty("--approach", String(0.52 + 0.48 * progress));
    style?.setProperty("--camera", String(moving ? 1 + 0.045 * time : 1));
    style?.setProperty("--copy", String(moving ? 0.65 + 0.35 * clamp(time / 0.2) : 1));
    style?.setProperty("--orbit", (moving ? -10 + progress * 18 : 0) + "deg");
    const arrival = moving && admitted ? clamp((time - 0.6) / 0.27) : 0;
    style?.setProperty("--ripple", String(arrival > 0 ? Math.sin(Math.PI * arrival) * 0.8 : 0));
    style?.setProperty("--spread", String(1 + 0.52 * arrival));
    // Checkpoint pulses use the same clock as both paths.
    for (const [index, checkpoint] of [0.025, 0.35, 0.6].entries()) {
        const pulse = moving && admitted ? clamp((time - checkpoint) / 0.14) : 0;
        style?.setProperty("--pulse-" + index, String(Math.sin(Math.PI * pulse)));
    }
    if (moving && trail.value && traveller.value) {
        const point = trail.value.getPointAtLength(length * progress);
        traveller.value.setAttribute("cx", String(point.x));
        traveller.value.setAttribute("cy", String(point.y));
    }
}

function advance(now: number) {
    frame = 0;
    if (props.failed) return;
    const moving = !motion?.matches;
    const pending = clamp(Math.min(0.1, (now - origin) / props.duration));
    if (!props.confirmed) {
        paint(pending, false, moving);
        if (pending < 0.1 && moving) frame = requestAnimationFrame(advance);
        return;
    }
    if (!start) start = Math.max(now, origin + props.duration * 0.1);
    const remaining = Math.max(440, origin + props.duration - start);
    const time = moving ? 0.1 + 0.9 * clamp((now - start) / remaining) : 1;
    paint(time, true, moving);
    if (time >= 1) emit("arrived");
    else frame = requestAnimationFrame(advance);
}

function refresh() {
    cancelAnimationFrame(frame);
    if (props.preview) {
        paint(previewTime.value / props.duration, previewTime.value > 0, !motion?.matches);
    } else if (props.animate && !props.failed) {
        if (!props.confirmed) start = 0;
        frame = requestAnimationFrame(advance);
    }
}
watch(() => [props.confirmed, props.failed], refresh);
watch(previewTime, refresh);
onMounted(() => {
    length = trail.value?.getTotalLength() ?? 0;
    origin = performance.now();
    motion = matchMedia("(prefers-reduced-motion: reduce)");
    motion.addEventListener("change", refresh);
    refresh();
});
onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    motion?.removeEventListener("change", refresh);
});
</script>

<style scoped>
.cinematic-transition {
    --edge: clamp(0.85rem, 3vw, 3rem);
    --entry-lime: #d7ff8b;
    --fill: 0;
    --draw: 1;
    --beam: 0;
    --approach: 0.55;
    --ripple: 0;
    --spread: 1;
    position: fixed;
    z-index: 30;
    isolation: isolate;
    inset: var(--gb-screen-top, 0px) 0 auto;
    height: var(--gb-viewport-height);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: auto;
    color: #f8fafc;
    background: #052520;
}
.scene,
.cinematic-transition::before,
.cinematic-transition::after {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.scene {
    z-index: -3;
    overflow: hidden;
}
.scene img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 57% 46%;
    transform-origin: 57% 43%;
    transform: scale(var(--camera, 1));
}
.cinematic-transition::before {
    content: "";
    z-index: -2;
    background: linear-gradient(180deg, #04251e88, transparent 29%, #052a2352 48%, #062722ed 84%, #041f1c);
}
.cinematic-transition::after {
    content: "";
    z-index: -1;
    background: url("/images/atlas-relief.svg") center bottom / 100% auto no-repeat;
    mask-image: linear-gradient(180deg, transparent 57%, #000 88%);
    opacity: 0.62;
}
.cinematic-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: max(0.45rem, var(--gb-safe-top)) max(var(--edge), var(--gb-safe-right)) 0 max(var(--edge), var(--gb-safe-left));
}
.brand {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font: italic 900 clamp(1rem, 2vw, 1.4rem) / 1 var(--gb-font-display);
    letter-spacing: -0.045em;
}
.brand b,
.entry-copy em {
    color: var(--entry-lime);
}
.cinematic-header :deep(.btn) {
    min-height: 44px;
    border-radius: 999px;
    background: #052c23df;
}
.entry-layout {
    align-self: center;
    display: grid;
    justify-items: center;
    gap: clamp(0.65rem, 2.15dvh, 1.35rem);
    width: min(100%, 62rem);
    margin-inline: auto;
    padding: 0.5rem max(var(--edge), var(--gb-safe-right)) max(1rem, var(--gb-safe-bottom)) max(var(--edge), var(--gb-safe-left));
    text-align: center;
}
.journey {
    display: block;
    width: min(100%, 55rem);
    height: auto;
    max-height: 34dvh;
    overflow: visible;
}
.route-track,
.route-lit {
    stroke-width: 3.4;
    stroke-dasharray: 0.021 0.025;
    stroke-linecap: round;
}
.route-track {
    stroke: #d3f59466;
}
.route-lit {
    stroke: #edffa5;
    filter: drop-shadow(0 0 5px #d1f86d);
}
.route-mask {
    stroke-dasharray: 1;
    stroke-dashoffset: var(--draw);
}
.route-flare {
    fill: #fffac2;
    opacity: var(--beam);
    filter: drop-shadow(0 0 6px #e5ff6c);
}
.origin-pin {
    fill: #f0fda4;
}
.origin-ring,
.ground-ring,
.arrival-ripple,
.orbit {
    stroke: #c9f477;
    stroke-width: 1.35;
}
.origin-ring {
    filter: drop-shadow(0 0 5px #b9f377);
}
.ground-ring {
    opacity: var(--approach);
}
.inner-ring {
    fill: #d7ff8b37;
}
.arrival-ripple {
    opacity: var(--ripple);
    transform: scale(var(--spread));
}
.destination {
    opacity: var(--approach);
    filter: drop-shadow(0 0 9px #c8f86d86);
}
.travellers {
    fill: #e3ffa6;
}
.orbit {
    transform: rotate(var(--orbit, 0deg));
    transform-origin: 0 -83px;
}
.entry-copy {
    opacity: var(--copy, 1);
    translate: 0 calc((1 - var(--copy, 1)) * 0.9rem);
    min-width: 0;
    text-shadow: 0 2px 14px #001811;
}
.entry-copy h1 {
    font: italic 900 clamp(2.35rem, 5.3vw, 5rem) / 1.02 var(--gb-font-display);
    letter-spacing: -0.05em;
}
.entry-copy p {
    margin-top: 0.6rem;
    color: #e2f1e8;
    font-size: clamp(0.95rem, 1.6vw, 1.25rem);
}
.entry-actions {
    margin-top: 0.8rem;
}
.tracker {
    --circle: clamp(2.55rem, 5.1vw, 4.1rem);
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: min(100%, 54rem);
    margin: clamp(0.15rem, 2dvh, 1rem) 0 0;
    padding: 0;
    list-style: none;
}
.tracker::before,
.tracker::after {
    content: "";
    position: absolute;
    z-index: -1;
    top: calc(var(--circle) / 2 - 2px);
    left: calc(100% / 6);
    width: calc(200% / 3);
    height: 4px;
    border-radius: 99px;
    background: #c6e8cc4f;
}
.tracker::after {
    width: calc(200% / 3 * var(--fill));
    background: linear-gradient(90deg, #88e853, #e9ff9d);
    box-shadow: 0 0 0.65rem #c8fb69aa;
}
.tracker li {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 0.45rem;
    padding-inline: 0.1rem;
    color: #bbd4c6;
    font-size: clamp(0.73rem, 1.45vw, 1.06rem);
    font-weight: 750;
}
.checkpoint {
    display: grid;
    place-items: center;
    position: relative;
    width: var(--circle);
    aspect-ratio: 1;
    border: 2px solid #9bb8a687;
    border-radius: 50%;
    background: #0c2c24;
    font-size: calc(var(--circle) * 0.46);
}
.checkpoint::after {
    content: "";
    position: absolute;
    inset: -5px;
    border: 1px solid var(--entry-lime);
    border-radius: inherit;
    opacity: var(--pulse, 0);
    scale: calc(1 + var(--pulse, 0) * 0.12);
}
[data-stage="0"] {
    --pulse: var(--pulse-0);
}
[data-stage="1"] {
    --pulse: var(--pulse-1);
}
[data-stage="2"] {
    --pulse: var(--pulse-2);
}
.reached {
    color: #f4fff1 !important;
}
.reached .checkpoint {
    border-color: var(--entry-lime);
    color: #e7ffa8;
    box-shadow:
        inset 0 0 0.65rem #a9f55537,
        0 0 0.85rem #c9fc6266;
}
.tracker li:last-child::after {
    content: "";
    position: absolute;
    pointer-events: none;
    top: calc(var(--circle) / 2 - 3px);
    left: calc(-150% + 200% * var(--fill));
    width: 6px;
    height: 6px;
    translate: -50% 0;
    border-radius: 50%;
    background: #fffdcc;
    box-shadow: 0 0 0.7rem #e1ff8e;
    opacity: var(--beam);
}
.entry-failed .journey {
    opacity: 0.5;
}
.entry-failed .route-flare {
    opacity: 0;
}
.entry-failed h1 {
    color: #ffc3b3;
}
.horizon-leave-active {
    transition: opacity 280ms ease;
    pointer-events: none;
}
.horizon-leave-to {
    opacity: 0;
}
.entry-preview {
    grid-template-rows: auto minmax(0, 1fr) auto;
}
.preview {
    justify-self: start;
    margin: 0 max(var(--edge), var(--gb-safe-right)) max(0.45rem, var(--gb-safe-bottom)) max(var(--edge), var(--gb-safe-left));
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.7rem;
    border-radius: 0.55rem;
    background: #092d25;
    color: #e8fff1;
    font-size: 0.75rem;
}
@media (max-width: 700px) and (orientation: portrait) {
    .scene img {
        object-position: center 58%;
    }
    .cinematic-transition::before {
        background: linear-gradient(180deg, #04281f66, transparent 18%, #052a235b 45%, #062722ed 79%, #041f1c);
    }
    .journey {
        width: 100%;
    }
    .entry-copy h1 {
        font-size: clamp(1.95rem, 9.6vw, 3.5rem);
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .entry-layout {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: 0.6rem;
    }
    .journey {
        grid-column: 2;
        grid-row: 1;
        max-height: 38dvh;
    }
    .entry-copy {
        grid-column: 1;
        grid-row: 1;
    }
    .entry-copy h1 {
        font-size: clamp(1.75rem, 5.3vw, 3rem);
    }
    .tracker {
        grid-column: 1 / -1;
        width: min(100%, 32rem);
    }
}
@media (prefers-reduced-motion: no-preference) {
    .entry-waiting .orbit {
        animation: waiting-orbit 5s ease-in-out infinite alternate;
    }
    @keyframes waiting-orbit {
        from {
            rotate: -5deg;
            opacity: 0.4;
        }
        to {
            rotate: 5deg;
            opacity: 0.75;
        }
    }
}
@media (prefers-reduced-motion: reduce) {
    .horizon-leave-active {
        transition-duration: 120ms;
    }
}
</style>
