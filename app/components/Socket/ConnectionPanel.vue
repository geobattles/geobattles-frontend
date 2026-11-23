<template>
    <section
        class="connection-panel"
        :class="[`connection-panel--${tone}`, embedded ? 'connection-panel--embedded' : 'connection-panel--standalone']"
        :data-testid="`connection-${tone}`"
    >
        <div class="signal-visual" aria-hidden="true">
            <svg class="signal-map" viewBox="0 0 420 160" preserveAspectRatio="xMidYMid slice" fill="none">
                <g class="contours">
                    <path
                        d="M-35 48c78 49 112-28 173 1s34 90 117 96 105-40 198 4M-32 66c77 49 104-27 160-1s30 93 124 99 107-39 199 5M-33 85c76 49 99-26 147-4s28 96 128 101M46-22c71 33 153-12 188 40s-5 83 54 91 91-27 166 11M84-30c71 36 143-9 170 40s1 78 46 80 86-26 151 12M121-35c68 34 132-5 152 36s9 70 40 70 80-21 131 11"
                    />
                </g>
            </svg>
            <svg class="signal-map" viewBox="0 0 420 160" :preserveAspectRatio="embedded ? 'xMidYMid slice' : 'xMidYMid meet'" fill="none">
                <path v-if="tone === 'joining'" class="signal-route" d="M48 113C107 65 143 99 195 87s69-44 110-34l64-19" />
                <g v-else class="signal-break">
                    <path d="M48 113C107 65 143 99 195 87l20-7m57-25c14-5 21-5 33-2l64-19" />
                    <path d="m227 63 20 20m0-20-20 20" />
                </g>
                <circle cx="48" cy="113" r="4" fill="currentColor" />
                <circle cx="369" cy="34" r="12" class="signal-ring" />
                <circle cx="369" cy="34" r="4" fill="currentColor" />
            </svg>
            <span v-if="code" class="signal-code">{{ code }}</span>
        </div>
        <div class="panel-copy">
            <h2 v-if="!embedded" class="panel-title" :role="tone === 'joining' ? 'status' : undefined">{{ title }}</h2>
            <p>{{ description }}</p>
            <div v-if="$slots.default" class="panel-actions"><slot /></div>
        </div>
    </section>
</template>

<script setup lang="ts">
defineProps<{ tone: "joining" | "lost"; title: string; description: string; code?: string | null; embedded?: boolean }>();
</script>

<style scoped>
.connection-panel {
    --signal: var(--gb-accent);
    width: min(100%, 420px);
    margin-inline: auto;
    overflow: hidden;
    color: var(--gb-text);
    background: var(--gb-surface);
    border: 1px solid color-mix(in srgb, var(--signal) 38%, var(--gb-bg));
    border-radius: 1rem;
}
.connection-panel--lost {
    --signal: var(--gb-coral);
}
.connection-panel--embedded {
    border: 0;
    background: transparent;
}
.connection-panel--standalone {
    width: min(100%, 720px);
}
.signal-visual {
    position: relative;
    height: clamp(72px, 18dvh, 128px);
    overflow: hidden;
    background: radial-gradient(ellipse at 74% 24%, #275848, transparent 76%), linear-gradient(135deg, #092b25, var(--gb-bg));
    color: var(--signal);
    border-bottom: 1px solid var(--gb-line);
}
.connection-panel--lost .signal-visual {
    background: radial-gradient(ellipse at 74% 24%, #443731, transparent 76%), linear-gradient(135deg, #162a23, var(--gb-bg));
}
.connection-panel--standalone .signal-visual {
    height: clamp(104px, 25dvh, 195px);
}
.signal-map {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    stroke: currentColor;
    stroke-linecap: round;
}
.contours {
    opacity: 0.19;
}
.signal-route,
.signal-break {
    stroke-width: 2.5;
}
.signal-route {
    stroke-dasharray: 34 10;
}
.signal-break {
    stroke-dasharray: 8 5;
}
.signal-break path:last-child {
    stroke-dasharray: none;
}
.signal-ring {
    opacity: 0.65;
}
.signal-code {
    position: absolute;
    inset: 0.75rem auto auto 0.75rem;
    max-width: calc(100% - 1.5rem);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.22rem 0.42rem;
    border: 1px solid var(--gb-line);
    background: var(--gb-bg);
    border-radius: 3px;
    font: 700 0.76rem / 1.5 var(--gb-font-mono);
    letter-spacing: 0.15em;
}
.panel-copy {
    padding: clamp(0.875rem, 3vw, 1.25rem);
}
.connection-panel--embedded .panel-copy {
    padding: 0.8rem 0 0;
}
.connection-panel--standalone .panel-copy {
    padding: clamp(1.25rem, 3vw, 2rem);
    min-width: 0;
}
.panel-title {
    margin: 0 0 0.3rem;
    font-size: clamp(1.3rem, 5vw, 1.7rem);
    line-height: 1.16;
}
.panel-copy p {
    font-size: 0.875rem;
    color: var(--gb-muted);
    margin: 0;
}
.connection-panel--standalone .panel-title {
    font-size: clamp(1.45rem, 4vw, 2rem);
}
.connection-panel--standalone .panel-copy p {
    font-size: 0.975rem;
}
.panel-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.9rem;
}
.panel-actions :slotted(.btn) {
    min-height: 44px;
    min-width: 80px;
}
.connection-panel--standalone .panel-actions :deep(.btn) {
    min-width: 96px;
    min-height: 44px;
    font-size: 0.875rem;
}
@media (max-width: 600px), (max-width: 980px) and (max-height: 500px) and (orientation: landscape) {
    .connection-panel--standalone {
        display: grid;
        grid-template-rows: minmax(6rem, 1fr) auto;
        width: 100%;
        min-height: var(--gb-viewport-height);
        border: 0;
        border-radius: 0;
    }
    .connection-panel--standalone .signal-visual {
        height: auto;
        min-width: 0;
    }
    .connection-panel--standalone .signal-code {
        top: max(0.875rem, env(safe-area-inset-top));
        left: max(0.875rem, env(safe-area-inset-left));
    }
    .connection-panel--standalone .panel-copy {
        padding: clamp(1.25rem, 5dvh, 2.5rem) max(1.25rem, env(safe-area-inset-right)) max(1.25rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left));
    }
}
@media (min-width: 480px) and (max-width: 980px) and (max-height: 500px) and (orientation: landscape) {
    .connection-panel--standalone {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
        grid-template-rows: auto;
    }
    .connection-panel--standalone .signal-visual {
        border-right: 1px solid var(--gb-line);
        border-bottom: 0;
    }
    .connection-panel--standalone .panel-copy {
        align-self: center;
        min-height: 0;
        padding-top: max(1rem, env(safe-area-inset-top));
        padding-bottom: max(1rem, env(safe-area-inset-bottom));
    }
}
@media (prefers-reduced-motion: no-preference) {
    .connection-panel--joining .signal-ring {
        animation: signal-search 1.25s ease-in-out 3;
    }
    @keyframes signal-search {
        50% {
            opacity: 0.18;
        }
    }
}
</style>
