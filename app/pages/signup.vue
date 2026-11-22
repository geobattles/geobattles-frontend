<template>
    <main id="main-content" class="auth-page" :style="viewportStyle">
        <picture class="auth-scenery" aria-hidden="true">
            <source media="(max-width: 760px) and (orientation: portrait)" srcset="/images/emerald-lake-portrait.webp" />
            <img src="/images/emerald-lake.webp" alt="" fetchpriority="high" />
        </picture>
        <div class="auth-stage">
            <section class="auth-surface auth-card" aria-labelledby="auth-page-title" data-viewport-scroll>
                <header class="auth-card-header" data-viewport-sticky>
                    <NuxtLink to="/" class="auth-back" aria-label="Back to homepage"><UiIcon name="arrow" /></NuxtLink>
                    <h1 id="auth-page-title">{{ title }}</h1>
                </header>
                <UiAuthExperience v-model:mode="mode" @submitting="rememberNavigation" @authenticated="finish" />
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
const mode = ref<"login" | "guest" | "register">("register");
const viewportStyle = useViewportFit();
const titles = { login: "Sign in", guest: "Play as guest", register: "Create account" };
const title = computed(() => titles[mode.value]);
const router = useRouter();
const app = useNuxtApp();
let isNavigationCurrent: (() => boolean) | undefined;

function rememberNavigation() {
    isNavigationCurrent = app.$gameRuntime.captureNavigation();
}

function finish() {
    if (isNavigationCurrent?.()) void router.push("/");
}

useHead({ title });
</script>

<style scoped>
.auth-page {
    position: relative;
    height: var(--gb-viewport-height);
    overflow: hidden;
    background: #052e24;
}
.auth-scenery,
.auth-scenery img,
.auth-page::after {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.auth-scenery img {
    object-fit: cover;
    object-position: center 52%;
}
.auth-page::after {
    content: "";
    background: linear-gradient(90deg, #031c1a0a 20%, #021b1abc), linear-gradient(0deg, #0219158f, transparent 55%);
}
.auth-stage {
    position: absolute;
    z-index: 1;
    inset-inline: 0;
    top: var(--visible-top, 0px);
    display: grid;
    justify-items: end;
    align-items: center;
    height: var(--visible-height, var(--gb-viewport-height));
    padding: max(0.5rem, var(--gb-safe-top)) max(clamp(1rem, 9vw, 10rem), var(--gb-safe-right)) max(0.5rem, var(--gb-safe-bottom)) max(1rem, var(--gb-safe-left));
}
.auth-card {
    width: min(100%, 31rem);
    max-height: 100%;
    min-height: 0;
}
.auth-card-header {
    position: sticky;
    z-index: 1;
    top: 0;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.65rem var(--auth-pad);
    border-bottom: 1px solid #b5f7dd29;
    background: linear-gradient(110deg, #0b352feb, #062320f5);
}
.auth-card-header h1 {
    margin: 0;
    font-size: 1.25rem;
}
.auth-back {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 0.7rem;
    border: 1px solid #a5ead847;
    background: #b2f8df0a;
    color: #e7fff8;
}
.auth-back:hover {
    background: #b2f8df23;
}
.auth-back .ui-icon {
    rotate: 180deg;
}
.auth-card :deep(.auth-experience) {
    padding: var(--auth-pad);
}
.auth-card:has([data-auth-compact]) .auth-card-header {
    padding-block: 0;
    background: #0b302b;
}
.auth-card:has([data-auth-compact]) .auth-back:focus-visible {
    outline-offset: -3px;
}
.auth-card:has([data-auth-short]) .auth-card-header {
    display: none;
}
.auth-page:has([data-auth-compact]) .auth-scenery {
    visibility: hidden;
}
:global(.app-root:has(.auth-page) > .build-notice) {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}
@media (max-width: 760px) {
    .auth-stage {
        justify-items: center;
        padding-inline: max(0.65rem, env(safe-area-inset-left)) max(0.65rem, env(safe-area-inset-right));
    }
    .auth-page::after {
        background: linear-gradient(0deg, #02221bb8, #031f1659 60%, #0824182e);
    }
}
@media (orientation: landscape) and (max-height: 500px) and (min-width: 560px) {
    .auth-stage {
        justify-items: center;
        padding-inline: max(0.75rem, env(safe-area-inset-left)) max(0.75rem, env(safe-area-inset-right));
    }
    .auth-card {
        width: min(100%, 40rem);
    }
    .auth-card-header {
        padding-block: 0.25rem;
    }
}
</style>
