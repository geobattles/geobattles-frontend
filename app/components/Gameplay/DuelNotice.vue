<template>
    <div
        ref="notice"
        class="duel-notice"
        :class="{ 'is-live': !queued, 'is-compact': compact, 'duel-toast': floating }"
        :popover="floating && topLayer ? 'manual' : undefined"
        role="status"
        aria-atomic="true"
    >
        <div v-if="challengers.length" class="duel-message">
            <span class="duel-badge-icon" aria-hidden="true"><UiIcon name="target" /></span>
            <span v-if="compact && !queued" class="duel-inline-copy">
                <strong>Duel</strong>
                <span class="duel-dot" aria-hidden="true">·</span>
                <span class="duel-names">{{ compactNames }}</span>
                <span class="sr-only"> — {{ names }} challenged you.</span>
            </span>
            <span v-else :class="{ 'many-challengers': challengers.length > 2 }" :tabindex="challengers.length > 2 ? 0 : undefined">
                <strong>{{ queued ? "Incoming Duel" : "Duel Active" }}</strong>
                <span>{{ names }} challenged you{{ queued ? " for round " + round : "" }}.</span>
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ challengers: string[]; round: number; queued?: boolean; floating?: boolean; compact?: boolean; layer?: Element | null }>();
const names = computed(() => new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(props.challengers));
const compactNames = computed(() => {
    if (props.challengers.length <= 2) return props.challengers.join(" & ");
    return `${props.challengers[0]} +${props.challengers.length - 1}`;
});
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
    gap: 0.52rem;
    padding: 0.42rem 0.72rem 0.42rem 0.5rem;
    border: 1px solid #ff998966;
    border-radius: 0.95rem;
    background: linear-gradient(135deg, #3b1e1fe8, #142622f0);
    box-shadow:
        0 6px 20px #00140f8c,
        inset 0 1px #ffd4ca22;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #ffeae4;
    line-height: 1.25;
}
.duel-badge-icon {
    display: inline-grid;
    place-items: center;
    inline-size: 1.65rem;
    block-size: 1.65rem;
    flex: none;
    border-radius: 50%;
    background: #ff8e7c28;
    color: #ffab9a;
}
.duel-badge-icon > .ui-icon {
    width: 1rem;
    height: 1rem;
}
.duel-message > span:not(.duel-badge-icon) {
    min-width: 0;
    max-block-size: 4.5em;
    overflow: auto;
    overflow-wrap: anywhere;
    scrollbar-width: thin;
}
.duel-message:not(.is-compact) strong,
.duel-message:not(.is-compact) span > span:not(.duel-dot):not(.duel-names) {
    display: block;
}
.duel-message strong {
    color: #ffb8a5;
    font: 800 0.72rem / 1.2 var(--gb-font-display);
    letter-spacing: 0.045em;
    text-transform: uppercase;
}
.duel-message span > span {
    font-size: 0.82rem;
    font-weight: 640;
}
.is-live {
    pointer-events: none;
}
.is-live .many-challengers {
    pointer-events: auto;
}
.is-live.is-compact .duel-message {
    gap: 0.38rem;
    padding: 0.24rem 0.65rem 0.24rem 0.34rem;
    border-radius: 999px;
}
.is-live.is-compact .duel-badge-icon {
    inline-size: 1.4rem;
    block-size: 1.4rem;
}
.is-live.is-compact .duel-badge-icon > .ui-icon {
    width: 0.85rem;
    height: 0.85rem;
}
.duel-inline-copy {
    display: inline-flex;
    align-items: baseline;
    gap: 0.3rem;
    min-inline-size: 0;
    white-space: nowrap;
    overflow: hidden;
}
.is-live.is-compact .duel-inline-copy strong {
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    flex: none;
}
.duel-dot {
    color: #ff998996;
    font-weight: 800;
    flex: none;
}
.duel-names {
    font-size: 0.76rem !important;
    font-weight: 760 !important;
    color: #fff2ee;
    overflow: hidden;
    text-overflow: ellipsis;
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
    box-shadow: 0 8px 24px #11080495;
}
.duel-toast .many-challengers {
    pointer-events: auto;
}
@media (prefers-reduced-motion: no-preference) {
    .duel-toast .duel-message,
    .is-live .duel-message {
        animation: duel-toast-in 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes duel-toast-in {
        from {
            opacity: 0;
            transform: translateY(-0.35rem) scale(0.96);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
}
</style>
