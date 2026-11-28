<template>
    <div class="landing">
        <TransitionsCinematicTransition v-if="showJourneyPreview" title="Entering your lobby" subtitle="Lobby confirmed. Opening the room…" confirmed preview>
            <template #cancel><NuxtLink class="btn btn-secondary" to="/" replace>Close preview</NuxtLink></template>
        </TransitionsCinematicTransition>
        <picture class="scenery" aria-hidden="true">
            <source media="(orientation: portrait)" srcset="/images/emerald-home-portrait.webp" />
            <img src="/images/emerald-horizon.webp" alt="" width="1672" height="941" fetchpriority="high" />
        </picture>
        <Header account-only :install-blocked="launchBusy">
            <NuxtLink
                v-if="returnCode"
                class="btn btn-secondary return-lobby"
                :aria-label="`Return to lobby · ${returnCode}`"
                :to="{ path: '/lobby/' + returnCode, query: { resume: '1' } }"
            >
                <UiIcon name="arrow" class="return-icon" /><span>Return to lobby</span><span class="return-code">{{ returnCode }}</span>
            </NuxtLink>
        </Header>
        <main id="main-content" class="welcome" aria-labelledby="welcome-title">
            <div class="hero-brand">
                <img src="/images/emerald-mark.svg" alt="" width="104" height="109" />
                <h1 id="welcome-title">Geo<span>Battles</span></h1>
            </div>
            <div class="hero-description">
                <p>Multiplayer geography guessing game.</p>
                <div class="geo-accent" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                        <path
                            fill="currentColor"
                            fill-rule="evenodd"
                            d="M12 1a8 8 0 0 0-8 8c0 4.7 6.2 12.2 7.4 13.7a.8.8 0 0 0 1.2 0C13.8 21.2 20 13.7 20 9a8 8 0 0 0-8-8Zm0 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        />
                    </svg>
                </div>
            </div>
            <div class="hero-actions">
                <NuxtLink class="hero-button join-button" to="/lobby/list">
                    <UiIcon name="users" />
                    Join a Lobby
                </NuxtLink>
                <button class="hero-button create-button" type="button" :disabled="launchBusy" :aria-busy="creating" @click="create">
                    <span v-if="creating" class="spinner" aria-hidden="true" />
                    <UiIcon v-else name="plus" />
                    {{ creating ? "Creating lobby…" : "Create Lobby" }}
                </button>
            </div>
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
                        if (["OK", "LOBBY_NOT_FOUND", "REJOIN_EXPIRED", "GAME_IN_PROGRESS", "LOBBY_FULL", "SPECTATORS_FULL"].includes(status.code))
                            app.$gameRuntime.forgetReturnHint(hint);
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
const { create, creating, awaitingAuth } = useLobbyCreation();
const route = useRoute();
const showJourneyPreview = computed(() => import.meta.dev && route.query.lobbyJourney === "1");
const launchBusy = computed(() => creating.value || awaitingAuth.value);

useHead({ title: "GeoBattles" });
</script>
<style scoped>
.landing {
    --lime: #a9f15b;
    --forest: #092b22;
    position: relative;
    isolation: isolate;
    block-size: var(--gb-viewport-height);
    overflow: clip;
    background: var(--forest);
    color: #f8fdfb;
    font-family: var(--gb-font-display);
}
.scenery,
.scenery::after,
.landing::after {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.scenery {
    z-index: -2;
    overflow: hidden;
}
.scenery img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 52%;
    animation: scenery-in 430ms ease-out both;
}
.scenery::after {
    content: "";
    background: linear-gradient(90deg, #062920e6, #082b22b3 30%, transparent 66%), linear-gradient(0deg, #092b2290, transparent 40%);
}
.landing::after {
    content: "";
    z-index: -1;
    background: url("/images/atlas-relief.svg") left bottom / 47rem auto no-repeat;
    mask-image: radial-gradient(ellipse at left bottom, #000 4%, transparent 60%);
    opacity: 0.72;
}
.welcome {
    display: grid;
    align-content: center;
    justify-items: start;
    gap: clamp(1.1rem, 3vh, 2rem);
    height: 100%;
    padding-inline: max(var(--gb-safe-left), clamp(1.75rem, 10vw, 12rem)) max(var(--gb-safe-right), 1.75rem);
    padding-block: max(3.5rem, var(--gb-safe-top)) max(1rem, var(--gb-safe-bottom));
}
.hero-brand {
    display: flex;
    align-items: center;
    gap: 0.25em;
    font-size: clamp(2.65rem, 5.5vw, 5.1rem);
    animation: content-in 330ms 100ms ease-out both;
}
.hero-brand img {
    inline-size: 1.38em;
    block-size: auto;
}
.hero-brand h1 {
    font: italic 900 1em / 1 var(--gb-font-display);
    letter-spacing: -0.048em;
    text-shadow: 0 2px 14px #051b16a8;
}
.hero-brand span {
    color: var(--lime);
}
.hero-description {
    animation: content-in 350ms 220ms ease-out both;
}
.hero-description p {
    max-width: 22ch;
    font: italic 700 clamp(1.2rem, 2.4vw, 2.05rem) / 1.16 var(--gb-font-display);
    text-wrap: balance;
    text-shadow: 0 2px 14px #051b16da;
}
.geo-accent {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    width: min(100%, 13rem);
    margin-block-start: clamp(0.55rem, 2vh, 1rem);
    color: var(--lime);
}
.geo-accent::before,
.geo-accent::after {
    content: "";
    flex: 1;
    height: 1.5px;
    border-radius: 1em;
    background: linear-gradient(90deg, transparent, currentColor);
}
.geo-accent::after {
    background: linear-gradient(270deg, transparent, currentColor);
}
.geo-accent svg {
    width: clamp(1.1rem, 3.2vh, 1.8rem);
}
.hero-actions {
    display: flex;
    align-items: center;
    gap: clamp(0.6rem, 2vw, 1.3rem);
}
.hero-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.65em;
    min-height: 46px;
    padding: 0.4em 1.15em;
    border: 1.5px solid #a6c6a9;
    border-radius: 100vmax;
    font: 750 clamp(1rem, 2vw, 1.5rem) / 1.1 var(--gb-font-display);
    white-space: nowrap;
    text-decoration: none;
    transition:
        transform 140ms ease,
        background-color 160ms ease,
        box-shadow 160ms ease;
    animation: content-in 340ms 310ms ease-out backwards;
}
.hero-button :is(svg, .spinner) {
    flex: none;
    width: 1.15em;
    height: 1.15em;
}
.hero-button:not(:disabled):active {
    transform: scale(0.975);
}
.hero-button:focus-visible {
    outline: 2px solid #f4ffc6;
    outline-offset: 4px;
}
.join-button {
    min-height: clamp(3.3rem, 8vh, 5rem);
    border-color: #e1ffab;
    background: linear-gradient(157deg, #efff9c, #c9fc74 49%, #77e661);
    color: #092c1b;
    font-size: clamp(1.28rem, 2.55vw, 2rem);
    font-weight: 900;
    box-shadow:
        inset 0 1px 2px #ffffffa8,
        0 0 1.2rem #a7fa5263;
}
.join-button:hover {
    box-shadow:
        inset 0 1px 2px #ffffffa8,
        0 0 1.5rem #a7fa5293;
}
.create-button {
    min-height: clamp(2.9rem, 6.9vh, 4.2rem);
    background: #0b3429a8;
    color: #f8fdfb;
    animation-delay: 390ms;
}
.create-button:enabled:hover {
    background-color: #154b3a;
}
.create-button:disabled {
    cursor: wait;
}
.return-lobby {
    gap: 0.44rem;
    min-height: 36px;
    padding: 0.22rem 0.34rem 0.22rem 0.72rem;
    border: 1px solid #ffffff5c;
    border-radius: 999px;
    background: linear-gradient(155deg, #ffffff2e, #ffffff14);
    box-shadow:
        0 6px 20px #00000036,
        inset 0 1px #ffffff54;
    backdrop-filter: blur(14px) saturate(135%);
    -webkit-backdrop-filter: blur(14px) saturate(135%);
    color: #ffffff;
    font-size: 0.76rem;
    font-weight: 740;
    text-shadow: 0 1px 6px #00000045;
    transition:
        background-color 150ms ease,
        border-color 150ms ease,
        box-shadow 150ms ease,
        transform 140ms ease;
}
.return-lobby:hover {
    border-color: #ffffff8c;
    background: linear-gradient(155deg, #ffffff42, #ffffff22);
    box-shadow:
        0 8px 24px #00000044,
        inset 0 1px #ffffff72;
    color: #ffffff;
}
.return-lobby:active {
    transform: scale(0.98);
}
.return-icon {
    width: 0.92rem;
    height: 0.92rem;
    color: #ffffffeb;
}
.return-code {
    padding: 0.14rem 0.48rem;
    border: 1px solid #ffffff42;
    border-radius: 999px;
    background: #ffffff26;
    color: #ffffff;
    font: 760 0.69rem / 1.2 var(--gb-font-mono);
    letter-spacing: 0.06em;
}
@keyframes scenery-in {
    from {
        opacity: 0.25;
        transform: scale(1.02);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
@keyframes content-in {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
@media (orientation: portrait) {
    .scenery img {
        object-position: center;
    }
    .scenery::after {
        background: linear-gradient(180deg, #06271e38, transparent 38%, #082e202e 43%, #092b2280 54%, #092b223c 63%, #092b220a 82%);
    }
    .landing::after {
        background:
            url("/images/atlas-relief.svg") right -3rem top -1rem / 24rem auto no-repeat,
            url("/images/atlas-relief.svg") left -9rem bottom 1rem / 29rem auto no-repeat;
        mask-image: radial-gradient(ellipse 52% 20% at 100% 0, #000, transparent), radial-gradient(ellipse 60% 27% at 0 94%, #000, transparent);
    }
    .welcome {
        grid-template-rows: minmax(0, 45%) auto auto 1fr;
        align-content: initial;
        justify-items: center;
        gap: 0;
        padding-inline: var(--gb-safe-left) var(--gb-safe-right);
        padding-block: 0 var(--gb-safe-bottom);
        text-align: center;
    }
    .hero-brand {
        align-self: start;
        margin-top: max(calc(var(--gb-viewport-height) * 0.103), calc(var(--gb-safe-top) + 2.75rem));
        font-size: clamp(1.78rem, 7.45vw, 3.8rem);
    }
    .hero-description p {
        max-width: 23ch;
        padding-inline: 0.65rem;
        font-size: clamp(1.18rem, min(5.55vw, 3vh), 2.05rem);
    }
    .geo-accent {
        width: min(76%, 15rem);
        margin-inline: auto;
        margin-block-start: clamp(0.45rem, 1.75vh, 0.9rem);
    }
    .hero-actions {
        width: min(83%, 30rem);
        flex-direction: column;
        gap: clamp(0.55rem, 2.8vh, 1.55rem);
        margin-block-start: clamp(0.75rem, 3.85vh, 2.25rem);
    }
    .hero-button {
        width: 100%;
    }
    .join-button {
        min-height: clamp(3.25rem, 10.2vh, 6rem);
        font-size: clamp(1.32rem, min(6.9vw, 3.9vh), 2.3rem);
    }
    .create-button {
        width: 93%;
        min-height: clamp(2.875rem, 7.9vh, 4.85rem);
        font-size: clamp(1.03rem, min(5.1vw, 3.2vh), 1.7rem);
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .scenery::after {
        background: linear-gradient(90deg, #072920ba, #08282035 54%, #08282083), linear-gradient(0deg, #08292075, transparent 65%);
    }
    .welcome {
        grid-template-areas: "brand actions" "description actions";
        grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
        align-items: center;
        column-gap: clamp(1rem, 8vw, 5rem);
        row-gap: 0.65rem;
        padding-inline: max(var(--gb-safe-left), 6vw) max(var(--gb-safe-right), 6vw);
    }
    .hero-brand {
        grid-area: brand;
        font-size: clamp(1.75rem, 4.65vw, 3.5rem);
    }
    .hero-description {
        grid-area: description;
    }
    .hero-description p {
        font-size: clamp(1rem, 2.9vw, 1.65rem);
    }
    .hero-actions {
        grid-area: actions;
        width: 100%;
        flex-direction: column;
        gap: 0.7rem;
    }
    .hero-button {
        width: 100%;
    }
}
@media (prefers-reduced-motion: reduce) {
    .scenery img,
    .hero-brand,
    .hero-description,
    .hero-button {
        animation: none;
        transition: none;
    }
}
</style>
