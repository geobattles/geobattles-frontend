<template>
    <div class="connection-announcement" role="status" aria-atomic="true">
        <div v-if="status" class="connection-strip" :class="`connection-strip--${status}`" data-testid="connection-banner" :data-tone="status === 'restored' ? 'sage' : 'amber'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
                <path v-if="status === 'restored'" d="m5 12 5 5L20 7" />
                <g v-else>
                    <path class="outer-signal" d="M2.5 8.5a15 15 0 0 1 19 0" />
                    <path d="M6 12a10 10 0 0 1 12 0m-9 3.5a5 5 0 0 1 6 0" />
                    <circle cx="12" cy="19" r="1" fill="currentColor" />
                </g>
            </svg>
            <div>
                <strong>{{ title }}</strong>
                <span v-if="subtitle">{{ subtitle }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ status: "reconnecting" | "offline" | "restored" | null; roundRunning: boolean }>();
const title = computed(() => (props.status === "restored" ? "Connection restored" : props.status === "offline" ? "You’re offline" : "Reconnecting…"));
const subtitle = computed(() => {
    if (props.status === "restored") return "";
    if (props.roundRunning) return "The round keeps running.";
    return props.status === "offline" ? "We’ll retry when your connection returns." : "Restoring your lobby.";
});
</script>

<style scoped>
.connection-strip {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    border: 1px solid #ac8549;
    border-radius: var(--gb-radius);
    padding: 0.52rem 0.75rem;
    background: #2e2618;
    color: #ffda8d;
    font-size: 0.875rem;
    box-shadow: 0 4px 18px #0005;
}
.connection-strip--restored {
    color: var(--gb-accent);
    background: #232d1f;
    border-color: #688956;
}
.connection-strip strong,
.connection-strip span {
    display: block;
}
.connection-strip span {
    color: var(--gb-text);
    font-size: 0.75rem;
}
.connection-strip svg {
    flex: none;
    width: 21px;
    height: 21px;
}
.connection-strip--reconnecting .outer-signal {
    animation: signal-search 1.2s ease-in-out 4;
}
@keyframes signal-search {
    50% {
        opacity: 0.28;
    }
}
@media (prefers-reduced-motion: reduce) {
    .connection-strip--reconnecting .outer-signal {
        animation: none;
    }
}
</style>
