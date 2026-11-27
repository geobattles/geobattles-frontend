<template>
    <section class="mobile-guess-dock" :class="{ 'is-landscape': landscape }" aria-label="Guess controls">
        <div class="dock-status-pill">
            <p class="guess-stock">
                <span :id="countId" class="sr-only" data-testid="guesses-left">{{ lives }} {{ lives === 1 ? "guess left" : "guesses left" }}</span>
                <span v-if="dotCount > 0 && dotCount <= 5" class="guess-dots" aria-hidden="true">
                    <i v-for="dot in dotCount" :key="dot" :class="{ 'has-guess': dot <= lives }" />
                </span>
                <span class="stock-readout" aria-hidden="true">
                    <strong>{{ lives }}</strong
                    ><span v-if="attempts > 0">/{{ attempts }}</span>
                </span>
            </p>
            <template v-if="canReturnToStart">
                <span class="pill-divider" aria-hidden="true" />
                <button type="button" class="return-start-btn" aria-label="Return to start" title="Return to start" :disabled="!playing" @click="emit('returnToStart')">
                    <UiIcon name="refresh" />
                </button>
            </template>
        </div>

        <div class="dock-cta-group">
            <button
                ref="mapLauncher"
                type="button"
                class="dock-action map-trigger"
                :class="{ 'is-primary': !hasDraft && !pending && lives > 0, 'is-secondary': hasDraft || pending || lives <= 0 }"
                aria-label="Open map"
                aria-haspopup="dialog"
                aria-expanded="false"
                aria-controls="gameplay-map-slot"
                :aria-describedby="countId"
                :disabled="placeDisabled && lives > 0 && !hasDraft"
                @click="emit('open')"
            >
                <UiIcon :name="hasDraft ? 'pin' : 'map'" />
                <span>{{ hasDraft ? "Adjust" : lives > 0 ? "Map" : "View Map" }}</span>
            </button>
            <button
                v-if="confirmVisible"
                ref="confirmButton"
                class="dock-action dock-confirm is-primary"
                type="button"
                :aria-label="pending ? 'Confirming guess' : 'Confirm Guess'"
                :aria-busy="pending"
                :disabled="submitDisabled"
                @click="emit('confirm')"
            >
                <span v-if="pending" class="spinner" aria-hidden="true" /><UiIcon v-else name="check" />
                <span>{{ pending ? "Sending…" : "Confirm" }}</span>
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
const props = defineProps<{
    landscape: boolean;
    playing: boolean;
    lives: number;
    attempts: number;
    hasDraft: boolean;
    pending: boolean;
    placeDisabled: boolean;
    submitDisabled: boolean;
    canReturnToStart?: boolean;
}>();
const emit = defineEmits<{ open: []; confirm: []; returnToStart: [] }>();
const countId = useId();
const mapLauncher = useTemplateRef("mapLauncher");
const confirmButton = useTemplateRef("confirmButton");
const focusMap = () => mapLauncher.value?.focus({ preventScroll: true });
defineExpose({ focusMap });

const dotCount = computed(() => Math.max(props.lives, props.attempts));
const confirmVisible = computed(() => props.hasDraft || props.pending);
watch(confirmVisible, (visible) => {
    if (!visible && document.activeElement === confirmButton.value) void nextTick(focusMap);
});
</script>

<style scoped>
.mobile-guess-dock {
    position: absolute;
    inset: auto var(--hud-right) max(0.32rem, env(safe-area-inset-bottom)) var(--hud-left);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    pointer-events: none;
}
.dock-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-block-size: 46px;
    padding: 0.25rem 0.35rem 0.25rem 0.72rem;
    border: 1px solid #b6efa35a;
    border-radius: 999px;
    background: linear-gradient(140deg, #09322ae0, #051f1be8);
    box-shadow:
        0 6px 20px #0016117a,
        inset 0 1px #dff9cf26;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    pointer-events: auto;
}
.dock-status-pill:not(:has(.return-start-btn)) {
    padding-inline-end: 0.78rem;
}
.guess-stock {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    color: #edf7e7;
    font-size: 0.78rem;
    font-weight: 760;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.guess-dots {
    display: inline-flex;
    align-items: center;
    gap: 0.24rem;
}
.guess-dots i {
    inline-size: 0.48rem;
    block-size: 0.48rem;
    border-radius: 50%;
    border: 1px solid #b6efa350;
    background: #88be7e38;
}
.guess-dots .has-guess {
    border-color: #f3ffd6;
    background: #d5fa86;
    box-shadow: 0 0 7px #cbfd7396;
}
.stock-readout strong {
    color: #f6fff0;
    font-weight: 850;
}
.stock-readout span {
    color: #a9cbb9;
    font-weight: 650;
}
.pill-divider {
    inline-size: 1px;
    block-size: 1.25rem;
    background: #b6efa336;
}
.return-start-btn {
    display: inline-grid;
    place-items: center;
    inline-size: 38px;
    block-size: 38px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #d5fa86;
}
.return-start-btn:enabled:hover {
    background: #ffffff18;
}
.return-start-btn:disabled {
    opacity: 0.45;
}
.dock-cta-group {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    pointer-events: auto;
}
.dock-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    min-inline-size: 46px;
    min-block-size: 48px;
    padding: 0.42rem 1.05rem;
    border: 1px solid #b6efa368;
    border-radius: 999px;
    font-size: 0.92rem;
    font-weight: 850;
    line-height: 1.1;
    white-space: nowrap;
}
.dock-action .ui-icon,
.dock-action .spinner {
    inline-size: 1.12em;
    block-size: 1.12em;
    flex: none;
}
.dock-action.is-secondary {
    background: linear-gradient(140deg, #0b352ce6, #06221ded);
    color: #edf9ef;
    box-shadow:
        0 6px 20px #0016117a,
        inset 0 1px #dff9cf24;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
.dock-action.is-primary:enabled {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    box-shadow: var(--gb-scenic-action-shadow);
    color: var(--gb-scenic-action-ink);
}
.dock-action.is-primary:enabled:hover {
    box-shadow: var(--gb-scenic-action-hover-shadow);
}
.dock-action:disabled {
    opacity: 0.56;
    color: #bdd1c5;
}
.dock-action:enabled:active {
    transform: translateY(1px);
}
.mobile-guess-dock.is-landscape .dock-status-pill {
    min-block-size: 42px;
    padding: 0.16rem 0.28rem 0.16rem 0.65rem;
}
.mobile-guess-dock.is-landscape .dock-action {
    min-block-size: 44px;
    padding-inline: 0.95rem;
    font-size: 0.86rem;
}
@media (prefers-reduced-motion: no-preference) {
    .dock-action,
    .return-start-btn {
        transition:
            background-color 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease,
            transform 120ms ease;
    }
}
</style>
