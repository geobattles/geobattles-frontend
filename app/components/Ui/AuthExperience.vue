<template>
    <div ref="root" class="auth-experience" :data-auth-compact="compact || undefined" :data-auth-short="short || undefined">
        <div class="auth-brand">
            <img src="/images/emerald-mark.svg" width="30" height="32" alt="" />
            <span>Geo<strong>Battles</strong></span>
        </div>
        <div class="auth-modes" role="group" aria-label="Account options">
            <button
                v-for="option in options"
                :key="option.mode"
                type="button"
                :aria-pressed="mode === option.mode"
                :aria-label="mode === option.mode ? `${option.label} form` : undefined"
                :disabled="busy"
                @click="mode = option.mode"
            >
                <UiIcon :name="option.icon" />
                <span>{{ option.label }}</span>
            </button>
        </div>

        <form :key="mode" ref="form" class="auth-form" :class="`auth-form--${mode}`" @submit.prevent="submit">
            <div v-if="mode !== 'guest'" class="auth-field" data-viewport-field>
                <label :for="`${id}-username`">Username</label>
                <input
                    :id="`${id}-username`"
                    v-model="username"
                    class="input"
                    name="username"
                    autocomplete="username"
                    autocapitalize="none"
                    spellcheck="false"
                    enterkeyhint="next"
                    :minlength="mode === 'register' ? 3 : undefined"
                    required
                    @keydown.enter="focusNext"
                />
            </div>
            <div v-if="mode !== 'login'" class="auth-field" data-viewport-field>
                <label :for="`${id}-display`">Display name</label>
                <input
                    :id="`${id}-display`"
                    v-model="displayName"
                    class="input"
                    name="displayname"
                    autocomplete="nickname"
                    autocapitalize="words"
                    :enterkeyhint="mode === 'guest' ? 'go' : 'next'"
                    minlength="3"
                    maxlength="15"
                    required
                    @keydown.enter="mode === 'register' && focusNext($event)"
                />
            </div>
            <div v-if="mode !== 'guest'" class="auth-field" data-viewport-field>
                <label :for="`${id}-password`">Password</label>
                <UiPassword :id="`${id}-password`" v-model="password" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" enterkeyhint="go" required />
            </div>
            <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
            <div class="auth-actions">
                <button class="auth-submit" type="submit" :disabled="busy" :aria-busy="busy">
                    <span v-if="busy" class="spinner" aria-hidden="true" />
                    <span>{{ submitLabel }}</span>
                    <UiIcon v-if="!busy" name="arrow" />
                </button>
                <UiKeyboardDone v-if="compact" @click="finishEditing" />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
const options = [
    { mode: "login", label: "Sign in", icon: "user" },
    { mode: "guest", label: "Play as guest", icon: "compass" },
    { mode: "register", label: "Create account", icon: "plus" },
] as const;
const mode = defineModel<(typeof options)[number]["mode"]>("mode", { required: true });
const emit = defineEmits<{ submitting: []; authenticated: [] }>();
const auth = useAuthStore();
const id = useId();
const form = useTemplateRef("form");
const root = useTemplateRef("root");
const { visibleHeight, editingHeightLoss, landscape, finishEditing } = useViewportForm(root);
const compact = computed(() => editingHeightLoss.value >= 64 && visibleHeight.value < 340);
const short = computed(() => compact.value && landscape.value && visibleHeight.value < 240);
const username = ref("");
const displayName = ref("");
const loginPassword = ref("");
const registerPassword = ref("");
const passwordField = computed(() => (mode.value === "register" ? registerPassword : loginPassword));
const password = computed({ get: () => passwordField.value.value, set: (value) => (passwordField.value.value = value) });
const busy = ref(false);
const error = ref("");
const submitLabel = computed(() => {
    if (mode.value === "guest") return busy.value ? "Joining as guest…" : "Continue as guest";
    if (mode.value === "register") return busy.value ? "Creating account…" : "Create account";
    return busy.value ? "Signing in…" : "Sign in";
});
let mounted = true;

watch(mode, () => (error.value = ""));
onBeforeUnmount(() => {
    mounted = false;
});

function focusNext(event: KeyboardEvent) {
    if (event.isComposing || !(event.target instanceof HTMLInputElement)) return;
    const fields = Array.from(form.value?.querySelectorAll("input") ?? []);
    event.preventDefault();
    if (event.target.reportValidity()) fields[fields.indexOf(event.target) + 1]?.focus({ preventScroll: true });
}

async function submit() {
    if (busy.value) return;
    const kind = mode.value;
    const name = displayName.value.trim();
    if (kind === "register" && username.value.trim().length < 3) {
        error.value = "Enter a username of at least 3 characters.";
        form.value?.querySelector<HTMLInputElement>('[name="username"]')?.focus();
        return;
    }
    if (kind !== "login" && (name.length < 3 || name.length > 15)) {
        error.value = "Enter a display name of 3–15 characters.";
        form.value?.querySelector<HTMLInputElement>('[name="displayname"]')?.focus();
        return;
    }

    error.value = "";
    busy.value = true;
    emit("submitting");
    try {
        if (kind === "login") await auth.login(username.value, loginPassword.value);
        else if (kind === "register") await auth.register(username.value, registerPassword.value, name);
        else await auth.register(null, null, name);
        if (!mounted) return;
        loginPassword.value = "";
        registerPassword.value = "";
        emit("authenticated");
    } catch (cause) {
        if (!mounted) return;
        const message = cause instanceof Error ? cause.message.toLowerCase() : "";
        if (message === "invalid credentials") error.value = "Username or password is incorrect.";
        else if (message.startsWith("could not create user;")) error.value = "Check your account details or try a different username.";
        else if (message.startsWith("could not create guest;")) error.value = "Check your display name and try again.";
        else if (cause instanceof TypeError) error.value = "Could not connect. Try again.";
        else error.value = "Authentication failed. Try again.";
    } finally {
        busy.value = false;
    }
}
</script>

<style>
.auth-surface.auth-dialog[open],
.auth-surface.auth-card {
    --auth-pad: clamp(0.9rem, 2.5vw, 1.45rem);
    overflow: auto;
    overscroll-behavior: contain;
    scroll-padding-block: 4rem 0.5rem;
    border: 1px solid #a5ead868;
    border-radius: 1.25rem;
    background:
        linear-gradient(178deg, #15524bba, #042525f5 44%, #031b1afc),
        url("/images/emerald-horizon.webp") center top / 100% auto no-repeat,
        #062724;
    box-shadow:
        0 25px 70px #00130cc2,
        inset 0 1px #e6ffcd57;
    color: #f8fafc;
}
.auth-surface:has([data-auth-compact]) {
    --auth-pad: 0.65rem;
    background: #062724;
    border-radius: 0.85rem;
}
@media (orientation: landscape) and (max-height: 500px) {
    .auth-surface.auth-dialog[open],
    .auth-surface.auth-card {
        --auth-pad: 0.75rem;
    }
}
@media (max-height: 470px) and (orientation: portrait), (max-height: 320px) and (orientation: landscape) {
    .auth-surface.auth-dialog[open],
    .auth-surface.auth-card {
        --auth-pad: 0.5rem;
    }
}
@media (prefers-reduced-motion: no-preference) {
    .auth-surface.auth-dialog[open],
    .auth-surface.auth-card {
        animation: auth-surface-in 235ms cubic-bezier(0.2, 0.75, 0.24, 1);
    }
}
@keyframes auth-surface-in {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
}
</style>

<style scoped>
.auth-experience {
    --auth-lime: #c8ff81;
    --auth-mint: #6be5ad;
    --auth-line: #a5ead83b;
    display: grid;
    gap: 0.9rem;
    min-width: 0;
}
.auth-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    color: #f8fafc;
    font: italic 900 1.55rem/1 var(--gb-font-display);
    letter-spacing: -0.065em;
}
.auth-brand strong {
    color: var(--auth-lime);
}
.auth-modes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--auth-line);
    border-radius: 0.95rem;
    background: #031c1bcc;
}
.auth-modes button {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.3rem;
    min-block-size: 44px;
    min-inline-size: 0;
    padding: 0.2rem;
    border: 1px solid transparent;
    border-radius: 0.65rem;
    color: #d8eee7;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.15;
}
.auth-modes .ui-icon {
    width: 1rem;
    height: 1rem;
    flex: none;
    color: var(--auth-mint);
}
.auth-modes button[aria-pressed="true"] {
    border-color: #c8ff818c;
    background: linear-gradient(145deg, #a4f55f37, #2a885754);
    box-shadow: inset 0 1px #e1ffbb3d;
    color: #f1ffd9;
}
.auth-modes button[aria-pressed="true"] .ui-icon {
    color: var(--auth-lime);
}
.auth-form {
    display: grid;
    gap: 0.7rem;
    min-width: 0;
}
.auth-actions {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    gap: 0.35rem;
}
.auth-actions .auth-submit {
    flex: 1;
}
.auth-experience[data-auth-short] .auth-form {
    gap: 0.35rem;
}
.auth-field {
    display: grid;
    gap: 0.28rem;
    min-width: 0;
}
.auth-field label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #dceee9;
}
.auth-field :deep(.input) {
    width: 100%;
    min-height: 48px;
    border: 1px solid var(--auth-line);
    border-radius: 0.72rem;
    background: #072e2be6;
    color: #f8fafc;
    font-size: max(16px, 1rem);
}
.auth-field :deep(.input:focus) {
    border-color: var(--auth-mint);
    outline: 2px solid #6be5ad8f;
    outline-offset: 1px;
}
.auth-field :deep(.password-field button) {
    inset-block-start: 2px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 0.6rem;
    color: #cce8df;
}
.auth-error {
    margin: 0;
    padding: 0.45rem 0.65rem;
    border-radius: 0.5rem;
    background: #65333766;
    color: #ffd2cf;
    font-size: 0.85rem;
}
.auth-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-height: 48px;
    margin-top: 0.15rem;
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--gb-scenic-action-border);
    border-radius: 0.8rem;
    background: var(--gb-scenic-action-fill);
    box-shadow: var(--gb-scenic-action-shadow);
    color: var(--gb-scenic-action-ink);
    font-weight: 800;
}
.auth-submit .spinner {
    color: inherit;
}
.auth-submit:disabled {
    cursor: wait;
}
[data-auth-compact="true"] .auth-brand,
[data-auth-compact="true"] .auth-modes {
    display: none;
}
[data-auth-compact="true"] .auth-field {
    gap: 0.15rem;
}
[data-auth-compact="true"] .auth-field :deep(.input),
[data-auth-compact="true"] .auth-submit {
    min-height: 44px;
}
[data-auth-compact="true"] .auth-field :deep(.password-field button) {
    inset-block-start: 0;
}
@media (hover: hover) {
    .auth-modes button:enabled:hover {
        border-color: #a5ead88c;
        background-color: #235647;
    }
    .auth-submit:enabled:hover {
        box-shadow: var(--gb-scenic-action-hover-shadow);
    }
}
@media (prefers-reduced-motion: no-preference) {
    .auth-form {
        animation: auth-form-in 180ms ease-out;
    }
    .auth-submit,
    .auth-modes button {
        transition:
            box-shadow 150ms,
            background-color 150ms,
            border-color 150ms,
            transform 150ms;
    }
    .auth-submit:enabled:active {
        transform: translateY(1px);
    }
}
@keyframes auth-form-in {
    from {
        opacity: 0;
        transform: translateY(3px);
    }
}
@media (max-width: 420px) {
    .auth-modes button {
        flex-direction: column;
        gap: 0.2rem;
    }
}
@media (orientation: landscape) and (max-height: 500px) and (min-width: 560px) {
    .auth-experience,
    .auth-form {
        gap: 0.55rem 0.7rem;
    }
    .auth-brand {
        display: none;
    }
    .auth-form {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .auth-error {
        grid-column: 1 / -1;
    }
    .auth-submit {
        align-self: end;
    }
}
@media (max-height: 470px) and (orientation: portrait), (max-height: 320px) and (orientation: landscape) {
    .auth-brand {
        display: none;
    }
    .auth-form {
        gap: 0.45rem 0.7rem;
    }
    .auth-field {
        gap: 0.15rem;
    }
    .auth-field :deep(.input),
    .auth-submit {
        min-height: 44px;
    }
    .auth-field :deep(.password-field button) {
        inset-block-start: 0;
    }
}
@media (min-width: 560px) and (max-height: 320px) and (orientation: landscape) {
    .auth-experience {
        gap: 0.4rem;
    }
    .auth-modes {
        padding: 0.125rem;
    }
    .auth-form--register {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
@media (min-width: 560px) {
    .auth-experience[data-auth-short] .auth-form--register {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
</style>
