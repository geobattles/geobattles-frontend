<template>
    <section class="mobile-guess-dock" :class="{ 'is-landscape': landscape }" aria-label="Guess controls">
        <button
            ref="mapLauncher"
            type="button"
            class="map-launcher"
            aria-label="Open map"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls="gameplay-map-slot"
            :aria-describedby="countId"
            @click="emit('open')"
        >
            <span class="map-label"><UiIcon name="map" />Map</span>
            <UiIcon name="chevron-up" class="map-expand" />
            <span class="map-preview" aria-hidden="true">
                <span class="map-art">
                    <img src="/globe/natural-earth-land.svg" width="1024" height="512" alt="" />
                    <span v-if="pin" class="preview-pin" :class="{ 'is-tentative': hasDraft }" :style="pinPosition" />
                </span>
            </span>
        </button>

        <p class="guess-stock">
            <span :id="countId" class="sr-only" data-testid="guesses-left">{{ lives }} {{ lives === 1 ? "guess left" : "guesses left" }}</span>
            <span v-if="landscape" aria-hidden="true"
                ><strong>{{ lives }}</strong> left</span
            >
            <template v-else>
                <span class="dock-caption" aria-hidden="true">Guesses left</span>
                <span v-if="dotCount > 0 && dotCount <= 5" class="guess-dots" aria-hidden="true">
                    <i v-for="dot in dotCount" :key="dot" :class="{ 'has-guess': dot <= lives }" />
                </span>
                <strong v-else aria-hidden="true">{{ lives }}</strong>
            </template>
        </p>

        <button
            v-if="!landscape"
            class="dock-action place-guess"
            type="button"
            aria-haspopup="dialog"
            aria-controls="gameplay-map-slot"
            :disabled="placeDisabled"
            @click="emit('open')"
        >
            <UiIcon name="pin" />Place Guess
        </button>
        <button
            v-if="confirmVisible"
            ref="confirmButton"
            class="dock-action dock-confirm"
            type="button"
            :aria-label="pending ? 'Confirming guess' : 'Confirm Guess'"
            :aria-busy="pending"
            :disabled="submitDisabled"
            @click="emit('confirm')"
        >
            <span v-if="pending" class="spinner" aria-hidden="true" /><UiIcon v-else name="check" />{{ pending ? "Sending…" : "Confirm" }}
        </button>
    </section>
</template>

<script setup lang="ts">
import type { Coordinates } from "~/types/appTypes";

const props = defineProps<{
    landscape: boolean;
    lives: number;
    attempts: number;
    pin?: Coordinates;
    hasDraft: boolean;
    pending: boolean;
    placeDisabled: boolean;
    submitDisabled: boolean;
}>();
const emit = defineEmits<{ open: []; confirm: [] }>();
const countId = useId();
const mapLauncher = useTemplateRef("mapLauncher");
const confirmButton = useTemplateRef("confirmButton");
const focusMap = () => mapLauncher.value?.focus({ preventScroll: true });
defineExpose({ focusMap });

const dotCount = computed(() => Math.max(props.lives, props.attempts));
const confirmVisible = computed(() => !props.landscape || props.hasDraft || props.pending);
watch(confirmVisible, (visible) => {
    if (!visible && document.activeElement === confirmButton.value) void nextTick(focusMap);
});
const pinPosition = computed(() => {
    const pin = props.pin;
    if (!pin) return;
    return { left: ((pin.lng + 180) / 360) * 100 + "%", top: ((90 - pin.lat) / 180) * 100 + "%" };
});
</script>

<style scoped>
.mobile-guess-dock {
    --dock-gap: clamp(0.25rem, 1.1vw, 0.55rem);
    position: absolute;
    inset: auto 0 0;
    display: grid;
    grid-template: "map place" minmax(0, 1fr) "map confirm" minmax(0, 1fr) / minmax(0, 1.06fr) minmax(0, 1fr);
    gap: var(--dock-gap);
    block-size: var(--mobile-dock-height);
    padding: 0.43rem var(--hud-right) max(0.43rem, env(safe-area-inset-bottom)) var(--hud-left);
    border: 1px solid #b7ef996e;
    border-block-end: 0;
    border-radius: 1rem 1rem 0 0;
    background:
        linear-gradient(145deg, #153b2f45, #07271f72),
        url("/images/atlas-relief.svg") center bottom / 100% auto no-repeat,
        linear-gradient(162deg, #193f31, #06251e 52%, #0b2d23);
    box-shadow:
        inset 0 1px #e0ffc32c,
        0 -6px 23px #08251c3d;
    pointer-events: auto;
}
.map-launcher {
    grid-area: map;
    position: relative;
    display: grid;
    grid-template: "label expand" 1.55rem "preview preview" minmax(0, 1fr) ". ." 1.25rem / 1fr auto;
    align-items: center;
    min-height: 44px;
    overflow: hidden;
    border: 1px solid #b8ed9c83;
    border-radius: 0.72rem;
    background: #0b2c23;
    color: #f3f9ef;
    text-align: start;
}
.map-label {
    grid-area: label;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-self: start;
    gap: 0.28rem;
    margin: 0.15rem 0 0 0.24rem;
    padding: 0.12rem 0.42rem;
    border: 1px solid #a6d99836;
    border-radius: 999px;
    background: #0a2921ee;
    font-size: 0.73rem;
    font-weight: 820;
}
.map-expand {
    grid-area: expand;
    z-index: 1;
    margin-inline-end: 0.46rem;
    color: #dbf6b8;
}
.map-preview {
    grid-area: preview;
    display: grid;
    place-items: center;
    align-self: stretch;
    min-height: 0;
    overflow: hidden;
    container-type: size;
    background: radial-gradient(ellipse at 48% 5%, #215044, #102e29 72%);
}
.map-art {
    position: relative;
    display: block;
    inline-size: min(100cqw, 200cqh);
    aspect-ratio: 2;
}
.map-art img {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0.92;
    filter: grayscale(1) contrast(1.48) sepia(1) saturate(1.45) hue-rotate(40deg) brightness(1.2);
    mix-blend-mode: screen;
}
.preview-pin {
    position: absolute;
    width: 0.95rem;
    height: 1.24rem;
    color: #92cfb1;
    filter: drop-shadow(0 1px 3px #001b17);
    transform: translate(-50%, -100%);
}
.preview-pin.is-tentative {
    width: 1.18rem;
    height: 1.53rem;
    color: #d4ff7f;
    filter: drop-shadow(0 1px 3px #001b17) drop-shadow(0 0 4px #d8ff7e83);
}
.preview-pin::before {
    position: absolute;
    inset: 0;
    mask: url("/gameplay/map-icons/location.svg") center bottom / contain no-repeat;
    background: currentColor;
    content: "";
}
.map-launcher:enabled:hover {
    border-color: #d7ff9d;
}
.guess-stock {
    grid-area: map;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-self: end;
    align-items: center;
    gap: 0.4rem;
    min-height: 1.25rem;
    margin-block-end: 1px;
    color: #edf7e7;
    font-size: 0.67rem;
    font-weight: 720;
    pointer-events: none;
}
.guess-dots {
    display: inline-flex;
    gap: clamp(0.19rem, 1vw, 0.44rem);
}
.guess-dots i {
    width: clamp(0.43rem, 2.2vw, 0.72rem);
    aspect-ratio: 1;
    border-radius: 50%;
    background: #7fb56f75;
}
.guess-dots .has-guess {
    background: #dfff8d;
    box-shadow: 0 0 6px #cbfd7377;
}
.dock-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.48rem;
    min-width: 0;
    min-height: 44px;
    padding: 0.35rem clamp(0.36rem, 1.3vw, 0.85rem);
    border: 1px solid #bcf39f76;
    border-radius: 999px;
    background: linear-gradient(165deg, #245140, #102f26);
    color: #edf9e8;
    font-size: clamp(0.86rem, 3.45vw, 1.08rem);
    font-weight: 830;
    line-height: 1.12;
    white-space: nowrap;
}
.dock-action .ui-icon,
.dock-action .spinner {
    width: 1.12em;
    height: 1.12em;
    flex: none;
}
.place-guess {
    grid-area: place;
}
.dock-confirm {
    grid-area: confirm;
}
.dock-action:enabled:is(.place-guess, .dock-confirm) {
    border-color: var(--gb-scenic-action-border);
    background: linear-gradient(171deg, #e1ffaf, #a5eb63 84%);
    box-shadow:
        inset 0 1px #fbffe6b3,
        0 0 12px #a5ef636b;
    color: var(--gb-scenic-action-ink);
}
.mobile-guess-dock:has(.dock-confirm:enabled) .place-guess:enabled {
    background: linear-gradient(165deg, #245140, #102f26);
    box-shadow: none;
    color: #edf9e8;
}
.dock-action:disabled {
    border-color: #a2cb9563;
    color: #a9bdb1;
}
.dock-action[aria-busy="true"] {
    color: #e6f7d8;
}
.dock-action:enabled:active {
    transform: translateY(1px);
}
.mobile-guess-dock.is-landscape {
    inset: auto auto var(--landscape-dock-bottom) var(--hud-left);
    grid-template: "map confirm" var(--landscape-map-height) / clamp(8.25rem, 22vw, 10.75rem) auto;
    gap: 0.38rem;
    block-size: auto;
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
    pointer-events: none;
}
.is-landscape .map-launcher {
    grid-template: "label expand" minmax(0, 1fr) / minmax(0, 1fr) auto;
    align-items: start;
    pointer-events: auto;
    box-shadow: 0 5px 18px #041e17aa;
}
.is-landscape .map-label {
    margin: 0.27rem 0 0 0.3rem;
}
.is-landscape .map-expand {
    margin-block-start: 0.46rem;
    filter: drop-shadow(0 1px 2px #05251a);
}
.is-landscape .map-preview {
    grid-area: 1 / 1 / -1 / -1;
}
.is-landscape .dock-confirm {
    align-self: end;
    padding-inline: 0.62rem;
    border-radius: 0.62rem;
    font-size: 0.81rem;
    box-shadow: 0 5px 18px #041e17aa;
    pointer-events: auto;
}
.is-landscape .guess-stock {
    justify-self: end;
    min-height: 0;
    margin: 0 0.3rem 0.3rem 0;
    padding: 0.07rem 0.32rem;
    border: 1px solid #a6d99840;
    border-radius: 0.42rem;
    background: #0a2921ee;
    color: #d4e8d6;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.is-landscape .guess-stock strong {
    color: var(--round-accent);
}
@media (prefers-reduced-motion: no-preference) {
    .dock-action,
    .map-launcher {
        transition:
            background-color 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease,
            transform 140ms ease;
    }
}
</style>
