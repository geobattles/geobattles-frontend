<template>
    <div class="connection-announcement" role="status" aria-atomic="true">
        <Transition name="connection-fade">
            <div
                v-if="status"
                class="connection-strip"
                :class="`connection-strip--${status}`"
                data-testid="connection-banner"
                :data-tone="status === 'restored' ? 'sage' : status === 'offline' ? 'coral' : 'amber'"
            >
                <UiIcon :name="status === 'restored' ? 'check' : 'wifi'" />
                <div>
                    <strong>{{ statusText[status] }}</strong>
                    <span v-if="subtitle">{{ subtitle }}</span>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { ConnectionNotice } from "~/composables/socketState";

const props = defineProps<{ status: ConnectionNotice | null; roundRunning: boolean }>();
const statusText = {
    weak: "Connection is slow",
    offline: "You’re offline",
    reconnecting: "Reconnecting to lobby…",
    restored: "Connection restored",
};
const subtitle = computed(() => {
    if (!props.status || props.status === "weak" || props.status === "restored") return "";
    if (props.roundRunning) return "The round timer is still running.";
    return props.status === "offline" ? "We’ll retry when you’re back online." : "";
});
</script>

<style scoped>
.connection-strip {
    --notice-color: var(--gb-gold);
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: fit-content;
    max-width: 100%;
    margin-inline: auto;
    padding: 0.44rem 0.68rem;
    border: 1px solid color-mix(in srgb, var(--notice-color), transparent 58%);
    border-radius: 0.75rem;
    background: var(--gb-bg);
    color: var(--notice-color);
    font-size: 0.83rem;
    line-height: 1.3;
    box-shadow: 0 4px 18px #00181080;
}
.connection-strip--restored {
    --notice-color: var(--gb-success);
}
.connection-strip--offline {
    --notice-color: var(--gb-coral);
}
.connection-strip strong,
.connection-strip span {
    display: block;
}
.connection-strip span {
    margin-top: 0.14rem;
    color: var(--gb-text);
    font-size: 0.75rem;
}
.connection-strip .ui-icon {
    flex: none;
    width: 1.2rem;
    height: 1.2rem;
}
@media (prefers-reduced-motion: no-preference) {
    .connection-fade-enter-active,
    .connection-fade-leave-active {
        transition:
            opacity 160ms ease,
            transform 160ms ease;
    }
    .connection-fade-enter-from,
    .connection-fade-leave-to {
        opacity: 0;
        transform: translateY(0.18rem);
    }
}
</style>
