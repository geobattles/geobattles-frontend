<template>
    <section
        class="cinematic-transition"
        :class="{ 'cinematic-active': animate, 'cinematic-failed': failed }"
        :style="{ '--cinematic-duration': duration + 'ms' }"
        :data-testid="failed ? 'connection-lost' : 'connection-joining'"
        :aria-labelledby="titleId"
    >
        <div class="scene" aria-hidden="true">
            <picture>
                <source media="(max-width: 700px) and (orientation: portrait)" srcset="/images/emerald-horizon-portrait.webp" />
                <img src="/images/emerald-horizon.webp" alt="" width="1672" height="941" fetchpriority="high" />
            </picture>
            <div class="mist" />
            <div class="destination" />
            <div class="shade" />
        </div>
        <div class="cinematic-header">
            <span class="brand"
                ><img src="/images/emerald-mark.svg" alt="" width="30" height="32" /><span>Geo<b>Battles</b></span></span
            >
            <div v-if="$slots.cancel" class="cancel"><slot name="cancel" /></div>
        </div>
        <div class="copy">
            <h1 :id="titleId">{{ title }}</h1>
            <p :role="failed ? undefined : 'status'">{{ subtitle }}</p>
            <div v-if="$slots.default" class="actions"><slot /></div>
        </div>
    </section>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ title: string; subtitle: string; duration?: number; failed?: boolean; animate?: boolean }>(), { duration: 2000, animate: true });
const titleId = useId();
</script>
<style scoped>
.cinematic-transition {
    --horizon-x: 64%;
    --horizon-y: 44%;
    --scene-space: clamp(1rem, 5vw, 5rem);
    position: fixed;
    isolation: isolate;
    z-index: 30;
    inset: 0;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 1rem;
    overflow: auto;
    padding: max(1rem, env(safe-area-inset-top)) max(var(--scene-space), env(safe-area-inset-right)) max(clamp(1.5rem, 8dvh, 5rem), env(safe-area-inset-bottom))
        max(var(--scene-space), env(safe-area-inset-left));
    color: #f8fafc;
    background: #061a16;
}
.scene,
.scene > picture,
.shade,
.mist {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.scene {
    z-index: -1;
    overflow: hidden;
}
.scene img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 57% 50%;
}
.shade {
    background: linear-gradient(180deg, #041b1c97, transparent 24%, transparent 44%, #031715c9 89%, #041815ef), linear-gradient(70deg, #021815b5, transparent 66%);
}
.mist {
    background: radial-gradient(ellipse 45% 14% at var(--horizon-x) var(--horizon-y), #c0eee646, transparent);
}
.destination {
    position: absolute;
    top: var(--horizon-y);
    left: var(--horizon-x);
    width: clamp(5rem, 22vw, 24rem);
    aspect-ratio: 1;
    translate: -50% -50%;
    border-radius: 50%;
    background: radial-gradient(circle, #d7fee587 0, #72eab346 6%, #33c98924 28%, transparent 68%);
    opacity: 0.75;
}
.cinematic-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.55rem;
}
.brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font: italic 900 clamp(1.04rem, 2vw, 1.4rem) / 1 var(--gb-font-display);
    letter-spacing: -0.045em;
    text-shadow: 0 1px 10px #001913;
}
.brand b {
    color: #92f582;
}
.copy {
    align-self: end;
    max-width: 49rem;
    padding-bottom: 1px;
    text-shadow: 0 2px 14px #001912;
}
.copy h1 {
    font: 900 clamp(2.35rem, 5.5vw, 5.3rem) / 1.02 var(--gb-font-display);
    letter-spacing: -0.062em;
    text-wrap: initial;
}
.copy p {
    margin-top: 0.65rem;
    color: #d9eee4;
    font-size: clamp(0.975rem, 1.6vw, 1.25rem);
    line-height: 1.4;
}
.cancel :deep(.btn),
.actions :deep(.btn) {
    min-width: 44px;
    min-height: 44px;
    border-radius: 999px;
}
.cancel :deep(.btn) {
    border-color: #b4e5cf7a;
    background: #052e24b8;
    color: #f8fafc;
}
.cancel :deep(.btn:hover) {
    border-color: #c9f5de;
    background: #133e31;
}
.actions {
    margin-top: 1rem;
}
.cinematic-failed .destination {
    opacity: 0;
}
.horizon-leave-active {
    transition: opacity 320ms ease;
    pointer-events: none;
}
.horizon-leave-to {
    opacity: 0;
}
@media (prefers-reduced-motion: no-preference) {
    .cinematic-active .scene > picture {
        transform-origin: var(--horizon-x) var(--horizon-y);
        animation: horizon-approach var(--cinematic-duration) cubic-bezier(0.22, 0.6, 0.35, 1) both;
    }
    .cinematic-active .brand,
    .cinematic-active .copy {
        animation: horizon-copy 400ms ease-out both;
    }
    .cinematic-active .mist {
        animation: horizon-mist var(--cinematic-duration) ease-out both;
    }
    .cinematic-active:not(.cinematic-failed) .destination {
        animation: horizon-beacon var(--cinematic-duration) ease-out both;
    }
    .cinematic-active.cinematic-failed .scene > picture,
    .cinematic-active.cinematic-failed .mist {
        animation-play-state: paused;
    }
    .horizon-leave-active.cinematic-transition:not(.cinematic-failed) .destination {
        animation: horizon-arrival 320ms ease-out both;
    }
}
@keyframes horizon-approach {
    from {
        opacity: 0.45;
        transform: scale(1.01);
    }
    to {
        opacity: 1;
        transform: scale(1.075);
    }
}
@keyframes horizon-copy {
    from {
        opacity: 0.3;
    }
}
@keyframes horizon-mist {
    from {
        opacity: 0.2;
        transform: translateX(-1.2%);
    }
    to {
        opacity: 0.8;
        transform: translateX(1.2%);
    }
}
@keyframes horizon-beacon {
    0%,
    20% {
        opacity: 0;
    }
    70%,
    100% {
        opacity: 0.75;
    }
}
@keyframes horizon-arrival {
    from {
        transform: scale(0.9);
    }
    to {
        transform: scale(2.8);
        opacity: 0.25;
    }
}
@media (prefers-reduced-motion: reduce) {
    .horizon-leave-active {
        transition-duration: 120ms;
    }
}
@media (max-width: 700px) and (orientation: portrait) {
    .cinematic-transition {
        --horizon-x: 54%;
        --horizon-y: 44%;
        padding-bottom: max(clamp(1.75rem, 10dvh, 5rem), env(safe-area-inset-bottom));
    }
    .copy {
        width: min(100%, 26rem);
        margin-inline: auto;
        text-align: center;
    }
    .copy h1 {
        font-size: clamp(2.2rem, 9vw, 3.5rem);
        text-wrap: balance;
    }
}
@media (orientation: landscape) and (max-height: 480px) {
    .cinematic-transition {
        --scene-space: clamp(1rem, 4vw, 2.8rem);
        gap: 0.5rem;
        padding-block: max(0.4rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-bottom));
    }
    .copy h1 {
        font-size: clamp(1.8rem, 5.8vw, 3.1rem);
    }
    .copy p {
        margin-top: 0.3rem;
    }
    .actions {
        margin-top: 0.55rem;
    }
}
</style>
