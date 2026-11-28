<template>
    <div
        ref="dial"
        class="round-timer"
        :class="{ 'is-compact': compact, 'wide-reading': (seconds ?? 0) >= 100, 'last-beat': seconds === 1 }"
        :data-urgency="urgency"
        data-testid="round-timer"
    >
        <div v-if="compact" class="timer-pill" role="timer" :aria-label="seconds === null ? 'Round time unavailable' : `Time remaining, ${seconds} seconds`">
            <svg class="timer-pill-ring" viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
                <circle class="pill-ring-track" cx="18" cy="18" r="14.5" stroke="currentColor" />
                <circle class="pill-ring-progress" cx="18" cy="18" r="14.5" pathLength="100" transform="rotate(-90 18 18)" stroke="currentColor" stroke-linecap="round" />
            </svg>
            <div class="timer-pill-digits" aria-hidden="true">
                <strong>{{ seconds ?? "—" }}</strong
                ><span v-if="seconds !== null">s</span>
            </div>
            <span class="timer-pill-bar" aria-hidden="true"><i /></span>
        </div>
        <div v-else class="timer-face" role="timer" :aria-label="seconds === null ? 'Round time unavailable' : `Time remaining, ${seconds} seconds`">
            <div class="timer-halo" aria-hidden="true" />
            <div class="timer-globe" aria-hidden="true" />
            <svg class="timer-dial-art" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
                <defs>
                    <linearGradient :id="id + '-progress'" x1="0%" x2="94%" y1="87%" y2="8%">
                        <stop stop-color="currentColor" stop-opacity=".55" />
                        <stop offset=".67" stop-color="currentColor" />
                        <stop offset="1" stop-color="#fffce5" />
                    </linearGradient>
                    <linearGradient :id="id + '-trail'" x1="0%" x2="100%" y1="90%" y2="0%">
                        <stop stop-color="currentColor" stop-opacity="0" />
                        <stop offset="1" stop-color="currentColor" />
                    </linearGradient>
                    <radialGradient :id="id + '-flare'">
                        <stop stop-color="#fffceb" />
                        <stop offset=".28" stop-color="currentColor" stop-opacity=".8" />
                        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
                    </radialGradient>
                </defs>
                <circle class="timer-bezel" cx="60" cy="60" r="58" stroke="currentColor" />
                <circle class="timer-track" cx="60" cy="60" r="53" stroke="currentColor" />
                <circle class="timer-ticks" cx="60" cy="60" r="46" pathLength="72" stroke="currentColor" stroke-dasharray=".25 1.25" />
                <circle class="timer-progress" cx="60" cy="60" r="53" pathLength="100" transform="rotate(-90 60 60)" :stroke="`url(#${id}-progress)`" stroke-linecap="round" />
                <circle class="timer-beat-arc" cx="60" cy="60" r="48" pathLength="100" transform="rotate(-90 60 60)" stroke="currentColor" stroke-linecap="round" />
                <g class="timer-orbit">
                    <path d="M 26.06 26.06 A 48 48 0 0 1 60 12" :stroke="`url(#${id}-trail)`" stroke-linecap="round" />
                    <circle cx="60" cy="12" r="11" :fill="`url(#${id}-flare)`" />
                    <circle cx="60" cy="12" r="1.9" fill="#fffdeb" />
                </g>
            </svg>
            <div class="timer-reading" aria-hidden="true">
                <UiIcon name="clock" class="timer-clock-icon" />
                <div class="timer-digits">
                    <strong>{{ seconds ?? "—" }}</strong
                    ><span v-if="seconds !== null">s</span>
                </div>
            </div>
            <div class="timer-echo" aria-hidden="true" />
        </div>
        <span :class="urgency === 'expired' ? 'timer-waiting' : 'sr-only'" role="status">{{ announcement }}</span>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ seconds: number | null; duration: number; compact?: boolean }>();
const dial = useTemplateRef("dial");
const id = useId();

// Cap the time spent in each state on short rounds.
const thresholds = computed(() => ({
    warning: Math.min(30, Math.floor(props.duration * 0.75)),
    critical: Math.min(10, Math.floor(props.duration * 0.25)),
    final: Math.min(3, Math.max(1, Math.floor(props.duration * 0.15))),
}));
const urgency = computed(() => {
    const seconds = props.seconds;
    if (seconds === null) return "waiting";
    if (seconds <= 0) return "expired";
    if (seconds <= thresholds.value.final) return "final";
    if (seconds <= thresholds.value.critical) return "critical";
    return seconds <= thresholds.value.warning ? "warning" : "normal";
});
const announcements = {
    waiting: "Waiting for the round clock",
    expired: "Waiting for results",
    final: "Final seconds",
    critical: "Round ending soon",
    warning: "Low time",
    normal: "",
} as const;
const announcement = computed(() => announcements[urgency.value]);

const draw = (remainingMs: number, expiryProgress: number) => {
    const style = dial.value?.style;
    if (!style) return;
    const remaining = remainingMs / 1000;
    style.setProperty("--timer-progress", (remaining / Math.max(1, props.duration)).toFixed(4));
    const { warning, critical } = thresholds.value;
    // Faster sweeps join the preceding path at the same angle at each threshold.
    const calmTurns = Math.max(0, remaining - warning) / 12;
    const warningTurns = Math.max(0, Math.min(remaining, warning) - critical) / 5;
    const turns = -(calmTurns + warningTurns + Math.min(remaining, critical));
    style.setProperty("--timer-orbit", `${turns % 1}turn`);
    style.setProperty("--timer-beat", (Math.ceil(remaining) - remaining).toFixed(3));
    style.setProperty("--timer-expiry", expiryProgress.toFixed(3));
};
defineExpose({ draw });
</script>

<style scoped>
.round-timer {
    --timer-accent: #cdff91;
    --timer-shadow: #75f4a2;
    --timer-glass: #0c372b;
    --timer-scale: 1;
    --timer-light: 0.31;
    --timer-earth: 0.4;
    --timer-orbit-light: 0.45;
    --timer-trail-width: 1.45;
    --timer-beat: 0;
    --timer-beat-light: max(0, 1 - var(--timer-beat) * 3.8);
    --timer-expiry: 1;
    position: relative;
    inline-size: var(--timer-diameter, 6rem);
    color: var(--timer-accent);
    pointer-events: none;
    user-select: none;
}
.round-timer[data-urgency="warning"] {
    --timer-accent: #eeff92;
    --timer-shadow: #dcf880;
    --timer-glass: #294027;
    --timer-scale: var(--timer-warning-scale, 1.085);
    --timer-light: 0.43;
    --timer-earth: 0.46;
    --timer-orbit-light: 0.73;
    --timer-trail-width: 2.15;
}
.round-timer[data-urgency="critical"] {
    --timer-accent: #ffcf77;
    --timer-shadow: #ffb447;
    --timer-glass: #4c2e18;
    --timer-scale: var(--timer-critical-scale, 1.23);
    --timer-light: calc(0.53 + 0.2 * var(--timer-beat-light));
    --timer-earth: 0.48;
    --timer-orbit-light: 0.92;
    --timer-trail-width: 2.8;
}
.round-timer:is([data-urgency="final"], [data-urgency="expired"]) {
    --timer-accent: #ff947b;
    --timer-shadow: #ff7245;
    --timer-glass: #4c251d;
    --timer-scale: var(--timer-final-scale, 1.43);
    --timer-light: calc(0.57 + 0.28 * var(--timer-beat-light));
    --timer-earth: 0.5;
    --timer-orbit-light: 1;
    --timer-trail-width: 3.6;
}
.round-timer.last-beat {
    --timer-accent: #ffa37c;
    --timer-shadow: #ff6938;
    --timer-earth: 0.55;
    --timer-light: calc(0.67 + 0.28 * var(--timer-beat-light));
}
.round-timer[data-urgency="expired"] {
    --timer-light: calc(0.2 + 0.65 * (1 - var(--timer-expiry)));
}
.round-timer[data-urgency="waiting"] {
    --timer-accent: #b7d2c5;
    --timer-light: 0.1;
}
.timer-face {
    position: relative;
    isolation: isolate;
    container-type: inline-size;
    inline-size: 100%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle at 45% 17%, #0000, #021411 72%) var(--timer-glass);
    box-shadow:
        inset 0 0 0 1px #d8fff037,
        0 4px 12px #0007;
    transform: scale(var(--timer-scale));
    transform-origin: center top;
}
.timer-halo,
.timer-globe,
.timer-dial-art,
.timer-reading,
.timer-echo {
    position: absolute;
    inset: 0;
}
.timer-halo {
    z-index: -1;
    inset: -20%;
    background: radial-gradient(circle, transparent 44%, color-mix(in srgb, var(--timer-shadow) 55%, transparent) 50%, transparent 68%);
    opacity: var(--timer-light);
}
.timer-globe {
    inset: 5%;
    border-radius: 50%;
    background:
        radial-gradient(ellipse at 50% 63%, #031d19ee, #031d19a0 36%, transparent 71%),
        url("/images/emerald-countdown-earth.webp") 50% 32% / 122% auto no-repeat;
    opacity: var(--timer-earth);
}
.timer-dial-art {
    inline-size: 100%;
    block-size: 100%;
}
.timer-bezel {
    opacity: 0.48;
    stroke-width: 0.9;
}
.timer-track {
    opacity: 0.24;
    stroke-width: 2.9;
}
.timer-ticks {
    opacity: 0.55;
    stroke-width: 1.6;
}
.timer-progress {
    stroke-width: 3.8;
    stroke-dasharray: 100 100;
    stroke-dashoffset: calc(100 * (1 - var(--timer-progress, 0)));
}
.timer-beat-arc {
    display: none;
    opacity: 0.71;
    stroke-width: 2.4;
    stroke-dasharray: 100 100;
    stroke-dashoffset: calc(100 * (1 - var(--timer-beat)));
}
.timer-orbit {
    transform: rotate(var(--timer-orbit, 0turn));
    transform-origin: 60px 60px;
    opacity: var(--timer-orbit-light);
}
.timer-orbit path {
    stroke-width: var(--timer-trail-width);
}
.round-timer:is([data-urgency="expired"], [data-urgency="waiting"]) :is(.timer-orbit, .timer-progress) {
    visibility: hidden;
}
.timer-reading {
    display: grid;
    place-content: center;
    place-items: center;
    gap: 2cqi;
    padding-block-start: 2cqi;
}
.timer-clock-icon {
    inline-size: 17cqi;
    block-size: 17cqi;
}
.timer-digits {
    display: flex;
    align-items: baseline;
    gap: 0.08em;
    color: #f9fff2;
    font: italic 900 40cqi / 0.98 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.045em;
    text-shadow: 0 2px 7px #001410;
}
.timer-digits strong {
    font-weight: inherit;
}
.timer-digits span {
    font-size: 0.42em;
    font-weight: 760;
}
.wide-reading .timer-digits {
    font-size: 33cqi;
}
.round-timer:is([data-urgency="final"], [data-urgency="expired"]) .timer-digits {
    font-size: 51cqi;
}
.timer-echo {
    opacity: 0;
    border: 1.5px solid currentColor;
    border-radius: inherit;
}
.timer-waiting {
    position: absolute;
    inset-block-start: calc(100% * var(--timer-scale) + 0.35rem);
    inset-inline-start: 50%;
    translate: -50% 0;
    padding: 0.24rem 0.5rem;
    border: 1px solid #ff947b70;
    border-radius: 999px;
    background: #201c18;
    color: #fff1e6;
    font-size: 0.69rem;
    font-weight: 700;
    white-space: nowrap;
}
.round-timer.is-compact {
    inline-size: auto;
    flex: none;
}
.round-timer.is-compact .timer-pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.34rem;
    min-block-size: 36px;
    padding: 0.16rem 0.62rem 0.22rem 0.3rem;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--timer-accent) 55%, transparent);
    border-radius: 999px;
    background: linear-gradient(145deg, color-mix(in srgb, var(--timer-glass) 92%, #072821), #041c17eb);
    box-shadow:
        0 4px 14px #0015107a,
        inset 0 1px #e5ffcf22,
        0 0 12px color-mix(in srgb, var(--timer-shadow) calc(var(--timer-light) * 58%), transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
.timer-pill-ring {
    inline-size: 1.55rem;
    block-size: 1.55rem;
    flex: none;
    color: var(--timer-accent);
}
.pill-ring-track {
    opacity: 0.24;
    stroke-width: 3.2;
}
.pill-ring-progress {
    stroke-width: 3.6;
    stroke-dasharray: 100 100;
    stroke-dashoffset: calc(100 * (1 - var(--timer-progress, 0)));
}
.round-timer.is-compact:is([data-urgency="expired"], [data-urgency="waiting"]) .pill-ring-progress {
    visibility: hidden;
}
.timer-pill-digits {
    display: inline-flex;
    align-items: baseline;
    gap: 0.06em;
    color: #f8fff0;
    font: italic 900 1.05rem / 1 var(--gb-font-display);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
    text-shadow: 0 1px 4px #001410;
}
.round-timer.is-compact:is([data-urgency="critical"], [data-urgency="final"], [data-urgency="expired"]) .timer-pill-digits {
    color: var(--timer-accent);
}
.timer-pill-digits strong {
    font-weight: inherit;
}
.timer-pill-digits span {
    font-size: 0.68em;
    font-weight: 760;
    opacity: 0.9;
}
.timer-pill-bar {
    position: absolute;
    inset: auto 0.55rem 0;
    block-size: 2px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--timer-accent) 20%, transparent);
    overflow: hidden;
}
.timer-pill-bar i {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    transform-origin: left center;
    transform: scaleX(var(--timer-progress, 0));
    background: var(--timer-accent);
}
.round-timer.is-compact .timer-waiting {
    inset-block-start: calc(100% + 0.3rem);
    inset-inline-start: 0;
    translate: 0 0;
}
@media (prefers-reduced-motion: no-preference) {
    .round-timer.is-compact:is([data-urgency="critical"], [data-urgency="final"]) .timer-pill {
        transform: scale(calc(1 + 0.04 * var(--timer-beat-light)));
    }
}
@media (prefers-reduced-motion: no-preference) {
    .round-timer {
        transition: color 320ms ease-out;
    }
    .timer-face {
        transition:
            transform 380ms cubic-bezier(0.2, 0.75, 0.22, 1),
            background-color 320ms ease-out;
    }
    .round-timer:is([data-urgency="critical"], [data-urgency="final"]) .timer-beat-arc {
        display: initial;
    }
    .round-timer:is([data-urgency="critical"], [data-urgency="final"]) .timer-digits {
        opacity: calc(0.88 + min(0.12, var(--timer-beat) * 1.25));
        transform: scale(calc(0.955 + min(0.045, var(--timer-beat) * 0.48) + 0.035 * var(--timer-beat-light)));
    }
    .round-timer:is([data-urgency="critical"], [data-urgency="final"]) .timer-echo {
        opacity: calc(0.36 * var(--timer-beat-light));
        transform: scale(calc(1.03 + min(0.22, var(--timer-beat) * 0.65)));
    }
    .round-timer[data-urgency="expired"] .timer-echo {
        opacity: calc(0.78 * (1 - var(--timer-expiry)));
        transform: scale(calc(1 + var(--timer-expiry) * 0.31));
    }
}
@media (prefers-reduced-motion: reduce) {
    .round-timer {
        --timer-beat-light: 0;
    }
    .timer-face {
        transform: none;
    }
    .timer-waiting {
        inset-block-start: calc(100% + 0.35rem);
    }
    .timer-orbit {
        display: none;
    }
}
@media (forced-colors: active) {
    .timer-face {
        outline: 1px solid CanvasText;
    }
}
</style>
