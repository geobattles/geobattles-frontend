<template>
    <div class="login-layout">
        <form class="form-stack" @submit.prevent="signIn">
            <div>
                <h3>Welcome back</h3>
                <p class="field-help mt-2">Sign in to your explorer account.</p>
            </div>
            <div class="field">
                <label :for="`${id}-username`">Username</label><input :id="`${id}-username`" v-model="username" class="input" autocomplete="username" required autofocus />
            </div>
            <div class="field">
                <label :for="`${id}-password`">Password</label><UiPassword :id="`${id}-password`" v-model="password" autocomplete="current-password" required />
            </div>
            <p v-if="error && mode === 'login'" class="field-error" role="alert">{{ error }}</p>
            <button class="btn" type="submit" :disabled="busy" :aria-busy="busy && mode === 'login'">
                <span v-if="busy && mode === 'login'" class="spinner" />Sign in <UiIcon name="arrow" />
            </button>
        </form>
        <form class="form-stack guest-form" @submit.prevent="playAsGuest">
            <div>
                <p class="eyebrow">No account needed</p>
                <h3>Just here to explore?</h3>
                <p class="field-help mt-2">Choose a name your friends will recognize. You can play straight away as a guest.</p>
            </div>
            <div class="field">
                <label :for="`${id}-guest`">Display name</label
                ><input :id="`${id}-guest`" v-model="displayName" class="input" autocomplete="nickname" minlength="3" maxlength="15" placeholder="Your explorer name" required />
                <p class="field-help">3–15 characters. Visible to other players.</p>
            </div>
            <p v-if="error && mode === 'guest'" class="field-error" role="alert">{{ error }}</p>
            <button class="btn btn-secondary" type="submit" :disabled="busy" :aria-busy="busy && mode === 'guest'">
                <span v-if="busy && mode === 'guest'" class="spinner" />Continue as guest <UiIcon name="arrow" />
            </button>
            <p class="field-help">Prefer an account? <NuxtLink class="text-link" to="/signup">Create one</NuxtLink></p>
        </form>
    </div>
</template>
<script setup lang="ts">
const id = useId();
const auth = useAuthStore();
const emit = defineEmits<{ userLogged: [] }>();
const username = ref("");
const password = ref("");
const displayName = ref("");
const busy = ref(false);
const error = ref("");
const mode = ref<"login" | "guest">("login");
const authenticate = async (kind: "login" | "guest") => {
    if (busy.value) return;
    mode.value = kind;
    error.value = "";
    busy.value = true;
    try {
        if (kind === "login") await auth.login(username.value, password.value);
        else await auth.register(null, null, displayName.value.trim());
        password.value = "";
        emit("userLogged");
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : "Could not sign in. Please try again.";
    } finally {
        busy.value = false;
    }
};
const signIn = () => authenticate("login");
const playAsGuest = () => authenticate("guest");
</script>
<style scoped>
.login-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
}
.guest-form {
    border-left: 1px solid var(--gb-line);
    padding-left: 3rem;
    justify-content: flex-start;
}
@media (max-width: 700px) {
    .login-layout {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    .guest-form {
        border-left: none;
        border-top: 1px solid var(--gb-line);
        padding-left: 0;
        padding-top: 2rem;
    }
}
</style>
