<template>
    <div class="landing">
        <picture class="scenery" aria-hidden="true">
            <source media="(max-width: 700px) and (orientation: portrait)" srcset="/images/emerald-lake-portrait.webp" />
            <img src="/images/emerald-lake.webp" alt="" width="1672" height="941" fetchpriority="high" />
        </picture>
        <Header scenic :install-blocked="creating || awaitingAuth" />
        <main id="main-content" class="landing-main">
            <section class="welcome" aria-labelledby="welcome-title">
                <div class="hero-brand">
                    <img src="/images/emerald-mark.svg" alt="" width="104" height="109" />
                    <h1 id="welcome-title">Geo<span>Battles</span></h1>
                </div>
                <p>Multiplayer geography guessing game.</p>
                <div class="hero-actions">
                    <NuxtLink class="hero-button play-button" to="/lobby/join">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="currentColor" d="M6 3.8a1 1 0 0 1 1.5-.86l13 8.2a1 1 0 0 1 0 1.72l-13 8.2A1 1 0 0 1 6 20.2Z" />
                        </svg>
                        Play Now
                    </NuxtLink>
                    <button class="hero-button create-button" type="button" :disabled="creating" :aria-busy="creating" @click="create">
                        <span v-if="creating" class="spinner" aria-hidden="true" /><UiIcon v-else name="plus" />
                        {{ creating ? "Creating lobby…" : "Create Lobby" }}
                    </button>
                </div>
                <NuxtLink v-if="returnCode" class="btn btn-secondary return-lobby" :to="{ path: '/lobby/' + returnCode, query: { resume: '1' } }">
                    <UiIcon name="arrow" />Return to lobby · {{ returnCode }}
                </NuxtLink>
                <PwaInstallBanner class="landing-install" placement="home" :ready="!creating && !awaitingAuth" />
            </section>
        </main>
    </div>
</template>
<script setup lang="ts">
import { createLobbyService } from "~/services/lobbyService";

const auth = useAuthStore();
const player = usePlayerInfo();
const returnHint = useLobbyReturnState();
const app = useNuxtApp();
const lobbyService = createLobbyService(useRuntimeConfig().public.BACKEND_HOST);
const savedLobby = computed(() => (returnHint.value?.playerId === player.value.ID ? returnHint.value : null));
const verifiedLobby = shallowRef<typeof savedLobby.value>(null);
const returnCode = computed(() => (verifiedLobby.value === savedLobby.value ? verifiedLobby.value?.id : undefined));
let stopReturnCheck: (() => void) | undefined;
onMounted(() => {
    stopReturnCheck = watch(
        [savedLobby, () => auth.isAuthenticated],
        ([hint, authenticated], _, cleanup) => {
            verifiedLobby.value = null;
            if (!hint || !authenticated) return;

            let request: AbortController | undefined;
            const check = async () => {
                if (document.hidden || request) return;
                const controller = new AbortController();
                request = controller;
                const timeout = window.setTimeout(() => controller.abort(), 5000);
                try {
                    const token = await auth.getValidAccessToken();
                    if (!token || controller.signal.aborted || savedLobby.value !== hint) return;
                    const status = await lobbyService.admission(hint.id, token, controller.signal);
                    if (controller.signal.aborted || savedLobby.value !== hint) return;
                    if (status.retained === true) verifiedLobby.value = hint;
                    else {
                        verifiedLobby.value = null;
                        if (["OK", "LOBBY_NOT_FOUND", "REJOIN_EXPIRED", "GAME_IN_PROGRESS", "LOBBY_FULL"].includes(status.code)) app.$gameRuntime.forgetReturnHint(hint);
                    }
                } catch {
                    // An unavailable server cannot confirm that the lobby closed.
                } finally {
                    window.clearTimeout(timeout);
                    request = undefined;
                }
            };
            const refresh = () => void check();
            const timer = window.setInterval(refresh, 15_000);
            document.addEventListener("visibilitychange", refresh);
            window.addEventListener("online", refresh);
            refresh();
            cleanup(() => {
                request?.abort();
                window.clearInterval(timer);
                document.removeEventListener("visibilitychange", refresh);
                window.removeEventListener("online", refresh);
            });
        },
        { immediate: true }
    );
});
onBeforeUnmount(() => stopReturnCheck?.());
const { createLobby } = useLobbyStore();
const toast = useToast();
const creating = ref(false);
const awaitingAuth = ref(false);
let active = true;
const create = async () => {
    if (!active || creating.value) return;
    if (!auth.isAuthenticated) {
        awaitingAuth.value = true;
        auth.openLoginDialog("guest");
        return;
    }
    awaitingAuth.value = false;
    creating.value = true;
    try {
        await createLobby();
    } catch (cause) {
        if (active) toast.add({ severity: "error", summary: "Could not create a lobby", detail: cause instanceof Error ? cause.message : "Please try again." });
    } finally {
        if (active) creating.value = false;
    }
};
watch(
    () => auth.isAuthenticated,
    (signedIn) => {
        if (signedIn && awaitingAuth.value) void create();
    }
);
watch(
    () => auth.isLoginDialog,
    (open) => {
        if (!open && !auth.isAuthenticated) awaitingAuth.value = false;
    }
);
onBeforeUnmount(() => {
    active = false;
    awaitingAuth.value = false;
});
useHead({ title: "GeoBattles" });
</script>
<style scoped>
.landing {
    --emerald-forest: #052e24;
    --emerald-lime: var(--gb-scenic-lime);
    --emerald-white: #f8fafc;
    --scenic-side: clamp(1rem, 4vw, 4rem);
    position: relative;
    isolation: isolate;
    display: flex;
    min-height: var(--gb-viewport-height);
    flex-direction: column;
    overflow: clip;
    border: 1px solid #8ce2a54d;
    border-radius: clamp(0.75rem, 1.5vw, 1.4rem);
    background: var(--emerald-forest);
    color: var(--emerald-white);
}
.return-lobby {
    min-height: 44px;
    margin-top: 0.7rem;
}
.scenery,
.scenery::after {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.scenery {
    z-index: -1;
}
.scenery img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 61% 56%;
}
.scenery::after {
    content: "";
    background:
        radial-gradient(ellipse at 36% 55%, #011810d9, #011c1580 31%, transparent 65%), linear-gradient(180deg, #001c2a33, transparent 32%, #001e1570),
        radial-gradient(ellipse at bottom left, #10b98170, transparent 42%);
}
.landing-main {
    display: grid;
    width: min(76%, 82rem);
    flex: 1;
    place-items: center;
    min-width: 0;
    padding: clamp(1.5rem, 5dvh, 4.25rem) max(var(--scenic-side), env(safe-area-inset-right)) max(clamp(1rem, 4dvh, 3rem), env(safe-area-inset-bottom))
        max(var(--scenic-side), env(safe-area-inset-left));
}
.welcome {
    width: min(100%, 40rem);
    text-align: center;
    text-shadow: 0 2px 10px #00140ebf;
}
.hero-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.45rem, 1.4vw, 1.1rem);
}
.hero-brand img {
    width: clamp(3.5rem, 8vw, 6.5rem);
    height: auto;
    flex: none;
    filter: drop-shadow(0 3px 5px #001b14bb);
}
h1 {
    color: var(--emerald-white);
    font: italic 950 clamp(2.7rem, 5.25vw, 5.4rem) / 0.99 var(--gb-font-display);
    letter-spacing: -0.06em;
    text-wrap: initial;
}
h1 span {
    color: var(--emerald-lime);
}
.welcome > p {
    margin-top: clamp(0.65rem, 1.5dvh, 1.1rem);
    font-size: clamp(1rem, 2vw, 1.38rem);
    font-weight: 600;
    line-height: 1.35;
}
.landing-install {
    width: min(100%, 32rem);
    margin: clamp(0.7rem, 2.4dvh, 1.25rem) auto 0;
}
.hero-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(0.65rem, 2vw, 1.5rem);
    width: min(100%, 36rem);
    margin: clamp(1.25rem, 4.5dvh, 2.15rem) auto 0;
}
.hero-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55em;
    min-height: 56px;
    padding: 0.55rem 0.8rem;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: clamp(0.96rem, 1.7vw, 1.22rem);
    font-weight: 800;
    line-height: 1.2;
    text-decoration: none;
    text-shadow: none;
    transition:
        background-color 160ms ease,
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 160ms ease;
}
.hero-button svg {
    width: 1.2em;
    height: 1.2em;
    flex: none;
}
.play-button {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow: var(--gb-scenic-action-shadow);
}
.play-button:hover {
    box-shadow: var(--gb-scenic-action-hover-shadow);
}
.create-button {
    border-color: #ccf2d4b3;
    color: var(--emerald-white);
    background: #05261fb8;
    backdrop-filter: blur(6px);
}
.create-button:not(:disabled):hover {
    border-color: var(--emerald-lime);
    background: #0d4233e6;
}
.create-button:disabled {
    opacity: 0.72;
}
.hero-button:not(:disabled):active {
    transform: translateY(1px);
}
.hero-button:focus-visible {
    outline-color: var(--emerald-white);
}
@media (max-width: 700px) and (orientation: portrait) {
    .scenery img {
        object-position: 53% center;
    }
    .scenery::after {
        background:
            radial-gradient(ellipse at 50% 47%, #001c14bd, #001b1473 40%, transparent 76%), linear-gradient(180deg, #001c2633, transparent 23%, #001a17ad 93%),
            radial-gradient(ellipse at bottom left, #10b98175, transparent 38%);
    }
    .landing-main {
        width: 100%;
        padding-block: clamp(1.25rem, 4dvh, 2.25rem) max(clamp(3.25rem, 17dvh, 10rem), env(safe-area-inset-bottom));
    }
    .landing-main:has(.landing-install) {
        padding-block-end: max(clamp(1.25rem, 5dvh, 3.25rem), var(--gb-safe-bottom));
    }
    .hero-brand {
        flex-direction: column;
        gap: 0.45rem;
    }
    .hero-brand img {
        width: clamp(3.6rem, 12dvh, 5.4rem);
    }
    h1 {
        font-size: clamp(2.25rem, 11.7vw, 4rem);
    }
    .welcome > p {
        max-width: 23ch;
        margin: clamp(0.7rem, 2.7dvh, 1.35rem) auto 0;
        font-size: clamp(1.04rem, 4.6vw, 1.3rem);
    }
    .hero-actions {
        grid-template-columns: minmax(0, 1fr);
        width: min(100%, 17.5rem);
        gap: clamp(0.65rem, 1.8dvh, 1.1rem);
        margin-top: clamp(1rem, 5dvh, 2.3rem);
    }
    .hero-button {
        min-height: 54px;
        font-size: 1.1rem;
    }
}
@media (max-width: 700px) and (orientation: portrait) and (max-height: 540px) {
    .landing-main {
        padding-block: 0.8rem max(1rem, env(safe-area-inset-bottom));
    }
}
@media (orientation: landscape) and (max-height: 480px) {
    .scenery img {
        object-position: 70% 61%;
    }
    .landing-main {
        --scenic-side: clamp(0.75rem, 3vw, 2rem);
        width: min(76%, 42rem);
        padding-block: 0.7rem max(0.85rem, env(safe-area-inset-bottom));
    }
    .hero-brand img {
        width: clamp(2.7rem, 9vw, 4.5rem);
    }
    h1 {
        font-size: clamp(1.85rem, 5.6vw, 3.25rem);
    }
    .welcome > p {
        margin-top: 0.35rem;
        font-size: 1rem;
    }
    .hero-actions {
        width: min(100%, 25rem);
        margin-top: clamp(0.75rem, 5dvh, 1.25rem);
        gap: 0.6rem;
    }
    .hero-button {
        min-height: 46px;
    }
}
@media (max-width: 440px) and (orientation: landscape) {
    .landing-main {
        width: 100%;
    }
}
@media (display-mode: standalone) {
    .landing {
        border-radius: 0;
        border-color: transparent;
    }
}
</style>
