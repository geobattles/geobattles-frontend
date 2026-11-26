<template>
    <div class="error-screen">
        <picture class="error-scenery" aria-hidden="true">
            <source media="(max-width: 700px) and (orientation: portrait)" srcset="/images/emerald-horizon-portrait.webp" />
            <img src="/images/emerald-horizon.webp" alt="" width="1672" height="941" />
        </picture>
        <header class="error-header">
            <img src="/images/emerald-mark.svg" width="29" height="31" alt="" />
            <span>Geo<strong>Battles</strong></span>
        </header>
        <main class="error-main" aria-labelledby="error-title">
            <div class="error-hero">
                <svg class="error-route" viewBox="0 0 400 164" fill="none" aria-hidden="true" focusable="false">
                    <g class="error-contours">
                        <path
                            d="M0 41c89 4 108-35 173-24 70 12 55 36 116 30s76-18 111-14M0 57c91 2 112-35 174-24 71 13 61 37 116 33 49-4 76-15 110-14M0 74c90 0 118-37 174-24 74 18 64 41 117 36 49-4 74-14 109-13"
                        />
                        <path d="M0 140c89-6 124-40 176-27 70 17 59 38 118 34 47-3 72-15 106-16M0 154c92-9 123-36 176-24 61 14 65 37 118 33 46-4 80-11 106-14" />
                        <circle cx="317" cy="83" r="55" />
                    </g>
                    <path class="error-trail" d="M41 113c62 15 82-48 145-32 39 10 50 35 78 19" />
                    <circle class="error-origin" cx="41" cy="113" r="5" />
                    <circle class="error-waypoint" cx="317" cy="83" r="41" />
                    <path class="error-question" d="M305 70a12 12 0 1 1 19 10c-5 4-7 6-7 11m0 10v1" />
                </svg>
                <div class="error-copy">
                    <p class="error-code"><span class="sr-only">Error </span>{{ code }}</p>
                    <h1 v-if="missing" id="error-title">Page <em>not found</em></h1>
                    <h1 v-else id="error-title">Couldn’t open this page</h1>
                    <p class="error-description">
                        {{ missing ? "This page may have moved or the link may be incorrect." : "An error interrupted this page. You can continue from Home." }}
                    </p>
                    <button type="button" class="scenic-button scenic-button-primary" @click="goHome"><UiIcon name="home" />Back to Home</button>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const code = computed(() => props.error.statusCode || 500);
const missing = computed(() => code.value === 404);
const goHome = () => clearError({ redirect: "/" });
useHead({
    title: () => (missing.value ? "Page not found · GeoBattles" : "Page unavailable · GeoBattles"),
    htmlAttrs: { lang: "en" },
    meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=contain" },
        { name: "theme-color", content: "#062620" },
    ],
});
</script>

<style scoped>
.error-screen {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-rows: auto 1fr;
    min-block-size: var(--gb-viewport-height);
    border: 1px solid #6eba935a;
    border-radius: clamp(0.65rem, 1.4vw, 1.4rem);
    background: #062620;
    color: #f7fdf9;
}
.error-scenery,
.error-scenery::after {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.error-scenery {
    overflow: hidden;
    border-radius: inherit;
    z-index: -1;
}
.error-scenery img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 53% 53%;
}
.error-scenery::after {
    background: radial-gradient(ellipse at 50% 52%, #042723f2 10%, #052b24d9 39%, #05282321 89%), linear-gradient(180deg, #042c254a, transparent 30%, #041e1b61);
    content: "";
}
.error-header {
    display: flex;
    align-items: center;
    gap: 0.48rem;
    padding: max(0.65rem, var(--gb-safe-top)) max(1.2rem, var(--gb-safe-right)) 0.65rem max(1.2rem, var(--gb-safe-left));
    border-radius: inherit;
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    border-block-end: 1px solid #85d49a3b;
    background:
        linear-gradient(90deg, #052821f2, #062620ca),
        url("/images/atlas-relief.svg") 55% 42% / 42rem auto;
    font: italic 900 clamp(1.15rem, 2.4vw, 1.5rem) / 1 var(--gb-font-display);
    letter-spacing: -0.045em;
}
.error-header strong,
.error-copy em {
    color: #dfff9c;
}
.error-main {
    display: grid;
    place-items: center;
    padding: 1rem max(1rem, var(--gb-safe-right)) max(1.5rem, var(--gb-safe-bottom)) max(1rem, var(--gb-safe-left));
}
.error-hero {
    display: grid;
    justify-items: center;
    gap: 0.8rem;
    width: min(100%, 64rem);
    text-align: center;
}
.error-route {
    display: block;
    width: min(100%, 32rem);
    height: auto;
}
.error-contours {
    stroke: #b2f7ad4d;
    stroke-width: 0.8;
}
.error-trail {
    stroke: #dfff9c;
    stroke-width: 2.8;
    stroke-linecap: round;
    stroke-dasharray: 5 7;
}
.error-origin {
    fill: #dfff9c;
}
.error-waypoint {
    stroke: #cfff9b;
    stroke-width: 1.5;
    fill: #174438d9;
    filter: drop-shadow(0 0 0.65rem #c7f88b60);
}
.error-question {
    stroke: #e4ffa9;
    stroke-width: 4;
    stroke-linecap: round;
}
.error-copy {
    display: grid;
    justify-items: center;
    gap: 0.85rem;
    min-width: 0;
}
.error-code {
    padding: 0.28rem 0.7rem;
    border: 1px solid #cbf79a68;
    border-radius: 999px;
    background: #193d2d;
    color: #e2ffa8;
    font: 800 0.9rem / 1.2 var(--gb-font-mono);
    letter-spacing: 0.12em;
}
.error-copy h1 {
    font: italic 900 clamp(2.45rem, 6vw, 4.5rem) / 1.02 var(--gb-font-display);
    letter-spacing: -0.055em;
}
.error-description {
    max-width: 29rem;
    color: #e1f2e9;
}
.error-copy button {
    margin-block-start: 0.55rem;
    min-inline-size: min(100%, 12rem);
}
@media (max-width: 700px) and (orientation: portrait) {
    .error-scenery::after {
        background: linear-gradient(180deg, #052823e0 5%, #052823db 55%, #05282382 78%, #05282340);
    }
    .error-copy h1 {
        font-size: clamp(2rem, 9vw, 3.8rem);
    }
}
@media (orientation: landscape) and (max-height: 540px) and (min-width: 520px) {
    .error-scenery::after {
        background: linear-gradient(90deg, #05282377, #052823ef 58%, #052823ca);
    }
    .error-header {
        padding-block: max(0.35rem, var(--gb-safe-top)) 0.35rem;
    }
    .error-hero {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
    }
    .error-copy h1 {
        font-size: clamp(1.9rem, 4.8vw, 3.3rem);
    }
}
</style>
