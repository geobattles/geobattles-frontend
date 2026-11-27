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
            <svg class="signal-map signal-overlay" viewBox="0 0 420 160" :preserveAspectRatio="embedded ? 'xMidYMid slice' : 'xMidYMid meet'" fill="none">
                <path v-if="tone === 'joining'" class="signal-route" d="M48 113C107 65 143 99 195 87s69-44 110-34l64-19" />
                <g v-else class="signal-break">
                    <path d="M48 113C107 65 143 99 195 87l20-7m57-25c14-5 21-5 33-2l64-19" />
                    <path d="m227 63 20 20m0-20-20 20" />
                </g>
                <circle cx="48" cy="113" r="4.5" fill="currentColor" />
                <circle cx="369" cy="34" r="13" class="signal-ring" />
                <circle cx="369" cy="34" r="4.5" fill="currentColor" />
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
    --signal: #d5fa86;
    width: min(100%, 440px);
    margin-inline: auto;
    overflow: hidden;
    color: #f4faf4;
    background:
        url("/images/atlas-relief.svg") right bottom / 26rem auto no-repeat,
        linear-gradient(155deg, #0b332af5, #051f1bf8);
    border: 1px solid color-mix(in srgb, var(--signal) 42%, #4a8c72);
    border-radius: 1.35rem;
    box-shadow:
        0 1.25rem 3.5rem #00130fb8,
        inset 0 1px #e2ffd024;
}
.connection-panel--lost {
    --signal: var(--gb-coral);
    border-color: #ff998966;
}
.connection-panel--embedded {
    border: 0;
    border-radius: 0.9rem;
    background: transparent;
    box-shadow: none;
}
.connection-panel--standalone {
    width: min(100%, 720px);
}
.signal-visual {
    position: relative;
    height: clamp(78px, 18dvh, 132px);
    overflow: hidden;
    background:
        radial-gradient(ellipse at 74% 24%, #2b6a5580, transparent 74%),
        linear-gradient(125deg, #05251ee6, #083329ad 55%, #041d17e0),
        url("/images/emerald-horizon.webp") center 42% / cover no-repeat #072821;
    color: var(--signal);
    border-bottom: 1px solid #8ddbaf38;
}
.connection-panel--embedded .signal-visual {
    border: 1px solid #8ddbaf40;
    border-radius: 0.9rem;
}
.connection-panel--lost .signal-visual {
    background:
        radial-gradient(ellipse at 74% 24%, #6a382f85, transparent 74%),
        linear-gradient(125deg, #1b2421e8, #2c211fb8 55%, #111b18e6),
        url("/images/emerald-horizon.webp") center 42% / cover no-repeat #1a2420;
    border-color: #ff998944;
}
.connection-panel--standalone .signal-visual {
    height: clamp(112px, 26dvh, 200px);
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
.signal-overlay {
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--signal) 48%, transparent));
}
.contours {
    opacity: 0.2;
}
.signal-route,
.signal-break {
    stroke-width: 2.6;
}
.signal-route {
    stroke-dasharray: 28 12;
}
.signal-break {
    stroke-dasharray: 8 5;
}
.signal-break path:last-child {
    stroke-dasharray: none;
}
.signal-ring {
    opacity: 0.6;
    stroke-width: 1.8;
}
.signal-code {
    position: absolute;
    inset: 0.75rem auto auto 0.75rem;
    max-width: calc(100% - 1.5rem);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.24rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--signal) 48%, #8ddbaf44);
    border-radius: 999px;
    background: #06241ee0;
    box-shadow: 0 4px 12px #00140f66;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #e4ffb7;
    font: 800 0.74rem / 1.35 var(--gb-font-mono);
    letter-spacing: 0.16em;
}
.connection-panel--lost .signal-code {
    color: #ffd3c8;
}
.panel-copy {
    padding: clamp(1rem, 3vw, 1.45rem);
}
.connection-panel--embedded .panel-copy {
    padding: 0.85rem 0 0;
}
.connection-panel--standalone .panel-copy {
    padding: clamp(1.25rem, 3.5vw, 2rem);
    min-width: 0;
}
.panel-title {
    margin: 0 0 0.42rem;
    font: italic 900 clamp(1.38rem, 4.8vw, 1.85rem) / 1.08 var(--gb-font-display);
    letter-spacing: -0.04em;
    color: #f6fcf5;
}
.panel-copy p {
    font-size: 0.9rem;
    color: #c8dfd5;
    line-height: 1.45;
    margin: 0;
}
.connection-panel--standalone .panel-title {
    font-size: clamp(1.55rem, 4.2vw, 2.15rem);
}
.connection-panel--standalone .panel-copy p {
    font-size: 0.96rem;
}
.panel-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 1.1rem;
}
.panel-actions :slotted(.btn) {
    min-height: 44px;
    min-width: 96px;
    padding-inline: 1.15rem;
    border-radius: 999px;
    font-weight: 800;
}
.panel-actions :slotted(.btn:not(.btn-secondary):not(.btn-danger):not(.btn-quiet)) {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow: var(--gb-scenic-action-shadow);
}
.panel-actions :slotted(.btn-secondary) {
    border-color: #94daa47a;
    background: #0a2f26e6;
    color: #effbf3;
}
.panel-actions :slotted(.btn-secondary:not(:disabled):hover) {
    border-color: #b6efa3aa;
    background: #144335;
}
@media (max-width: 600px), (max-width: 980px) and (max-height: 500px) and (orientation: landscape) {
    .connection-panel--standalone {
        display: grid;
        grid-template-rows: minmax(6.5rem, 1fr) auto;
        width: 100%;
        min-height: var(--gb-viewport-height);
        border: 0;
        border-radius: 0;
        box-shadow: none;
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
        padding: clamp(1.25rem, 5dvh, 2.25rem) max(1.25rem, env(safe-area-inset-right)) max(1.25rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left));
    }
}
@media (min-width: 480px) and (max-width: 980px) and (max-height: 500px) and (orientation: landscape) {
    .connection-panel--standalone {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
        grid-template-rows: auto;
    }
    .connection-panel--standalone .signal-visual {
        border-right: 1px solid #8ddbaf38;
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
    .connection-panel--joining .signal-route {
        animation: signal-flow 1.8s linear infinite;
    }
    .connection-panel--joining .signal-ring {
        animation: signal-search 1.5s ease-in-out infinite;
    }
    @keyframes signal-flow {
        to {
            stroke-dashoffset: -40;
        }
    }
    @keyframes signal-search {
        50% {
            opacity: 0.16;
        }
    }
}
</style>
