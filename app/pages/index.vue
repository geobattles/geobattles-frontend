<template>
    <div class="landing">
        <TransitionsCinematicTransition v-if="showJourneyPreview" title="Entering your lobby" subtitle="Lobby confirmed. Opening the room…" confirmed preview>
            <template #cancel><NuxtLink class="btn btn-secondary" to="/" replace>Close preview</NuxtLink></template>
        </TransitionsCinematicTransition>
        <picture class="scenery" aria-hidden="true">
            <img src="/images/emerald-lake.webp" alt="" width="1672" height="941" fetchpriority="high" />
        </picture>
        <Header :install-blocked="launchBusy" />
        <main id="main-content" class="landing-main">
            <section class="welcome" aria-labelledby="welcome-title">
                <div class="hero-identity">
                    <p class="hero-kicker">Multiplayer geography game</p>
                    <div class="hero-brand">
                        <img src="/images/emerald-mark.svg" alt="" width="104" height="109" />
                        <h1 id="welcome-title">Geo<span>Battles</span></h1>
                    </div>
                    <p class="hero-tagline">Compete. Explore. <em>Guess the World.</em></p>
                    <p class="hero-description">A multiplayer geography guessing game.<br />Create a lobby, invite friends, and test your knowledge of places around the globe.</p>
                    <p class="hero-subtitle">Multiplayer geography guessing game.</p>
                    <HomeRouteIllustration class="hero-route" />
                </div>
                <div class="hero-launch">
                    <div class="launch-panel">
                        <div class="launch-heading">
                            <div class="launch-crest" aria-hidden="true">
                                <svg viewBox="0 0 34 23" focusable="false">
                                    <path fill="#b9f184" d="M1 22 13 2l9 15 5-9 7 14Z" />
                                    <path fill="#ecffda" d="m9 9 4-7 4 7-4 3Z" />
                                </svg>
                            </div>
                            <h2>Start a <em>New Game</em></h2>
                            <p>Create a lobby or join an existing one with a lobby code.</p>
                        </div>
                        <div class="hero-actions">
                            <button class="scenic-button create-button" type="button" :disabled="launchBusy" :aria-busy="creating" @click="create">
                                <span v-if="creating" class="spinner" aria-hidden="true" /><UiIcon v-else name="plus" />
                                {{ creating ? "Creating lobby…" : "Create Lobby" }}
                                <UiIcon class="create-arrow" name="arrow" />
                            </button>
                            <p class="action-divider" aria-hidden="true">or</p>
                            <div class="join-card">
                                <div class="join-label">
                                    <NuxtLink class="join-title" to="/lobby/join"><UiIcon name="users" />Join Lobby</NuxtLink>
                                    <p class="join-help">Enter a lobby code to join a game.</p>
                                </div>
                                <form class="join-form" @submit.prevent="joinByCode">
                                    <div class="code-entry">
                                        <UiIcon name="key" />
                                        <label class="sr-only" :for="codeId">Lobby code</label>
                                        <input
                                            :id="codeId"
                                            ref="codeField"
                                            v-model="code"
                                            type="text"
                                            placeholder="Enter lobby code"
                                            autocomplete="off"
                                            autocapitalize="characters"
                                            spellcheck="false"
                                            enterkeyhint="go"
                                            :aria-invalid="codeError ? true : undefined"
                                            :aria-describedby="codeError ? codeErrorId : undefined"
                                            @input="codeError = ''"
                                            @paste="pasteCode"
                                        />
                                    </div>
                                    <button class="scenic-button join-submit" type="submit" aria-label="Join with code" :disabled="launchBusy" :aria-busy="joining">
                                        <span v-if="joining" class="spinner" aria-hidden="true" />
                                        <template v-else><UiIcon name="arrow" class="submit-arrow" /><UiIcon name="play" class="submit-play" /></template>
                                    </button>
                                </form>
                            </div>
                        </div>
                        <p v-if="codeError" :id="codeErrorId" class="code-error" role="alert">{{ codeError }}</p>
                    </div>
                    <NuxtLink v-if="returnCode" class="scenic-button return-lobby" :to="{ path: '/lobby/' + returnCode, query: { resume: '1' } }">
                        <UiIcon name="arrow" />Return to lobby · {{ returnCode }}
                    </NuxtLink>
                    <PwaInstallBanner class="landing-install" placement="home" :ready="!launchBusy" />
                </div>
                <ul v-for="(features, layout) in featureRows" :key="layout" :class="['home-features', 'features-' + layout]" aria-label="Game features" role="list">
                    <li v-for="feature in features" :key="feature.title">
                        <UiIcon :name="feature.icon" />
                        <div>
                            <strong>{{ feature.title }}</strong>
                            <p>{{ feature.description }}</p>
                        </div>
                    </li>
                </ul>
            </section>
        </main>
    </div>
</template>
<script setup lang="ts">
import { createLobbyService } from "~/services/lobbyService";
import { parseLobbyCode } from "~/utils/lobbyCode";

const featureRows = {
    wide: [
        { icon: "users", title: "Play Together", description: "Compete with friends or players worldwide." },
        { icon: "globe", title: "Real Locations", description: "Explore amazing places across the globe." },
        { icon: "bolt", title: "Powerups", description: "Use strategy to get the edge." },
        { icon: "trophy", title: "Climb the Ranks", description: "Earn points and reach the top." },
    ],
    portrait: [
        { icon: "gamepad", title: "Play", description: "with friends" },
        { icon: "trophy", title: "Compete", description: "for the top rank" },
        { icon: "map", title: "Explore", description: "the world" },
    ],
};

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
const router = useRouter();
const route = useRoute();
const showJourneyPreview = computed(() => import.meta.dev && route.query.lobbyJourney === "1");
const code = ref("");
const codeError = ref("");
const joining = ref(false);
const launchBusy = computed(() => creating.value || awaitingAuth.value || joining.value);
const codeId = useId();
const codeErrorId = codeId + "-error";
const codeField = useTemplateRef("codeField");

function pasteCode(event: ClipboardEvent) {
    const parsed = parseLobbyCode(event.clipboardData?.getData("text") ?? "", window.location.origin);
    if ("error" in parsed) return;
    event.preventDefault();
    code.value = parsed.code;
    codeError.value = "";
}

async function joinByCode() {
    if (launchBusy.value) return;
    const parsed = parseLobbyCode(code.value, window.location.origin);
    if ("error" in parsed) {
        codeError.value = parsed.error;
        codeField.value?.focus();
        return;
    }
    codeError.value = "";
    joining.value = true;
    codeField.value?.blur();
    try {
        await router.push({ path: "/lobby/join", query: { id: parsed.code } });
    } catch {
        codeError.value = "Couldn’t open Join Lobby. Please try again.";
    } finally {
        joining.value = false;
    }
}

useHead({ title: "GeoBattles" });
</script>
<style scoped>
.landing {
    --emerald-lime: #d3ff89;
    --emerald-white: #f8fafc;
    --scenic-side: clamp(1rem, 8vw, 9.25rem);
    --entry-fill: linear-gradient(148deg, #e4ffa8, #cbff76 48%, #aaf25b);
    --entry-glow: inset 0 1px 2px #fff9, 0 0 1.45rem #afff5678, 0 0.45rem 1.15rem #163d2269;
    position: relative;
    isolation: isolate;
    display: flex;
    min-block-size: var(--gb-viewport-height);
    flex-direction: column;
    overflow: clip;
    border: 1px solid #8ce2a54d;
    border-radius: clamp(0.75rem, 1.5vw, 1.4rem);
    background: #062720;
    color: var(--emerald-white);
}
.scenery,
.scenery::after,
.landing::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.scenery {
    z-index: -3;
    overflow: hidden;
}
.scenery img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 55% 52%;
}
.scenery::after {
    content: "";
    background:
        radial-gradient(ellipse 80% 62% at 22% 60%, #03251ff5 10%, #032922bf 49%, transparent 100%), linear-gradient(90deg, #04251e8d, #07332b3a 61%, transparent 92%),
        linear-gradient(0deg, #05241b91, transparent 30%);
}
.landing::before {
    content: "";
    z-index: -1;
    background: url("/images/atlas-relief.svg") 65% 12% / 78rem auto no-repeat;
    mask-image: radial-gradient(ellipse at 60% 30%, #000, transparent 68%);
    opacity: 0.66;
}
.landing-main {
    display: grid;
    align-items: center;
    flex: 1 0 auto;
    width: min(100%, 116rem);
    margin-inline: auto;
    min-inline-size: 0;
    padding: clamp(1.3rem, 4dvh, 3.5rem) max(var(--scenic-side), var(--gb-safe-right)) max(clamp(1.6rem, 7dvh, 5rem), var(--gb-safe-bottom))
        max(var(--scenic-side), var(--gb-safe-left));
}
.welcome {
    width: min(100%, 71rem);
}
.hero-identity,
.hero-launch {
    min-inline-size: 0;
}
.hero-identity {
    text-shadow: 0 3px 1rem #021b16bf;
}
.hero-kicker {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 0.8rem clamp(0rem, 5.5vw, 5.3rem);
    color: #e2f7f1;
    font: 800 clamp(0.67rem, 1.1vw, 0.86rem) / 1.4 var(--gb-font-mono);
    letter-spacing: 0.16em;
    text-transform: uppercase;
}
.hero-kicker::before,
.hero-kicker::after,
.action-divider::before,
.action-divider::after,
.launch-crest::before,
.launch-crest::after {
    content: "";
    block-size: 1px;
    background: #c0e6c188;
}
.hero-kicker::before,
.hero-kicker::after {
    width: 1.3rem;
}
.hero-brand {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1.5vw, 1.2rem);
}
.hero-brand img {
    width: clamp(3.65rem, 7vw, 6.35rem);
    height: auto;
    flex: none;
    filter: drop-shadow(0 3px 0.45rem #021d16b3);
}
h1 {
    font: italic 950 clamp(3.1rem, 6.6vw, 6.6rem) / 1 var(--gb-font-display);
    letter-spacing: -0.064em;
}
h1 span,
.hero-tagline em,
.launch-heading em {
    color: var(--emerald-lime);
}
.hero-tagline {
    margin-block-start: 0.7rem;
    font: italic 850 clamp(1.45rem, 2.8vw, 2.6rem) / 1.12 var(--gb-font-display);
    letter-spacing: -0.037em;
    text-wrap: balance;
}
.hero-description {
    max-inline-size: 29rem;
    margin-block-start: clamp(0.9rem, 2.1dvh, 1.5rem);
    color: #f0f9f4;
    font-size: clamp(1rem, 1.6vw, 1.25rem);
    line-height: 1.37;
}
.hero-subtitle,
.hero-route,
.launch-heading,
.action-divider,
.join-help,
.submit-play {
    display: none;
}
.hero-launch {
    margin-block-start: clamp(1.3rem, 4.4dvh, 2.6rem);
}
.hero-actions {
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) minmax(0, 1.65fr);
    gap: clamp(0.65rem, 1.45vw, 1.15rem);
}
.create-button,
.join-submit {
    border-color: #e7ffb3;
    background: var(--entry-fill);
    color: #07271a;
    box-shadow: var(--entry-glow);
}
.create-button {
    gap: clamp(0.5rem, 1.15vw, 0.85rem);
    min-block-size: clamp(3.55rem, 8dvh, 4.75rem);
    font-size: clamp(1.08rem, 2vw, 1.56rem);
    white-space: nowrap;
}
.create-button .ui-icon {
    width: 1.3em;
    height: 1.3em;
}
.create-button:enabled:hover,
.join-submit:enabled:hover {
    border-color: #f2ffd1;
    background: linear-gradient(148deg, #edffbd, #d5ff86 52%, #b3f66a);
}
.create-button:disabled,
.join-submit:disabled {
    opacity: 0.72;
}
.join-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: clamp(0.52rem, 1.25vw, 1.1rem);
    min-inline-size: 0;
    padding: 0.48rem clamp(0.45rem, 1vw, 0.85rem);
    border: 1px solid #d3ff989b;
    border-radius: 999px;
    background: linear-gradient(140deg, #0d352ce8, #052922ee);
    box-shadow:
        inset 0 1px #eeffb92b,
        0 0.55rem 1.65rem #021b1769;
}
.join-label {
    min-width: 0;
}
.join-title {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-block-size: 44px;
    padding-inline: clamp(0.45rem, 0.95vw, 0.8rem);
    border-inline-end: 1px solid #a7dc9c38;
    color: var(--emerald-white);
    font-size: clamp(1rem, 1.85vw, 1.46rem);
    font-weight: 850;
    line-height: 1.1;
    text-decoration: none;
    white-space: nowrap;
}
.join-title .ui-icon {
    color: #deffbd;
}
.join-title:hover {
    color: var(--emerald-lime);
}
.join-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    min-inline-size: 0;
}
.code-entry {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    min-inline-size: 0;
    padding-inline: 0.7rem;
    border: 1px solid #92d0ab69;
    border-radius: 999px;
    background: #06251e70;
}
.code-entry:focus-within {
    border-color: #d7ffa5;
    box-shadow: 0 0 0 2px #baff764a;
}
.code-entry .ui-icon {
    color: #d5f9bc;
}
.code-entry input {
    flex: 1;
    min-inline-size: 0;
    min-block-size: 44px;
    padding: 0.4rem 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--emerald-white);
    font: 600 1rem / 1.2 var(--gb-font-display);
}
.code-entry input::placeholder {
    color: #c5ded3;
    font-weight: 400;
}
.join-submit {
    inline-size: clamp(2.8rem, 4.1vw, 3.4rem);
    min-block-size: clamp(2.8rem, 4.1vw, 3.4rem);
    padding: 0;
    border-radius: 50%;
    font-size: 1.1rem;
    box-shadow:
        inset 0 1px 2px #fff8,
        0 0 1rem #c5ff6166;
}
.code-error {
    width: fit-content;
    max-width: 100%;
    margin: 0.65rem 0 0 auto;
    padding: 0.46rem 0.8rem;
    border: 1px solid #ffb19a80;
    border-radius: 0.6rem;
    background: #382723f5;
    color: #ffddcf;
    font-size: 0.88rem;
}
.return-lobby,
.landing-install {
    margin-block-start: 0.75rem;
}
.landing-install {
    max-width: 28rem;
}
.home-features {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    max-width: 65.5rem;
    margin: clamp(1.4rem, 4.3dvh, 2.6rem) 0 0;
    padding: 0;
    list-style: none;
}
.home-features li {
    display: flex;
    align-items: flex-start;
    gap: clamp(0.45rem, 1vw, 0.85rem);
    min-width: 0;
    padding-inline: clamp(0.5rem, 1.35vw, 1.2rem);
}
.home-features li:first-child {
    padding-inline-start: 0;
}
.home-features li + li {
    border-inline-start: 1px solid #d2f9b24d;
}
.home-features .ui-icon {
    width: clamp(1.5rem, 3vw, 2.3rem);
    height: auto;
    color: #b8ff84;
    filter: drop-shadow(0 0 0.42rem #a4fa6570);
}
.features-wide li:nth-child(3) .ui-icon {
    color: #edff8c;
}
.features-wide li:nth-child(4) .ui-icon {
    color: #ffc56e;
    filter: drop-shadow(0 0 0.42rem #ffb04970);
}
.home-features strong {
    display: block;
    color: #f6fff9;
    font-size: clamp(0.86rem, 1.45vw, 1.12rem);
    line-height: 1.18;
}
.home-features p {
    margin-block-start: 0.35rem;
    color: #dcefe3;
    font-size: clamp(0.76rem, 1.2vw, 0.94rem);
    line-height: 1.35;
}
.features-portrait {
    display: none;
}

@media (max-width: 820px) and (orientation: portrait) {
    .scenery {
        inset-block-start: max(3.6rem, var(--gb-safe-top));
        inset-block-end: auto;
        block-size: clamp(15rem, 36dvh, 29rem);
    }
    .scenery img {
        object-position: 51% 48%;
    }
    .scenery::after {
        background: linear-gradient(180deg, transparent 18%, #052a2240 46%, #062720d4 83%, #062720);
    }
    .landing::before {
        background-position: 50% 63%;
        mask-image: linear-gradient(180deg, transparent 22%, #000 54%, #000 89%, transparent 100%);
    }
    .landing::after {
        content: "";
        position: absolute;
        z-index: -2;
        inset: auto 0 0;
        block-size: clamp(5rem, 20dvh, 11.8rem);
        pointer-events: none;
        background:
            linear-gradient(180deg, #70b84b1e, #04462db5 72%, #062720),
            url("/images/emerald-horizon.webp") 50% 27% / cover no-repeat;
        mask-image: linear-gradient(0deg, #000 53%, transparent);
    }
    .landing-main {
        align-items: start;
        justify-items: center;
        padding: clamp(1.7rem, 8.3dvh, 5rem) max(1.2rem, var(--gb-safe-right)) max(1.9rem, var(--gb-safe-bottom)) max(1.2rem, var(--gb-safe-left));
    }
    .welcome {
        width: min(100%, 29rem);
        text-align: center;
    }
    .hero-kicker,
    .hero-tagline,
    .hero-description,
    .create-arrow,
    .features-wide {
        display: none;
    }
    .hero-brand {
        flex-direction: column;
        gap: 0.5rem;
    }
    .hero-brand img {
        width: clamp(3.25rem, 9.35dvh, 5.1rem);
    }
    h1 {
        font-size: clamp(2.4rem, 11.9vw, 4.65rem);
    }
    .hero-subtitle {
        display: block;
        margin-block-start: 0.4rem;
        font-size: clamp(0.99rem, 4.1vw, 1.2rem);
        font-weight: 650;
        line-height: 1.3;
    }
    .hero-route {
        display: block;
        width: min(95%, 20rem);
        height: auto;
        margin: 0.55rem auto 0;
    }
    .hero-launch {
        margin-block-start: 0.7rem;
    }
    .hero-actions {
        grid-template-columns: minmax(0, 1fr);
        gap: 0.7rem;
    }
    .create-button {
        min-block-size: 54px;
        font-size: 1.2rem;
    }
    .action-divider {
        display: flex;
        align-items: center;
        gap: 0.72rem;
        width: 70%;
        margin: 0.05rem auto;
        color: #e6fff0;
        font: 800 0.73rem / 1.2 var(--gb-font-mono);
        letter-spacing: 0.13em;
        text-transform: uppercase;
    }
    .action-divider::before,
    .action-divider::after {
        flex: 1;
    }
    .join-card {
        grid-template-columns: minmax(0, 1fr);
        gap: 0.55rem;
        padding: 0.65rem 0.75rem 0.75rem;
        border-radius: 1rem;
        text-align: start;
    }
    .join-title {
        min-block-size: 44px;
        padding-inline: 0;
        border-inline-end: 0;
        font-size: 1.15rem;
    }
    .join-help {
        display: block;
        margin-block-start: -0.18rem;
        color: #c3dcd2;
        font-size: 0.88rem;
        line-height: 1.3;
    }
    .join-submit {
        border-radius: 0.68rem;
    }
    .code-entry {
        border-radius: 0.68rem;
    }
    .code-error {
        margin-inline: 0;
        text-align: start;
    }
    .landing-install {
        margin-inline: auto;
    }
    .features-portrait {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-block-start: clamp(1.15rem, 5dvh, 2.6rem);
    }
    .features-portrait li {
        flex-direction: column;
        align-items: center;
        gap: 0.32rem;
        padding-inline: 0.38rem;
    }
    .features-portrait .ui-icon {
        width: 1.75rem;
        color: #e5ffa5;
    }
    .features-portrait strong {
        font-size: 0.95rem;
    }
    .features-portrait p {
        margin-block-start: 0.12rem;
        font-size: 0.8rem;
    }
}
@media (max-height: 720px) and (max-width: 820px) and (orientation: portrait) {
    .landing-main {
        padding-block-start: clamp(0.8rem, 4.8dvh, 2.3rem);
    }
    .hero-route {
        width: min(85%, 17rem);
        margin-block-start: 0.25rem;
    }
    .hero-actions {
        gap: 0.5rem;
    }
    .create-button {
        min-block-size: 48px;
    }
    .features-portrait {
        margin-block-start: 1rem;
    }
}
@media (max-height: 610px) and (max-width: 820px) and (orientation: portrait) {
    :deep(.site-header .header-inner) {
        padding-block: max(0.25rem, var(--header-safe-top)) 0.25rem;
    }
    .scenery {
        inset-block-start: max(3.15rem, var(--gb-safe-top));
    }
    .landing-main {
        padding-block: 0.8rem max(0.7rem, var(--gb-safe-bottom));
    }
    .hero-brand img {
        width: 3rem;
    }
    .hero-subtitle {
        font-size: 0.875rem;
    }
    .hero-route {
        width: min(79%, 14rem);
    }
    .hero-launch {
        margin-block-start: 0.5rem;
    }
    .hero-actions {
        gap: 0.4rem;
    }
    .join-card {
        padding-block: 0.45rem 0.6rem;
    }
    .features-portrait {
        margin-block-start: 0.75rem;
    }
    .features-portrait li {
        padding-inline: 0.25rem;
    }
    .features-portrait .ui-icon {
        width: 1.45rem;
    }
    .features-portrait p {
        font-size: 0.75rem;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .scenery img {
        object-position: 52% 49%;
    }
    .scenery::after {
        background: linear-gradient(90deg, #05272065, #052a2340 55%, #031c1763), linear-gradient(0deg, #031e1755, transparent 50%);
    }
    .landing-main {
        --scenic-side: clamp(0.7rem, 5vw, 4.8rem);
        padding-block: 0.65rem max(0.7rem, var(--gb-safe-bottom));
    }
    .welcome {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: clamp(0.75rem, 4.6vw, 4rem);
        width: min(100%, 92rem);
        margin-inline: auto;
        text-align: center;
    }
    .hero-kicker,
    .hero-tagline,
    .hero-description,
    .home-features,
    .create-arrow,
    .submit-arrow {
        display: none;
    }
    .hero-brand {
        justify-content: center;
        gap: clamp(0.3rem, 1vw, 0.8rem);
    }
    .hero-brand img {
        width: clamp(2rem, 6.4vw, 5.85rem);
    }
    h1 {
        font-size: clamp(1.65rem, 5.1vw, 5.3rem);
    }
    .hero-subtitle {
        display: block;
        margin-block-start: clamp(0.45rem, 1.5dvh, 0.85rem);
        font: italic 750 clamp(0.83rem, 1.95vw, 1.45rem) / 1.3 var(--gb-font-display);
    }
    .hero-route {
        display: block;
        width: min(100%, 28rem);
        height: auto;
        margin: 0.5rem auto 0;
    }
    .hero-launch {
        width: min(100%, 37rem);
        margin: 0;
        justify-self: end;
    }
    .launch-panel {
        padding: clamp(0.7rem, 2.2vw, 1.75rem);
        border: 1px solid #b3ed849c;
        border-radius: clamp(0.9rem, 3.6vw, 2rem);
        background: linear-gradient(146deg, #0d382fe8, #06211bf5 65%, #0a3126e8);
        box-shadow:
            inset 0 1px #ecffc23b,
            0 1rem 2.5rem #031c157d;
    }
    .launch-heading {
        display: block;
        margin-block-end: clamp(0.65rem, 2.1dvh, 1.2rem);
    }
    .launch-crest {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        width: min(100%, 10rem);
        margin: 0 auto 0.36rem;
    }
    .launch-crest svg {
        width: 1.5rem;
        height: auto;
        flex: none;
    }
    .launch-crest::before,
    .launch-crest::after {
        flex: 1;
        background: #d6ffb099;
    }
    .launch-heading h2 {
        font: italic 900 clamp(1.36rem, 3.4vw, 2.8rem) / 1.03 var(--gb-font-display);
        letter-spacing: -0.045em;
    }
    .launch-heading p {
        max-width: 27ch;
        margin: 0.42rem auto 0;
        color: #c6dfd3;
        font-size: clamp(0.78rem, 1.65vw, 1.15rem);
        line-height: 1.28;
    }
    .hero-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.55rem;
    }
    .join-card {
        display: contents;
    }
    .create-button,
    .join-title {
        justify-content: center;
        min-block-size: 44px;
        padding-inline: 0.38rem;
        gap: 0.36rem;
        font-size: clamp(0.82rem, 1.8vw, 1.32rem);
    }
    .join-title {
        border: 1px solid #c9efaa95;
        border-radius: 999px;
        background: #06251f91;
    }
    .join-form {
        grid-column: 1 / -1;
    }
    .join-submit {
        inline-size: 2.95rem;
        border-radius: 0.75rem;
    }
    .submit-play {
        display: block;
    }
    .code-entry {
        text-align: start;
    }
    .code-error {
        margin-inline: auto;
        text-align: start;
    }
}
@media (orientation: landscape) and (max-height: 540px) and (max-width: 570px) {
    .hero-brand {
        flex-direction: column;
    }
    .create-button,
    .join-title {
        white-space: normal;
    }
}
@media (display-mode: standalone), (display-mode: fullscreen) {
    .landing {
        border-radius: 0;
        border-color: transparent;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .scenery {
        animation: home-scenery 370ms ease-out both;
    }
    .hero-identity {
        animation: home-arrive 350ms 100ms ease-out both;
    }
    .hero-launch {
        animation: home-arrive 325ms 235ms ease-out both;
    }
    .home-features {
        animation: home-arrive 280ms 360ms ease-out both;
    }
    :is(.create-button, .join-submit):active:not(:disabled) {
        transform: scale(0.987);
    }
    @keyframes home-scenery {
        from {
            opacity: 0.5;
            scale: 1.015;
        }
        to {
            opacity: 1;
            scale: 1;
        }
    }
    @keyframes home-arrive {
        from {
            opacity: 0.64;
            translate: 0 0.35rem;
        }
        to {
            opacity: 1;
            translate: 0 0;
        }
    }
}
</style>
