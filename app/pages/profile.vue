<template>
    <div>
        <Header />
        <main id="main-content" class="page-shell">
            <div class="page-heading">
                <div>
                    <p class="eyebrow">Your explorer identity</p>
                    <h1>Profile</h1>
                </div>
                <NuxtLink to="/journal" class="btn btn-secondary"><UiIcon name="journal" /> Expedition journal</NuxtLink>
            </div>
            <ClientOnly
                ><div class="profile-layout">
                    <aside class="panel identity-panel">
                        <div class="profile-avatar">{{ (player.displayName || "E").slice(0, 1).toUpperCase() }}</div>
                        <h2>{{ player.displayName || "Explorer" }}</h2>
                        <span class="badge mt-4">{{ player.guest ? "Guest explorer" : "Registered explorer" }}</span>
                        <hr class="divider" />
                        <dl class="identity-details">
                            <div>
                                <dt>Username</dt>
                                <dd>{{ player.username || "Guest session" }}</dd>
                            </div>
                            <div>
                                <dt>Display name</dt>
                                <dd>{{ player.displayName || "Not set" }}</dd>
                            </div>
                        </dl>
                    </aside>
                    <section v-if="!player.guest" class="panel">
                        <h2>Make it yours</h2>
                        <p class="muted mt-2 mb-6">Update your name, or choose a new password.</p>
                        <form class="form-stack" @submit.prevent="submit">
                            <div class="field">
                                <label for="profile-display">Display name</label
                                ><input
                                    id="profile-display"
                                    v-model="form.displayName"
                                    class="input"
                                    autocomplete="nickname"
                                    minlength="3"
                                    maxlength="15"
                                    required
                                    aria-describedby="profile-name-help"
                                />
                                <p id="profile-name-help" class="field-help">3–15 characters. Shown to other players.</p>
                            </div>
                            <hr class="divider !my-1" />
                            <div class="field">
                                <label for="profile-password">New password <span class="muted font-normal">(optional)</span></label
                                ><UiPassword id="profile-password" v-model="form.password" autocomplete="new-password" describedby="profile-password-help" />
                                <p id="profile-password-help" class="field-help">Leave blank to keep your current password.</p>
                            </div>
                            <div class="field">
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
                            <div class="btn-row justify-end">
                                <button class="btn btn-secondary" type="button" :disabled="busy" @click="reset">Reset changes</button
                                ><button class="btn" type="submit" :disabled="!valid || busy" :aria-busy="busy">
                                    <span v-if="busy" class="spinner" /><UiIcon v-else name="check" />Save changes
                                </button>
                            </div>
                        </form>
                    </section>
                    <section v-else class="panel guest-profile">
                        <p class="eyebrow">Travel light</p>
                        <h2>You’re exploring as a guest.</h2>
                        <p class="muted mt-4">Your guest name works in every lobby. To customize a profile or sign in again later, create an account.</p>
                        <p class="field-help mt-4">A new account is a separate identity. Your current guest journal stays with this guest on this device.</p>
                        <NuxtLink to="/signup" class="btn mt-6">Create an account <UiIcon name="arrow" /></NuxtLink>
                    </section>
                </div>
                <template #fallback
                    ><section class="panel">
                        <h2>Your explorer profile</h2>
                        <p class="muted mt-4">Your account details and profile controls will appear once your identity is confirmed.</p>
                    </section></template
                ></ClientOnly
            >
        </main>
    </div>
</template>
<script setup lang="ts">
const player = usePlayerInfo();
const auth = useAuthStore();
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
.profile-layout {
    display: grid;
    grid-template-columns: minmax(230px, 0.7fr) minmax(0, 1.6fr);
    gap: 1.5rem;
    align-items: start;
}
.identity-panel h2 {
    overflow-wrap: anywhere;
    margin-top: 1.5rem;
}
.profile-avatar {
    display: grid;
    place-items: center;
    width: 70px;
    height: 70px;
    border: 1px solid var(--gb-line);
    border-radius: 50%;
    color: var(--gb-accent);
    font-size: 2rem;
}
.identity-details {
    display: grid;
    gap: 1.5rem;
}
.identity-details dt {
    font-size: 0.75rem;
    color: var(--gb-muted);
}
.identity-details dd {
    margin: 0.4rem 0 0;
    overflow-wrap: anywhere;
}
.guest-profile {
    padding-block: 2.5rem;
}
@media (max-width: 700px) {
    .profile-layout {
        grid-template-columns: 1fr;
    }
}
</style>
