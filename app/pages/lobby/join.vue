<template>
    <div class="join-page game-shell">
        <Header />
        <main id="main-content" class="join-shell">
            <section class="join-card" aria-labelledby="join-title">
                <p class="eyebrow">Multiplayer</p>
                <h1 id="join-title">Join a lobby</h1>
                <form class="join-form" @submit.prevent="submit">
                    <fieldset :disabled="joining" class="code-fieldset" :aria-describedby="error ? 'join-help join-error' : 'join-help'">
                        <legend>Game code</legend>
                        <div class="code-boxes">
                            <input
                                v-for="(_, index) in characters"
                                :id="`join-code-${index + 1}`"
                                :key="index"
                                :ref="(element) => setInput(element, index)"
                                :value="characters[index]"
                                class="input code-input"
                                type="text"
                                inputmode="text"
                                maxlength="1"
                                autocomplete="off"
                                autocapitalize="characters"
                                autocorrect="off"
                                spellcheck="false"
                                :aria-label="`Game code character ${index + 1} of 4`"
                                :aria-invalid="!!error || undefined"
                                :aria-describedby="error ? 'join-help join-error' : 'join-help'"
                                @focus="selectInput"
                                @click="selectInput"
                                @input="editCharacter($event, index)"
                                @keydown="moveFocus($event, index)"
                                @paste.prevent="pasteCode"
                            />
                        </div>
                    </fieldset>
                    <p id="join-help" class="field-help">Enter all four characters to join automatically, or paste a code or invite link.</p>
                    <p v-if="error" id="join-error" class="field-error" role="alert">{{ error }}</p>
                    <button class="btn btn-command join-button" type="submit" :disabled="joining" :aria-busy="joining">
                        <span v-if="joining" class="spinner" />{{ joining ? "Joining…" : "Join lobby" }}<UiIcon v-if="!joining" name="arrow" />
                    </button>
                    <p v-if="joining" class="field-help" role="status">Waiting for the server to confirm your place.</p>
                </form>
                <NuxtLink to="/lobby/list" class="text-link directory-link">Find an open lobby <UiIcon name="arrow" /></NuxtLink>
            </section>
        </main>
    </div>
</template>
<script setup lang="ts">
const route = useRoute();
const auth = useAuthStore();
const lobby = useLobbyStore();
const toast = useToast();
const hasInvite = Object.prototype.hasOwnProperty.call(route.query, "id");
const initialCode = typeof route.query.id === "string" ? route.query.id : "";
const characters = ref(["", "", "", ""]);
const error = ref("");
const joining = ref(false);
const pending = ref<string | null>(null);
let joinedCode: string | null = null;
const rejectedInput = ref(false);
const inputs: (HTMLInputElement | null)[] = [];
const codePattern = /^[123456789ABCDEFGHJKLMNPRSTUVWXYZ]{4}$/;
const characterPattern = /^[123456789ABCDEFGHJKLMNPRSTUVWXYZ]$/;
// Capitalize keyboard letters, not Unicode lookalikes or the rest of an invite URL.
const uppercaseCode = (value: string) => value.replace(/[a-z]/g, (letter) => letter.toUpperCase());
let active = true;
const setInput = (element: unknown, index: number) => {
    inputs[index] = element as HTMLInputElement | null;
};
const focusCharacter = (index: number) => {
    const input = inputs[Math.max(0, Math.min(3, index))];
    input?.focus();
    input?.select();
};
const selectInput = (event: Event) => (event.target as HTMLInputElement).select();
const resetInputError = () => {
    error.value = "";
    pending.value = null;
    rejectedInput.value = false;
};
const readCode = (raw: string): string | null => {
    let candidate = raw;
    if (/^https?:\/\//i.test(candidate)) {
        try {
            const invite = new URL(candidate);
            if (
                raw !== raw.trim() ||
                invite.origin !== window.location.origin ||
                invite.username ||
                invite.password ||
                invite.pathname !== "/lobby/join" ||
                invite.searchParams.getAll("id").length !== 1
            )
                throw new Error("Invalid invite");
            candidate = invite.searchParams.get("id") || "";
        } catch {
            error.value = "Use an invite link from this GeoBattles site.";
            return null;
        }
    }
    candidate = uppercaseCode(candidate);
    if (!codePattern.test(candidate)) {
        error.value = "Enter the four-character lobby code exactly as shown by your host.";
        return null;
    }
    return candidate;
};
const applyCode = (raw: string): string | null => {
    resetInputError();
    const id = readCode(raw);
    if (!id) {
        rejectedInput.value = true;
        return null;
    }
    characters.value = id.split("");
    return id;
};
const pasteCode = (event: ClipboardEvent) => {
    if (joining.value) return;
    const raw = event.clipboardData?.getData("text");
    if (raw !== undefined && applyCode(raw)) {
        focusCharacter(3);
        submit();
    }
};
const editCharacter = (event: Event, index: number) => {
    if (joining.value) return;
    const input = event.target as HTMLInputElement;
    const raw = uppercaseCode(input.value);
    input.value = raw;
    if (raw.length > 1) {
        if (applyCode(raw)) {
            focusCharacter(3);
            submit();
        } else input.value = characters.value[index] || "";
        return;
    }
    resetInputError();
    characters.value[index] = raw;
    if (raw && !characterPattern.test(raw)) {
        error.value = "Use the letters and digits from your host’s code.";
        return;
    }
    if (raw && index < 3) focusCharacter(index + 1);
    if (characters.value.every((character) => characterPattern.test(character))) submit();
};
const moveFocus = (event: KeyboardEvent, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        focusCharacter(event.key === "Home" ? 0 : event.key === "End" ? 3 : index + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "Backspace" || event.key === "Delete") {
        resetInputError();
        if (event.key === "Backspace" && !characters.value[index] && index > 0) {
            event.preventDefault();
            characters.value[index - 1] = "";
            focusCharacter(index - 1);
        }
    } else if (event.key.length === 1) {
        // Replace a filled box rather than letting maxlength swallow an edit.
        (event.target as HTMLInputElement).select();
    }
};
const join = async (id: string) => {
    if (!active || joining.value || joinedCode === id) return;
    if (!auth.isAuthenticated) {
        if (pending.value === id && auth.isLoginDialog) return;
        pending.value = id;
        auth.isLoginDialog = true;
        return;
    }
    pending.value = null;
    joining.value = true;
    error.value = "";
    try {
        await lobby.joinLobby(id);
        joinedCode = id;
    } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not join this lobby. Check the invite and try again.";
        if (active) {
            error.value = message;
            toast.add({ severity: "error", summary: "Could not join the lobby", detail: message });
        }
    } finally {
        if (active) joining.value = false;
    }
};
const submit = () => {
    if (!active || joining.value || rejectedInput.value) return;
    const id = readCode(characters.value.join(""));
    if (id) void join(id);
};
watch(
    () => auth.isAuthenticated,
    (signedIn) => {
        if (signedIn && pending.value) void join(pending.value);
    }
);
watch(
    () => auth.isLoginDialog,
    (open) => {
        if (!open && !auth.isAuthenticated) pending.value = null;
    }
);
onMounted(() => {
    if (hasInvite) {
        const id = applyCode(initialCode);
        if (id) void join(id);
        else focusCharacter(0);
    } else focusCharacter(0);
});
onBeforeUnmount(() => {
    active = false;
    pending.value = null;
});
useHead({ title: "Join a lobby" });
</script>
<style scoped>
.join-page {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
}
.join-shell {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 1.25rem 0.75rem;
    min-width: 0;
}
.join-card {
    width: min(100%, 27rem);
    padding: clamp(1rem, 4vw, 2rem);
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
    background: var(--gb-surface);
    box-shadow: 0 18px 48px #0004;
}
h1 {
    font-size: clamp(1.65rem, 5vw, 2.15rem);
    font-weight: 800;
    margin-bottom: 1.5rem;
}
.join-form {
    display: grid;
    gap: 0.75rem;
}
.code-fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    min-width: 0;
    width: 100%;
}
.code-fieldset legend {
    padding: 0;
    margin-bottom: 0.65rem;
    color: var(--gb-muted);
    font: 600 0.68rem var(--gb-font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
}
.code-boxes {
    display: flex;
    gap: clamp(0.4rem, 2vw, 0.75rem);
}
.code-input {
    font: 700 clamp(1.5rem, 6vw, 2rem) / 1 var(--gb-font-mono);
    width: clamp(48px, 14vw, 64px);
    height: clamp(52px, 15vw, 64px);
    min-height: 48px;
    min-width: 0;
    flex: none;
    padding: 0.25rem;
    border: 1px solid var(--gb-accent-end);
    border-radius: 3px;
    color: var(--gb-accent);
    background: var(--gb-bg);
    box-shadow: inset 0 -3px #5f8d4e80;
    text-align: center;
    caret-color: var(--gb-accent);
}
.code-input:focus {
    border-color: var(--gb-accent);
    box-shadow: inset 0 -3px var(--gb-accent);
}
.code-input[aria-invalid="true"] {
    border-color: var(--gb-danger);
    box-shadow: inset 0 -3px #ffb4b480;
}
.join-button {
    width: 100%;
    min-height: 52px;
    justify-content: space-between;
}
.field-error {
    overflow-wrap: anywhere;
}
.directory-link {
    font-size: 0.8rem;
    margin-top: 0.75rem;
}
@media (max-height: 480px) and (orientation: landscape) {
    .join-shell {
        padding-block: 0.75rem;
    }
    .join-card {
        width: min(100%, 38rem);
        padding: 0.5rem 1rem;
    }
    h1 {
        font-size: 1.4rem;
        margin-bottom: 0.5rem;
    }
    .join-form {
        gap: 0.5rem;
    }
    .code-input {
        width: 48px;
        height: 48px;
    }
    .directory-link {
        margin-top: 0;
    }
}
@media (min-width: 480px) and (max-height: 480px) and (orientation: landscape) {
    .join-form {
        grid-template-columns: minmax(0, 1fr) minmax(8rem, 0.7fr);
    }
    .join-form > .field-help,
    .join-form > .field-error {
        grid-column: 1 / -1;
    }
    .join-button {
        grid-column: 2;
        grid-row: 1;
        align-self: center;
    }
}
</style>
