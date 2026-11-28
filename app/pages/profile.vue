<template>
    <div class="profile-shell">
        <picture class="profile-scenery" aria-hidden="true">
            <source media="(max-width: 700px) and (orientation: portrait)" srcset="/images/emerald-lake-portrait.webp" />
            <img src="/images/emerald-lake.webp" alt="" width="1672" height="941" />
        </picture>
        <Header navigation />
        <main id="main-content" class="page-shell profile-page">
            <header class="profile-heading">
                <h1>Profile</h1>
                <NuxtLink to="/journal" class="btn btn-secondary journal-pill"><UiIcon name="journal" /><span>Expedition journal</span></NuxtLink>
            </header>
            <ClientOnly>
                <div class="profile-layout">
                    <aside class="profile-card identity-panel" aria-label="Player identity">
                        <div class="identity-main">
                            <div class="profile-avatar" aria-hidden="true">{{ (player.displayName || "E").slice(0, 1).toUpperCase() }}</div>
                            <div class="identity-copy">
                                <h2>{{ player.displayName || "Explorer" }}</h2>
                                <p class="identity-kind" :class="{ 'is-guest': player.guest }">{{ player.guest ? "Guest explorer" : "Registered explorer" }}</p>
                            </div>
                        </div>
                        <dl v-if="player.username" class="identity-details">
                            <div>
                                <dt>Username</dt>
                                <dd>{{ player.username }}</dd>
                            </div>
                        </dl>
                    </aside>
                    <section v-if="!player.guest" class="profile-card account-panel" :data-compact-form="compact || undefined" :style="viewportStyle">
                        <div class="panel-title-row">
                            <span class="panel-emblem" aria-hidden="true"><UiIcon name="settings" /></span>
                            <h2>Account settings</h2>
                        </div>
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
                                <label for="profile-password">New password <span class="label-optional">(optional)</span></label
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
                            <p v-if="saved" class="save-confirmation" role="status"><UiIcon name="check" />Your profile has been updated.</p>
                            <div class="btn-row profile-actions">
                                <UiKeyboardDone v-if="compact" @click="finishEditing" />
                                <button class="btn btn-secondary profile-reset" type="button" :disabled="busy" @click="reset">Reset changes</button
                                ><button class="btn profile-save" type="submit" :disabled="!valid || busy" :aria-busy="busy">
                                    <span v-if="busy" class="spinner" /><UiIcon v-else name="check" />Save changes
                                </button>
                            </div>
                        </form>
                    </section>
                    <section v-else class="profile-card guest-profile">
                        <h2>You’re exploring as a guest.</h2>
                        <p class="guest-lead">Create an account to edit your profile and sign in again later.</p>
                        <p class="field-help">A new account is a separate identity. Your guest journal stays with your guest profile on this device.</p>
                        <NuxtLink to="/signup" class="btn profile-save guest-cta">Create an account <UiIcon name="arrow" /></NuxtLink>
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
    background: #041e1a;
    color: #f4fbf3;
}
.profile-scenery {
    position: fixed;
    z-index: -1;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
}
.profile-scenery img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 44%;
}
.profile-scenery::before,
.profile-scenery::after {
    position: absolute;
    inset: 0;
    content: "";
}
.profile-scenery::before {
    z-index: 1;
    background: url("/images/atlas-relief.svg") top right / min(100%, 64rem) auto no-repeat;
    opacity: 0.7;
}
.profile-scenery::after {
    background: radial-gradient(ellipse at 50% 18%, #07302898, transparent 60%), linear-gradient(180deg, #04211ca6, #041d1896 42%, #031714f2 92%);
}
.profile-page {
    max-width: 58rem;
    padding-inline: max(clamp(0.75rem, 3vw, 1.75rem), env(safe-area-inset-left)) max(clamp(0.75rem, 3vw, 1.75rem), env(safe-area-inset-right));
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}
.profile-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    margin-block: clamp(0.65rem, 2.5vw, 1.65rem) clamp(0.75rem, 2vw, 1.35rem);
}
.profile-heading h1 {
    font: italic 900 clamp(1.85rem, 5vw, 3.1rem) / 1.02 var(--gb-font-display);
    letter-spacing: -0.045em;
    color: #f7fbf4;
    text-shadow: 0 4px 20px #021814c8;
}
.journal-pill {
    min-height: 38px;
    padding: 0.25rem 0.85rem;
    gap: 0.42rem;
    border: 1px solid #9be0a54a;
    border-radius: 999px;
    background: linear-gradient(150deg, #103a2fe0, #07241ee8);
    box-shadow:
        inset 0 1px #e2ffd020,
        0 6px 18px #00140f55;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #eefbf2;
    font-size: 0.78rem;
    font-weight: 740;
    text-decoration: none;
}
.journal-pill:hover {
    border-color: #c8f99488;
    background: #17493a;
}
.journal-pill .ui-icon {
    width: 0.95rem;
    height: 0.95rem;
    color: #b8f695;
}
.profile-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.76fr) minmax(0, 1.34fr);
    gap: clamp(0.65rem, 2vw, 1.25rem);
    align-items: start;
}
.profile-card {
    min-width: 0;
    padding: clamp(0.9rem, 2.6vw, 1.45rem);
    border: 1px solid #8ddbaf4d;
    border-top-color: #c8f99466;
    border-radius: 1.25rem;
    background: linear-gradient(155deg, #0e382fe8, #06211cf2 74%, #0d3228ea);
    box-shadow:
        0 1rem 3rem #00130f78,
        inset 0 1px #e2ffd022;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}
.identity-panel {
    background:
        url("/images/atlas-relief.svg") right bottom / 22rem auto no-repeat,
        linear-gradient(155deg, #113e34ec, #06211cf4 76%);
}
.identity-main {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 0.78rem;
}
.identity-copy {
    min-width: 0;
    display: grid;
    gap: 0.28rem;
    justify-items: start;
}
.identity-panel h2 {
    overflow-wrap: anywhere;
    font: italic 850 clamp(1.1rem, 2.6vw, 1.45rem) / 1.1 var(--gb-font-display);
    letter-spacing: -0.025em;
    color: #f4fbf3;
}
.identity-kind {
    display: inline-flex;
    align-items: center;
    padding: 0.14rem 0.56rem;
    border: 1px solid #70d9af52;
    border-radius: 999px;
    background: #70d9af1e;
    color: #a4f5cf;
    font-size: 0.7rem;
    font-weight: 740;
    line-height: 1.3;
}
.identity-kind.is-guest {
    border-color: #ffca6255;
    background: #ffca621c;
    color: #ffe299;
}
.profile-avatar {
    display: grid;
    place-items: center;
    flex: none;
    width: clamp(2.85rem, 6.5vw, 3.6rem);
    aspect-ratio: 1;
    border: 1px solid var(--gb-scenic-action-border);
    border-radius: 0.95rem;
    background: var(--gb-scenic-action-fill);
    box-shadow:
        inset 0 1px #ffffff70,
        0 6px 18px #7ae76428;
    color: var(--gb-scenic-action-ink);
    font: italic 900 clamp(1.4rem, 3.2vw, 1.8rem) / 1 var(--gb-font-display);
}
.identity-details {
    display: grid;
    gap: 0.42rem;
    margin: 0.9rem 0 0;
}
.identity-details > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.46rem 0.68rem;
    border: 1px solid #9be0a526;
    border-radius: 0.72rem;
    background: #051e1bc8;
}
.identity-details dt {
    color: #a8c7b8;
    font-size: 0.73rem;
    font-weight: 660;
}
.identity-details dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: #eefbf2;
    font: 700 0.79rem / 1.25 var(--gb-font-mono);
}
.panel-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid #9be0a528;
}
.panel-emblem {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 1.85rem;
    height: 1.85rem;
    border: 1px solid #9be0a542;
    border-radius: 50%;
    background: #b6efa318;
    color: #b8f695;
}
.panel-emblem .ui-icon {
    width: 0.95rem;
    height: 0.95rem;
}
.account-panel h2,
.guest-profile h2 {
    font: italic 850 clamp(1.05rem, 2.4vw, 1.32rem) / 1.15 var(--gb-font-display);
    letter-spacing: -0.025em;
    color: #f4fbf3;
}
.profile-form {
    display: grid;
    gap: 0.8rem;
    margin-top: 0.85rem;
}
.profile-form .field {
    display: grid;
    gap: 0.3rem;
}
.profile-form label {
    color: #dfefe5;
    font-size: 0.78rem;
    font-weight: 720;
}
.label-optional {
    color: #97b9aa;
    font-weight: 500;
}
.profile-form :deep(.input) {
    min-height: 40px;
    padding: 0.42rem 0.72rem;
    border: 1px solid #9be0a538;
    border-radius: 0.72rem;
    background: #051e1bd8;
    color: #f4fbf3;
    font-size: 0.88rem;
    transition:
        border-color 140ms ease,
        box-shadow 140ms ease;
}
.profile-form :deep(.input:focus) {
    border-color: #b7f98699;
    box-shadow: 0 0 0 2px #b7f98624;
    outline: none;
}
.profile-form :deep(.password-field .input) {
    padding-inline-end: 2.5rem;
}
.profile-form :deep(.password-field button) {
    min-width: 34px;
    min-height: 34px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    color: #a9cdb9;
}
.profile-form :deep(.password-field button:hover) {
    background: #a4ecd31c;
    color: #e6fff2;
}
.profile-form .field-help {
    margin: 0;
    color: #9dc0b0;
    font-size: 0.71rem;
    line-height: 1.35;
}
.save-confirmation {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 0.42rem 0.68rem;
    border: 1px solid #70d9af52;
    border-radius: 0.72rem;
    background: #70d9af1c;
    color: #c1f8a2;
    font-size: 0.78rem;
    font-weight: 720;
}
.save-confirmation .ui-icon {
    width: 0.92rem;
    height: 0.92rem;
    flex: none;
}
.profile-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.45rem;
    margin-top: 0.15rem;
    padding-top: 0.75rem;
    border-top: 1px solid #9be0a526;
}
.profile-reset,
.profile-save {
    min-height: 38px;
    padding: 0.25rem 0.95rem;
    border-radius: 999px;
    font-size: 0.79rem;
    font-weight: 760;
    white-space: nowrap;
}
.profile-reset {
    border: 1px solid #9be0a542;
    background: #0c3128d8;
    color: #e3f4e8;
}
.profile-reset:enabled:hover {
    border-color: #c8f99488;
    background: #164839;
}
.profile-save {
    border: 1px solid var(--gb-scenic-action-border);
    background: var(--gb-scenic-action-fill);
    color: var(--gb-scenic-action-ink);
    font-weight: 820;
}
.profile-save:enabled:hover {
    box-shadow: var(--gb-scenic-action-shadow);
}
.profile-save:disabled {
    opacity: 0.46;
}
.guest-profile {
    display: grid;
    gap: 0.65rem;
    justify-items: start;
}
.guest-lead {
    margin: 0;
    color: #d6ede2;
    font-size: 0.85rem;
    line-height: 1.4;
}
.guest-profile .field-help {
    margin: 0;
    color: #9dc0b0;
    font-size: 0.74rem;
    line-height: 1.4;
}
.guest-cta {
    margin-top: 0.35rem;
    text-decoration: none;
}
.account-panel[data-compact-form] .profile-form {
    max-height: max(5rem, calc(var(--visible-height, var(--gb-viewport-height)) - 3rem - var(--gb-safe-bottom)));
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.3rem;
}
@media (max-width: 760px) and (orientation: portrait) {
    .profile-layout {
        grid-template-columns: minmax(0, 1fr);
        gap: 0.58rem;
    }
    .profile-heading {
        margin-block: 0.55rem 0.65rem;
    }
    .profile-heading h1 {
        font-size: clamp(1.55rem, 6.4vw, 2.15rem);
    }
    .journal-pill {
        min-height: 34px;
        padding: 0.18rem 0.68rem;
        font-size: 0.73rem;
    }
    .profile-card {
        padding: 0.82rem;
        border-radius: 1.05rem;
    }
    .profile-form {
        gap: 0.65rem;
        margin-top: 0.7rem;
    }
    .profile-form :deep(.input) {
        min-height: 38px;
        font-size: 0.84rem;
    }
    .profile-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .profile-actions > :only-child {
        grid-column: 1 / -1;
    }
    .profile-reset,
    .profile-save {
        width: 100%;
        min-height: 38px;
        font-size: 0.76rem;
    }
}
@media (orientation: landscape) and (max-height: 540px) {
    .profile-heading {
        margin-block: 0.42rem 0.5rem;
    }
    .profile-heading h1 {
        font-size: clamp(1.35rem, 3.6vw, 1.85rem);
    }
    .journal-pill {
        min-height: 32px;
        padding: 0.15rem 0.65rem;
        font-size: 0.72rem;
    }
    .profile-layout {
        grid-template-columns: minmax(0, 0.74fr) minmax(0, 1.36fr);
        gap: 0.55rem;
    }
    .profile-card {
        padding: 0.72rem 0.85rem;
        border-radius: 1rem;
    }
    .profile-form {
        gap: 0.52rem;
        margin-top: 0.58rem;
    }
    .profile-form :deep(.input) {
        min-height: 34px;
        padding: 0.25rem 0.62rem;
        font-size: 0.82rem;
    }
    .profile-actions {
        padding-top: 0.52rem;
    }
    .profile-reset,
    .profile-save {
        min-height: 34px;
        font-size: 0.74rem;
    }
}
</style>
