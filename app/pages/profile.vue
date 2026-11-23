<template>
    <div class="profile-shell">
        <picture class="profile-scenery" aria-hidden="true">
            <source media="(max-width: 700px) and (orientation: portrait)" srcset="/images/emerald-lake-portrait.webp" />
            <img src="/images/emerald-lake.webp" alt="" width="1672" height="941" />
        </picture>
        <Header scenic navigation />
        <main id="main-content" class="page-shell profile-page">
            <header class="profile-heading">
                <h1>Profile</h1>
                <NuxtLink to="/journal" class="btn btn-secondary"><UiIcon name="journal" /> Expedition journal</NuxtLink>
            </header>
            <ClientOnly>
                <div class="profile-layout">
                    <aside class="profile-card identity-panel" aria-label="Player identity">
                        <div class="identity-main">
                            <div class="profile-avatar" aria-hidden="true">{{ (player.displayName || "E").slice(0, 1).toUpperCase() }}</div>
                            <div>
                                <h2>{{ player.displayName || "Explorer" }}</h2>
                                <p class="identity-kind">{{ player.guest ? "Guest explorer" : "Registered explorer" }}</p>
                            </div>
                        </div>
                        <dl v-if="player.username" class="identity-details">
                            <dt>Username</dt>
                            <dd>{{ player.username }}</dd>
                        </dl>
                    </aside>
                    <section v-if="!player.guest" class="profile-card account-panel" :data-compact-form="compact || undefined" :style="viewportStyle">
                        <h2>Account settings</h2>
                        <form ref="editor" class="form-stack profile-form" :data-viewport-scroll="compact || undefined" @submit.prevent="submit">
                            <div class="field" data-viewport-field>
                                <label for="profile-display">Display name</label
                                ><input
                                    id="profile-display"
                                    v-model="form.displayName"
                                    class="input"
                                    autocomplete="nickname"
                                    autocapitalize="words"
                                    minlength="3"
                                    maxlength="15"
                                    required
                                    aria-describedby="profile-name-help"
                                />
                                <p id="profile-name-help" class="field-help">3–15 characters. Shown to other players.</p>
                            </div>
                            <div class="field" data-viewport-field>
                                <label for="profile-password">New password <span class="muted font-normal">(optional)</span></label
                                ><UiPassword id="profile-password" v-model="form.password" autocomplete="new-password" describedby="profile-password-help" />
                                <p id="profile-password-help" class="field-help">Leave blank to keep your current password.</p>
                            </div>
                            <div class="field" data-viewport-field>
                                <label for="profile-confirm">Confirm new password</label
                                ><UiPassword
                                    id="profile-confirm"
                                    v-model="form.confirmPassword"
                                    autocomplete="new-password"
                                    :required="!!form.password"
                                    :invalid="!!form.confirmPassword && form.password !== form.confirmPassword"
                                    describedby="profile-confirm-help"
                                />
                                <p v-if="form.confirmPassword && form.password !== form.confirmPassword" id="profile-confirm-help" class="field-error">
                                    The passwords do not match.
                                </p>
                            </div>
                            <p v-if="error" class="field-error" role="alert">{{ error }}</p>
                            <p v-if="saved" class="accent" role="status">Your profile has been updated.</p>
                            <div class="btn-row profile-actions">
                                <UiKeyboardDone v-if="compact" @click="finishEditing" />
                                <button class="btn btn-secondary" type="button" :disabled="busy" @click="reset">Reset changes</button
                                ><button class="btn" type="submit" :disabled="!valid || busy" :aria-busy="busy">
                                    <span v-if="busy" class="spinner" /><UiIcon v-else name="check" />Save changes
                                </button>
                            </div>
                        </form>
                    </section>
                    <section v-else class="profile-card guest-profile">
                        <h2>You’re exploring as a guest.</h2>
                        <p class="muted mt-4">Create an account to edit your profile and sign in again later.</p>
                        <p class="field-help mt-4">A new account is a separate identity. Your guest journal stays with your guest profile on this device.</p>
                        <NuxtLink to="/signup" class="btn mt-6">Create an account <UiIcon name="arrow" /></NuxtLink>
                    </section>
                </div>
                <template #fallback>
                    <p class="profile-card" role="status">Loading your profile…</p>
                </template>
            </ClientOnly>
        </main>
    </div>
</template>
<script setup lang="ts">
const player = usePlayerInfo();
const auth = useAuthStore();
const editor = useTemplateRef("editor");
const { field, visibleHeight, editingHeightLoss, finishEditing } = useViewportForm(editor);
const compact = computed(() => !!field.value && visibleHeight.value < 300 && (editingHeightLoss.value >= 64 || visibleHeight.value < 220));
const viewportStyle = useViewportFit(() => compact.value);
const busy = ref(false);
const error = ref("");
const saved = ref(false);
const form = reactive({ displayName: player.value.displayName || "", password: "", confirmPassword: "" });
const valid = computed(
    () =>
        form.displayName.trim().length >= 3 &&
        form.displayName.trim().length <= 15 &&
        (!form.password || form.password === form.confirmPassword) &&
        (form.displayName.trim() !== player.value.displayName || !!form.password)
);
const reset = () => {
    form.displayName = player.value.displayName || "";
    form.password = "";
    form.confirmPassword = "";
    error.value = "";
    saved.value = false;
};
watch(() => player.value.ID, reset);
const submit = async () => {
    if (!valid.value || busy.value) return;
    busy.value = true;
    error.value = "";
    saved.value = false;
    try {
        await auth.updateUser(form.displayName.trim() !== player.value.displayName ? form.displayName.trim() : null, form.password || null);
        reset();
        saved.value = true;
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : "Could not update your profile. Please try again.";
    } finally {
        busy.value = false;
    }
};
useHead({ title: "Profile" });
</script>
<style scoped>
.profile-shell {
    position: relative;
    isolation: isolate;
    min-height: var(--gb-viewport-height);
    background: var(--gb-bg);
}
.profile-scenery {
    position: absolute;
    z-index: -1;
    inset: 0 0 auto;
    height: min(65dvh, 32rem);
    overflow: hidden;
    pointer-events: none;
}
.profile-scenery img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 43%;
}
.profile-scenery::after {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #041d17a8, var(--gb-bg));
    content: "";
}
.profile-page {
    max-width: 64rem;
}
.profile-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 0.75rem;
    margin-block: clamp(0.6rem, 3vw, 2rem) clamp(1rem, 3vw, 1.8rem);
}
.profile-heading h1 {
    font: italic 900 clamp(2.4rem, 6vw, 4.25rem) / 1 var(--gb-font-headline);
    letter-spacing: -0.055em;
    text-shadow: 0 2px 16px #001810;
}
.profile-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.45fr);
    gap: clamp(0.85rem, 2.5vw, 1.5rem);
    align-items: start;
}
.profile-card {
    min-width: 0;
    padding: clamp(1rem, 3vw, 1.7rem);
    border: 1px solid color-mix(in srgb, var(--gb-accent) 26%, var(--gb-bg));
    border-radius: 1rem;
    background: var(--gb-surface);
    box-shadow: 0 0.5rem 1.5rem #00181055;
}
.identity-panel {
    background:
        linear-gradient(145deg, #102b21cc, var(--gb-surface)),
        url("/images/atlas-relief.svg") center / cover,
        var(--gb-surface);
}
.identity-main {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 0.85rem;
}
.identity-panel h2 {
    overflow-wrap: anywhere;
    font-size: clamp(1.15rem, 3vw, 1.6rem);
}
.identity-kind {
    margin-top: 0.25rem;
    color: var(--gb-success);
    font-size: 0.86rem;
}
.profile-avatar {
    display: grid;
    place-items: center;
    flex: none;
    width: clamp(3rem, 8vw, 4rem);
    aspect-ratio: 1;
    border-radius: 0.9rem;
    background: var(--gb-action-fill);
    color: var(--gb-on-accent);
    font: italic 900 1.9rem var(--gb-font-headline);
}
.identity-details {
    display: grid;
    gap: 0.2rem;
    margin: 1rem 0 0;
    padding-top: 0.8rem;
    border-top: 1px solid color-mix(in srgb, var(--gb-line) 50%, transparent);
}
.identity-details dt {
    color: var(--gb-muted);
    font-size: 0.8rem;
}
.identity-details dd {
    margin: 0;
    overflow-wrap: anywhere;
}
.profile-form {
    margin-top: 1rem;
}
.profile-form :deep(.input) {
    font-size: max(16px, 1rem);
}
.profile-actions {
    justify-content: flex-end;
    padding-top: 0.75rem;
    border-top: 1px solid color-mix(in srgb, var(--gb-line) 50%, transparent);
}
.account-panel[data-compact-form] .profile-form {
    max-height: max(5rem, calc(var(--visible-height, var(--gb-viewport-height)) - 3rem - var(--gb-safe-bottom)));
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.3rem;
}
@media (max-width: 700px) {
    .profile-layout {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
