<template>
    <div class="join-gateway" :class="{ 'join-editing': compact, 'join-editing-landscape': compact && landscape }" :style="viewportStyle">
        <picture class="gateway-scenery" aria-hidden="true">
            <source media="(max-width: 760px) and (orientation: portrait)" srcset="/images/emerald-lake-portrait.webp" />
            <img src="/images/emerald-lake.webp" alt="" width="1672" height="941" fetchpriority="high" />
        </picture>
        <div class="gateway-frame">
            <Header navigation :install-blocked="busy || !!pending" />
            <main id="main-content" class="gateway-main">
                <section class="gateway-stack" :class="{ 'directory-mode': mode === 'open' }" aria-labelledby="join-title">
                    <div class="gateway-heading">
                        <div class="gateway-orbit" aria-hidden="true"><img src="/images/emerald-world.webp" alt="" width="160" height="160" /></div>
                        <h1 id="join-title">Join a Lobby</h1>
                    </div>
                    <div ref="card" class="gateway-card" data-viewport-scroll>
                        <UiKeyboardDone v-if="compact" class="join-done-typing" @click="finishEditing" />
                        <div class="join-modes" role="group" aria-label="Ways to join">
                            <button type="button" :aria-pressed="mode === 'code'" :aria-controls="codePanelId" :disabled="busy" @click="openGameCode">
                                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                </svg>
                                Game Code
                            </button>
                            <button
                                ref="directoryTab"
                                type="button"
                                :aria-pressed="mode === 'open'"
                                :aria-controls="directoryVisited ? directoryPanelId : undefined"
                                :disabled="busy"
                                @click="setMode('open')"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                                    <path d="M8 6h12M8 12h12M8 18h12M4 6h.1M4 12h.1M4 18h.1" />
                                </svg>
                                Open Lobbies
                            </button>
                        </div>

                        <form v-show="mode === 'code'" :id="codePanelId" class="code-form" aria-label="Join with a game code" @submit.prevent="submitForm">
                            <LobbyCodeInput
                                ref="codeInput"
                                v-model="code"
                                :readonly="!!working"
                                :invalid="!!codeError"
                                :describedby="codeError ? errorId : helpId"
                                @error="handleCodeError"
                                @composing="cancelCodeCheck"
                                @edit="handleCodeEdit"
                            />
                            <p v-if="!codeError" :id="helpId" class="code-help">Enter or paste the four-character code to join automatically.</p>
                            <p v-if="codeError" :id="errorId" class="code-error" role="alert"><UiIcon name="info" />{{ codeError }}</p>
                            <div role="status" :class="{ 'sr-only': !busy }">
                                <p v-if="busy" class="join-status"><span class="spinner" aria-hidden="true" />Joining…</p>
                            </div>
                            <button v-if="codeInput?.canConfirmComposition" class="retry-code" type="submit">Join lobby</button>
                            <button v-else-if="joinError && canSubmit" class="retry-code" type="submit">Try again</button>
                            <button class="browse-lobbies" type="button" :disabled="busy" @click="browseLobbies">Browse Open Lobbies <UiIcon name="arrow" /></button>
                        </form>
                        <div v-if="directoryVisited" v-show="mode === 'open'" :id="directoryPanelId" class="directory-panel">
                            <LobbyOpenLobbies
                                :active="mode === 'open'"
                                :working="working?.target"
                                :action-error="directoryError"
                                @join="perform({ target: $event, mode: 'open' })"
                                @create="perform({ target: 'create', mode: 'open' })"
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { createLobbyService } from "~/services/lobbyService";
import { isLobbyCode, normalizeLobbyCode } from "~/utils/lobbyCode";

type JoinMode = "code" | "open";
type JoinAction = { target: string; mode: JoinMode };
const props = defineProps<{ initialMode: JoinMode }>();
const route = useRoute();
const auth = useAuthStore();
const lobby = useLobbyStore();
const lobbyService = createLobbyService(useRuntimeConfig().public.BACKEND_HOST);
const routeName = route.name;
const mode = ref<JoinMode>(props.initialMode);
const directoryVisited = ref(props.initialMode === "open");
const panelId = useId();
const codePanelId = panelId + "-code";
const directoryPanelId = panelId + "-directory";
const errorId = panelId + "-error";
const helpId = panelId + "-help";

function readInvite() {
    const raw = route.query.id;
    if (props.initialMode !== "code" || raw === undefined) return { code: "", error: "" };
    const code = typeof raw === "string" ? normalizeLobbyCode(raw) : "";
    return isLobbyCode(code) ? { code, error: "" } : { code: "", error: "This invite doesn’t contain a valid game code." };
}

const invite = readInvite();
const code = ref(invite.code);
const inputError = ref(invite.error);
const joinError = ref("");
const directoryError = ref("");
const codeError = computed(() => inputError.value || joinError.value);
const working = shallowRef<JoinAction>();
const pending = shallowRef<JoinAction>();
const codeCheck = shallowRef<{ target: string; controller: AbortController }>();
const busy = computed(() => !!working.value || !!codeCheck.value);
const canSubmit = computed(() => !busy.value && !inputError.value && isLobbyCode(code.value));
const codeInput = useTemplateRef("codeInput");
const directoryTab = useTemplateRef("directoryTab");
const card = useTemplateRef("card");
const { field, visibleHeight, editingHeightLoss, landscape, finishEditing } = useViewportForm(card);
const viewportStyle = useViewportFit(() => !!field.value);
const compact = computed(() => editingHeightLoss.value >= 64 && visibleHeight.value < 360);
let active = true;
let joinedCode: string | undefined;

function setMode(next: JoinMode) {
    if (busy.value) return;
    mode.value = next;
    if (next === "open") directoryVisited.value = true;
}

async function focusCode() {
    await nextTick();
    if (active && mode.value === "code" && !busy.value && !auth.isLoginDialog) codeInput.value?.focus();
}

function openGameCode() {
    setMode("code");
    void focusCode();
}

async function browseLobbies() {
    setMode("open");
    await nextTick();
    directoryTab.value?.focus({ preventScroll: true });
}

function handleCodeEdit() {
    if (working.value || codeCheck.value?.target === code.value) return;
    cancelCodeCheck();
    inputError.value = "";
    joinError.value = "";
    submitCode();
}

function handleCodeError(message: string) {
    cancelCodeCheck();
    inputError.value = message;
    joinError.value = "";
}

function submitCode() {
    if (canSubmit.value) void checkAndJoinCode(code.value);
}

function submitForm() {
    if (codeInput.value?.finishComposition()) return;
    if (!pending.value && code.value !== joinedCode) submitCode();
}

function cancelCodeCheck() {
    codeCheck.value?.controller.abort();
    codeCheck.value = undefined;
}

async function checkAndJoinCode(target: string) {
    if (!active || busy.value) return;
    joinError.value = "";
    const controller = new AbortController();
    const check = { target, controller };
    codeCheck.value = check;
    const timeout = setTimeout(() => controller.abort(), 3000);
    let missing = false;
    try {
        missing = (await lobbyService.find(target, controller.signal)) === null;
    } catch {
        // A failed directory request cannot establish absence. Admission can still proceed via the socket.
    } finally {
        clearTimeout(timeout);
    }

    if (codeCheck.value !== check) return;
    codeCheck.value = undefined;
    if (missing) {
        joinError.value = "Lobby not found.";
        return;
    }
    // Release the software keyboard before authentication or navigation.
    codeInput.value?.blur();
    await perform({ target, mode: "code" });
}

async function perform(action: JoinAction) {
    if (!active || working.value) return;
    if (action.mode === "code") joinError.value = "";
    else directoryError.value = "";

    if (!auth.isAuthenticated) {
        pending.value = action;
        auth.openLoginDialog("guest");
        return;
    }

    pending.value = undefined;
    working.value = action;
    try {
        if (action.target === "create") await lobby.createLobby();
        else {
            await lobby.joinLobby(action.target);
            // Enter can submit the form after the keyboard has already committed and joined.
            if (action.mode === "code") joinedCode = action.target;
        }
    } catch (cause) {
        if (active && route.name === routeName) {
            const message = cause instanceof Error ? cause.message : "Please try again.";
            if (action.mode === "code") joinError.value = message;
            else directoryError.value = message;
        }
    } finally {
        if (active) working.value = undefined;
    }
}

function applyInvite() {
    if (route.name !== routeName || props.initialMode !== "code") return;
    cancelCodeCheck();
    const next = readInvite();
    pending.value = undefined;
    joinedCode = undefined;
    setMode("code");
    code.value = next.code;
    inputError.value = next.error;
    const editing = route.query.edit === "1";
    joinError.value = "";
    if (next.code && !editing) void checkAndJoinCode(next.code);
    else void focusCode();
}

watch(
    () => auth.isAuthenticated,
    (signedIn) => {
        if (signedIn && pending.value) void perform(pending.value);
    }
);
watch(
    () => auth.isLoginDialog,
    (open) => {
        if (!open && !auth.isAuthenticated) pending.value = undefined;
    }
);

onMounted(() => {
    applyInvite();
    watch(() => [route.query.id, route.query.edit], applyInvite);
});
onBeforeUnmount(() => {
    active = false;
    cancelCodeCheck();
    pending.value = undefined;
});

useHead({ title: "Join a Lobby" });
</script>

<style scoped>
.join-gateway {
    --emerald-lime: #c7f88b;
    --emerald-white: #f8faf4;
    --join-edge: clamp(0.75rem, 4vw, 2rem);
    position: relative;
    isolation: isolate;
    height: var(--gb-viewport-height);
    overflow: hidden;
    background: #052b25;
    color: var(--emerald-white);
}
.gateway-scenery,
.gateway-scenery img,
.gateway-scenery::before,
.gateway-scenery::after {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.gateway-scenery {
    z-index: -1;
}
.gateway-scenery img {
    object-fit: cover;
    object-position: 54% 51%;
}
.gateway-scenery::before,
.gateway-scenery::after {
    content: "";
    pointer-events: none;
}
.gateway-scenery::before {
    z-index: 1;
    background: url("/images/atlas-relief.svg") top right / min(100%, 68rem) auto no-repeat;
    opacity: 0.85;
}
.gateway-scenery::after {
    background: radial-gradient(ellipse at 50% 22%, #052d28b0, transparent 56%), linear-gradient(180deg, #04252166, transparent 42%, #021b188a);
}
.gateway-frame {
    position: absolute;
    top: var(--visible-top, 0px);
    inset-inline: 0;
    display: flex;
    flex-direction: column;
    height: var(--visible-height, var(--gb-viewport-height));
    min-height: 0;
}
.gateway-frame :deep(.site-header) {
    flex: none;
    border-bottom-color: #b1efbd35;
    background: #03231fc7;
}
.gateway-frame :deep(.header-inner) {
    max-width: 74rem;
}
.gateway-main {
    display: grid;
    flex: 1 1 0;
    place-items: center;
    grid-template-rows: minmax(0, 1fr);
    min-width: 0;
    min-height: 0;
    padding: clamp(0.45rem, 2dvh, 1.2rem) max(var(--join-edge), env(safe-area-inset-right)) max(clamp(0.65rem, 5dvh, 3.2rem), env(safe-area-inset-bottom))
        max(var(--join-edge), env(safe-area-inset-left));
}
.gateway-stack {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: clamp(0.6rem, 2.1dvh, 1.3rem);
    width: min(100%, 37rem);
    max-height: 100%;
    min-width: 0;
    min-height: 0;
}
.gateway-stack.directory-mode {
    width: min(100%, 49rem);
}
.gateway-heading {
    position: relative;
    isolation: isolate;
    padding-top: clamp(2rem, 6dvh, 4rem);
    text-align: center;
}
.gateway-orbit {
    position: absolute;
    z-index: -1;
    inset-block-start: 0;
    inset-inline: 0;
    width: clamp(7rem, 16vw, 12.5rem);
    height: clamp(3.5rem, 10dvh, 6.65rem);
    margin-inline: auto;
    overflow: hidden;
    mask-image: linear-gradient(#000, #0009 56%, transparent);
}
.gateway-orbit img {
    width: 100%;
    height: auto;
    border-radius: 50%;
    border-top: 2px solid #dcff9d;
    filter: sepia(0.7) saturate(1.35) hue-rotate(24deg) brightness(1.1);
}
h1 {
    margin: 0;
    color: #f7fbf4;
    font: italic 900 clamp(2.1rem, 6vw, 4.25rem) / 1.02 var(--gb-font-display);
    letter-spacing: -0.062em;
    text-shadow: 0 4px 26px #021a16c9;
}
.gateway-card {
    display: flex;
    flex-direction: column;
    gap: clamp(0.75rem, 2.2dvh, 1.25rem);
    min-width: 0;
    min-height: 0;
    max-height: 100%;
    padding: clamp(0.85rem, 3.6vw, 1.5rem) clamp(0.85rem, 5vw, 3.5rem);
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid #bfea9b8c;
    border-top-color: #d6fbb5;
    border-radius: 1.65rem;
    background: radial-gradient(ellipse at 0 0, #b6ed7b35, transparent 32%), linear-gradient(155deg, #103d35f2, #052a24f7 63%, #1c4e37ea);
    box-shadow:
        0 22px 65px #0017119e,
        inset 0 1px 3px #f0ffd162,
        inset 0 0 24px #a7ec7429;
}
.directory-mode .gateway-card {
    padding-inline: clamp(0.75rem, 3vw, 1.5rem);
}
.join-modes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    flex: none;
    width: min(100%, 24rem);
    margin-inline: auto;
    gap: 0.2rem;
    padding: 0.16rem;
    border: 1px solid #aff2a156;
    border-radius: 999px;
    background: #052620cf;
}
.join-modes button,
.join-status,
.retry-code,
.browse-lobbies {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 0.45rem;
    min-height: 44px;
    min-width: 0;
    border: 1px solid transparent;
    padding: 0.25rem 0.35rem;
    color: #e1f6e9;
    font-size: 0.86rem;
    font-weight: 750;
    line-height: 1.2;
}
.join-modes button {
    border-radius: 999px;
}
.join-modes svg,
.join-status .spinner,
.browse-lobbies .ui-icon {
    width: 1rem;
    height: 1rem;
    flex: none;
}
.join-modes button[aria-pressed="true"] {
    border-color: var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    box-shadow:
        0 0 10px #b8f4743a,
        inset 0 1px #f5ffcc6e;
}
.join-modes button[aria-pressed="false"]:enabled:hover {
    border-color: #b6e88b8c;
    background-color: #285a45;
}
.code-form {
    display: grid;
    flex: none;
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    gap: 0.65rem;
    min-width: 0;
}
.code-form :deep(.lobby-code) {
    width: min(100%, 22rem);
}
.join-status {
    margin: 0;
    min-height: 1.5rem;
    padding-block: 0;
    color: #eaffd3;
}
.join-status .spinner {
    color: #c9fb97;
}
.retry-code {
    padding-inline: 1rem;
    border-color: #c8e99e6c;
    border-radius: 999px;
    background: #05272280;
}
.retry-code:hover {
    background: #285642;
}
.browse-lobbies {
    width: min(100%, 23rem);
    padding-inline: 0.7rem;
    border-color: #c8e99e6c;
    border-radius: 999px;
    background: linear-gradient(140deg, #3f6c4942, #05272280);
    color: #eff8ee;
}
.browse-lobbies:enabled:hover {
    border-color: #d2f5afaf;
    background: #285642;
}
.code-help,
.code-error {
    margin: 0;
    text-align: center;
    font-size: 0.81rem;
    line-height: 1.35;
}
.code-help {
    color: #d8eee3;
}
.code-error {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    padding: 0.4rem 0.55rem;
    color: #ffb5a7;
    font-weight: 700;
}
.code-error .ui-icon {
    width: 1rem;
    height: 1rem;
    flex: none;
}
.directory-panel {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
}
.join-editing :deep(.header-inner),
.join-editing .gateway-heading,
.join-editing .join-modes,
.join-editing .browse-lobbies,
.join-editing :deep(.directory-footer),
.join-editing :deep(.directory-sort),
.join-editing :deep(.create-lobby) {
    display: none;
}
.join-editing :deep(.site-header) {
    border: 0;
}
.join-editing .gateway-main {
    padding-block: max(0.25rem, var(--gb-safe-top)) max(0.25rem, var(--gb-safe-bottom));
}
.join-editing .gateway-stack {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: min(100%, 34rem);
}
.join-editing .gateway-card {
    --code-height: 48px;
    padding: 0.5rem;
    border-radius: 0.85rem;
}
.join-editing :deep(.directory-tools) {
    grid-template-columns: minmax(0, 1fr) auto;
}
.join-editing :deep(.directory-search) {
    grid-column: auto;
}
.join-editing :deep(.directory-results) {
    min-height: 2.75rem;
}
.join-editing .code-help {
    @apply sr-only;
}
.join-editing .gateway-scenery::after {
    background: #031e1bd9;
}
.join-editing .gateway-scenery::before {
    opacity: 0;
}
.join-done-typing {
    align-self: end;
}
.join-editing-landscape .gateway-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
}
.join-editing-landscape .join-done-typing {
    grid-column: 2;
    grid-row: 1;
    align-self: start;
}
:global(.app-root:has(.join-gateway) > .build-notice) {
    @apply sr-only;
}
@media (max-width: 760px) and (orientation: portrait) {
    .join-gateway {
        --join-edge: 0.55rem;
    }
    .gateway-scenery img {
        object-position: center 47%;
    }
    .gateway-main {
        padding-block: 0.45rem max(0.75rem, env(safe-area-inset-bottom));
    }
    .gateway-stack {
        gap: 0.48rem;
    }
    .gateway-heading {
        padding-top: 1.55rem;
    }
    .gateway-orbit {
        width: 5.8rem;
        height: 2.95rem;
    }
    h1 {
        font-size: clamp(1.6rem, 6.4vw, 2.25rem);
    }
    .gateway-card {
        --code-height: clamp(2.85rem, 7dvh, 3.4rem);
        gap: 0.55rem;
        padding: 0.7rem 0.75rem;
        border-radius: 1.15rem;
    }
    .directory-mode .gateway-card {
        padding: 0.58rem;
    }
    .join-modes {
        padding: 0.14rem;
    }
    .join-modes button {
        min-height: 34px;
        gap: 0.34rem;
        padding: 0.2rem 0.35rem;
        font-size: 0.76rem;
    }
    .join-modes svg {
        width: 0.86rem;
        height: 0.86rem;
    }
    .code-form {
        gap: 0.5rem;
    }
    .code-help,
    .code-error {
        font-size: 0.73rem;
    }
    .browse-lobbies,
    .retry-code {
        min-height: 38px;
        font-size: 0.78rem;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .join-gateway {
        --join-edge: 0.55rem;
    }
    .gateway-stack {
        grid-template-columns: minmax(8.5rem, 0.36fr) minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        align-items: center;
        gap: 0.75rem;
        width: min(100%, 54rem);
    }
    .gateway-stack.directory-mode {
        grid-template-columns: minmax(8.2rem, 0.3fr) minmax(0, 1fr);
        align-items: stretch;
        height: 100%;
    }
    .gateway-stack.directory-mode .gateway-heading {
        align-self: center;
    }
    .gateway-card {
        --code-height: 44px;
        gap: 0.45rem;
        padding: 0.55rem 0.65rem;
        border-radius: 1.05rem;
    }
    .directory-mode .gateway-card {
        height: 100%;
        padding: 0.5rem 0.62rem;
    }
    .join-modes {
        width: min(100%, 21rem);
    }
    .join-modes button {
        min-height: 32px;
        gap: 0.32rem;
        font-size: 0.74rem;
    }
    .join-modes svg {
        width: 0.84rem;
        height: 0.84rem;
    }
    .gateway-main {
        padding-block: 0.38rem max(0.38rem, env(safe-area-inset-bottom));
    }
    .gateway-heading {
        padding-top: 2rem;
    }
    .gateway-orbit {
        width: 5.8rem;
        height: 3rem;
    }
    h1 {
        font-size: clamp(1.38rem, 3.6vw, 2.05rem);
    }
    .code-form {
        gap: 0.35rem;
    }
    .code-help {
        @apply sr-only;
    }
    .browse-lobbies {
        display: none;
    }
}
@media (orientation: landscape) and (max-height: 540px) and (max-width: 680px) {
    .gateway-stack.directory-mode {
        grid-template-columns: minmax(0, 1fr);
    }
    .gateway-stack.directory-mode .gateway-heading {
        display: none;
    }
}
@media (max-height: 250px) {
    .gateway-heading {
        padding-top: 0;
    }
    .gateway-orbit {
        display: none;
    }
    .gateway-card {
        padding: 0.45rem;
        gap: 0.35rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .gateway-scenery {
        animation: scene-in 420ms ease-out;
    }
    .gateway-stack {
        animation: gateway-in 350ms cubic-bezier(0.2, 0.75, 0.25, 1);
    }
    .code-form:not([style*="display: none"]),
    .directory-panel:not([style*="display: none"]) {
        animation: gateway-in 170ms ease-out;
    }
}
@keyframes scene-in {
    from {
        opacity: 0.25;
    }
}
@keyframes gateway-in {
    from {
        opacity: 0.35;
        transform: translateY(5px);
    }
}
</style>
