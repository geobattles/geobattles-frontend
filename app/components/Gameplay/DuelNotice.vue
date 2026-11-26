<template>
    <div
        ref="notice"
        class="duel-notice"
        :class="{ 'is-live': !queued, 'duel-toast': floating }"
        :popover="floating && topLayer ? 'manual' : undefined"
        role="status"
        aria-atomic="true"
    >
        <div v-if="challengers.length" class="duel-message">
            <UiIcon name="target" />
            <span :class="{ 'many-challengers': challengers.length > 2 }" :tabindex="challengers.length > 2 ? 0 : undefined">
                <strong>{{ queued ? "Incoming Duel" : "Under attack" }}</strong>
                <span>{{ names }} challenged you{{ queued ? " for round " + round : "" }}.</span>
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ challengers: string[]; round: number; queued?: boolean; floating?: boolean; layer?: Element | null }>();
const names = computed(() => new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(props.challengers));
const notice = useTemplateRef("notice");
const topLayer = ref(false);
onMounted(() => {
    topLayer.value = typeof notice.value?.showPopover === "function";
});
watch(
    [notice, topLayer, () => props.floating, () => props.challengers.length > 0, () => props.layer],
    ([element, supported, floating, visible]) => {
        if (!element || !supported || !floating) return;
        if (element.matches(":popover-open")) element.hidePopover();
        if (visible) element.showPopover();
    },
    { flush: "post" }
);
</script>

<style scoped>
.duel-notice:empty {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    pointer-events: none;
}
.duel-message {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.72rem;
    border: 1px solid #cb827273;
    border-inline-start: 3px solid #ffa18b;
    border-radius: 0.65rem;
    background: linear-gradient(110deg, #422c27, #212a24);
    color: #ffe6dc;
    line-height: 1.3;
}
.duel-message > .ui-icon {
    flex: none;
    width: 1.25rem;
    height: 1.25rem;
    color: #ffae95;
}
.duel-message > span {
    min-width: 0;
    max-block-size: 4.5em;
    overflow: auto;
    overflow-wrap: anywhere;
    scrollbar-width: thin;
}
.duel-message strong,
.duel-message span span {
    display: block;
}
.duel-message strong {
    color: #ffb49f;
    font: 800 0.74rem / 1.3 var(--gb-font-display);
    letter-spacing: 0.045em;
    text-transform: uppercase;
}
.duel-message span span {
    font-size: 0.875rem;
    font-weight: 620;
}
.is-live .duel-message {
    box-shadow: 0 3px 12px #171c1966;
}
.is-live {
    pointer-events: none;
}
.is-live .many-challengers {
    pointer-events: auto;
}
.is-live .duel-message strong {
    font-size: 1rem;
    font-style: italic;
    letter-spacing: 0;
    text-transform: none;
}
.duel-toast {
    position: fixed;
    z-index: 4600;
    inset: calc(var(--gb-safe-top, 0px) + 3.55rem) auto auto 50%;
    translate: -50% 0;
    inline-size: max-content;
    max-inline-size: min(22rem, calc(100% - 1.8rem));
    margin: 0;
    padding: 0;
    border: 0;
    overflow: visible;
    background: transparent;
    pointer-events: none;
}
.duel-toast .duel-message {
    box-shadow: 0 0.35rem 1.5rem #11080495;
}
.duel-toast .many-challengers {
    pointer-events: auto;
}
@media (prefers-reduced-motion: no-preference) {
    .duel-toast .duel-message {
        animation: duel-toast-in 180ms ease-out;
    }
    @keyframes duel-toast-in {
        from {
            opacity: 0;
            transform: translateY(-0.35rem);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
}
</style>
