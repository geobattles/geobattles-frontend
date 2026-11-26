<template>
    <div class="closure-scene">
        <picture class="closure-scenery" aria-hidden="true">
            <source media="(max-width: 700px) and (orientation: portrait)" srcset="/images/emerald-horizon-portrait.webp" />
            <img src="/images/emerald-horizon.webp" width="1672" height="941" alt="" />
        </picture>
        <header class="closure-header">
            <span class="closure-brand"
                ><img src="/images/emerald-mark.svg" alt="" width="29" height="31" /> <span>Geo<strong>Battles</strong></span></span
            >
        </header>
        <main id="main-content" class="closure-content" :aria-labelledby="titleId">
            <div class="closure-hero">
                <SocketClosureRouteIllustration class="closure-illustration" />
                <div class="closure-copy">
                    <div class="closure-message">
                        <p class="closure-code"><UiIcon name="lock" /><span class="sr-only">Lobby code </span>{{ code }}</p>
                        <h1 :id="titleId" ref="title" tabindex="-1" :aria-describedby="descriptionId">Lobby <span>Closed</span></h1>
                        <p :id="descriptionId" class="closure-description">This lobby is no longer available.</p>
                    </div>
                    <div class="closure-actions">
                        <button class="closure-action closure-primary" type="button" :disabled="creating || !socket.isOnline" :aria-busy="creating" @click="create">
                            <UiIcon :name="creating ? 'clock' : 'plus'" />{{ creating ? "Creating lobby…" : "New Lobby" }}
                        </button>
                        <NuxtLink to="/" replace class="closure-action closure-home"><UiIcon name="home" />Home</NuxtLink>
                    </div>
                </div>
            </div>
        </main>
        <Login />
    </div>
</template>

<script setup lang="ts">
defineProps<{ code: string }>();

const id = useId();
const titleId = id + "-title";
const descriptionId = id + "-description";
const title = ref<HTMLElement | null>(null);
const socket = useWebSocketStore();
const { create, creating } = useLobbyCreation();

useHead({ title: "Lobby Closed" });
onMounted(() => title.value?.focus({ preventScroll: true }));
</script>

<style scoped>
.closure-scene {
    --closure-duration: 2400ms;
    --closure-lime: #dfff9c;
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    block-size: var(--gb-viewport-height);
    overflow: clip;
    border: 1px solid #69ad8b68;
    border-radius: clamp(0.65rem, 1.4vw, 1.5rem);
    background: #062620;
    color: #f7fdf9;
}
.closure-scene::before,
.closure-scenery {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.closure-scenery {
    z-index: -2;
}
.closure-scenery img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    object-position: 50% 53%;
}
.closure-scene::before {
    z-index: -1;
    background: radial-gradient(ellipse at 50% 52%, #052823f8 9%, #042722e8 30%, #052622a1 56%, #0526220d 82%), linear-gradient(180deg, #03242043, transparent 42%, #042f2866);
    content: "";
}
.closure-header {
    display: flex;
    align-items: center;
    min-block-size: 3.5rem;
    padding: max(0.45rem, var(--gb-safe-top)) max(clamp(0.8rem, 3vw, 2.6rem), var(--gb-safe-right)) 0.45rem max(clamp(0.8rem, 3vw, 2.6rem), var(--gb-safe-left));
    border-block-end: 1px solid #85d49a3b;
    background:
        linear-gradient(90deg, #052821f5, #062620de),
        url("/images/atlas-relief.svg") 70% 45% / 44rem auto;
}
.closure-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.46rem;
    font: italic 900 clamp(1.1rem, 2vw, 1.55rem) / 1 var(--gb-font-display);
    letter-spacing: -0.045em;
}
.closure-brand strong {
    color: var(--closure-lime);
}
.closure-content {
    min-block-size: 0;
    overflow: auto;
}
.closure-hero {
    display: grid;
    align-content: center;
    justify-items: center;
    min-block-size: 100%;
    padding: 0.75rem max(0.85rem, var(--gb-safe-right)) max(clamp(1.1rem, 5vh, 4.1rem), var(--gb-safe-bottom)) max(0.85rem, var(--gb-safe-left));
    text-align: center;
}
.closure-illustration {
    inline-size: min(100%, 41rem);
    margin-block-end: -0.2rem;
}
.closure-copy,
.closure-message {
    display: grid;
    justify-items: center;
    min-inline-size: 0;
}
.closure-message {
    gap: clamp(0.75rem, 1.9vh, 1.25rem);
}
.closure-code {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-block-size: 2rem;
    margin: 0;
    padding: 0.25rem 0.7rem;
    border: 1px solid #ff9582bc;
    border-radius: 999px;
    background: #4d251fee;
    color: #ffd0be;
    font: 800 0.95rem / 1 var(--gb-font-mono);
    letter-spacing: 0.12em;
    box-shadow:
        inset 0 0 0.8rem #fa835214,
        0 0 1.4rem #f8685547;
}
h1 {
    margin: 0;
    font: italic 900 clamp(2.35rem, 6.1vw, 4.65rem) / 1.03 var(--gb-font-display);
    letter-spacing: -0.055em;
    text-wrap: balance;
}
h1 span {
    color: var(--closure-lime);
}
.closure-description {
    margin: 0;
    color: #e1efe7;
    font-size: clamp(0.95rem, 2.3vw, 1.23rem);
    line-height: 1.45;
}
.closure-actions {
    display: grid;
    grid-template-columns: minmax(10rem, 1.25fr) minmax(8rem, 1fr);
    gap: clamp(0.55rem, 2.5vw, 1rem);
    inline-size: min(100%, 26rem);
    margin-block-start: clamp(1.3rem, 3.5vh, 2.1rem);
}
.closure-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-block-size: 48px;
    padding: 0.55rem 0.9rem;
    border: 1px solid transparent;
    border-radius: 999px;
    font: 800 1rem / 1.2 var(--gb-font-display);
    text-decoration: none;
    cursor: pointer;
}
.closure-primary {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow: var(--gb-scenic-action-shadow);
}
.closure-primary:enabled:hover {
    box-shadow: var(--gb-scenic-action-hover-shadow);
}
.closure-primary:disabled {
    opacity: 0.72;
    cursor: default;
}
.closure-home {
    border-color: #79bb8aa3;
    background: #082c24dc;
    color: #f7fdf9;
}
.closure-home:hover {
    background: #143d32;
    color: #f7fdf9;
}
.closure-action:focus-visible {
    outline: 2px solid var(--closure-lime);
    outline-offset: 4px;
}
.closure-action:active:not(:disabled) {
    transform: translateY(1px);
}

@media (max-width: 700px) and (orientation: portrait) {
    .closure-scene::before {
        background: linear-gradient(180deg, #10413738, transparent 34%, #06292380 68%, #05221918 87%, #031d1870);
    }
    .closure-scenery {
        inset-block-start: auto;
        block-size: 48%;
        mask-image: linear-gradient(180deg, transparent, #000 74%);
    }
    .closure-scenery img {
        object-position: center top;
    }
    .closure-hero {
        padding-block-end: max(clamp(1.1rem, 8vh, 4.2rem), var(--gb-safe-bottom));
    }
    .closure-illustration {
        inline-size: min(100%, 29rem);
        margin-block-end: 0.35rem;
    }
    h1 {
        font-size: clamp(2rem, 10.3vw, 3.65rem);
    }
    .closure-actions {
        grid-template-columns: minmax(0, 1fr);
        inline-size: min(100%, 17.75rem);
    }
    .closure-copy {
        inline-size: 100%;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .closure-scene::before {
        background: linear-gradient(90deg, #05282370, #062923f2 56%, #052823da), linear-gradient(0deg, #052923b8, transparent 38%);
    }
    .closure-header {
        min-block-size: 2.8rem;
    }
    .closure-brand img {
        inline-size: 1.4rem;
        block-size: auto;
    }
    .closure-hero {
        grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr);
        align-items: center;
        max-inline-size: 66rem;
        margin-inline: auto;
    }
    .closure-copy {
        inline-size: 100%;
    }
    .closure-message {
        gap: 0.65rem;
    }
    .closure-illustration {
        margin: 0;
    }
    h1 {
        font-size: clamp(1.85rem, 5.1vw, 3.2rem);
    }
    .closure-description {
        font-size: 0.95rem;
    }
    .closure-actions {
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
        margin-block-start: 1rem;
    }
    .closure-action {
        min-block-size: 44px;
        padding-inline: 0.55rem;
        font-size: 0.9rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .closure-scenery {
        animation: closure-scenery var(--closure-duration) ease-out both;
    }
    .closure-message {
        animation: closure-message var(--closure-duration) ease-out both;
    }
    .closure-actions {
        animation: closure-actions var(--closure-duration) ease-out both;
    }
    @keyframes closure-scenery {
        0% {
            opacity: 0;
        }
        21%,
        100% {
            opacity: 1;
        }
    }
    @keyframes closure-message {
        0%,
        69% {
            opacity: 0;
            transform: translateY(0.45rem);
        }
        92%,
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes closure-actions {
        0%,
        74% {
            opacity: 0.87;
        }
        95%,
        100% {
            opacity: 1;
        }
    }
}
</style>
