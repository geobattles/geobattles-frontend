<template>
    <div>
        <Header />
        <main id="main-content" class="page-shell signup-shell">
            <section class="signup-intro">
                <p class="eyebrow">Make yourself at home</p>
                <h1>One name.<br />A whole world.</h1>
                <p class="muted mt-6">Create your explorer account, gather your friends, and see where the next expedition takes you.</p>
                <NuxtLink to="/" class="text-link mt-6">Back to the world <UiIcon name="arrow" /></NuxtLink>
            </section>
            <section class="panel">
                <h2>Create an account</h2>
                <p class="muted mt-2 mb-6">Your display name is what other explorers see.</p>
                <form class="form-stack" @submit.prevent="submit">
                    <div class="field">
                        <label for="signup-username">Username</label
                        ><input
                            id="signup-username"
                            v-model="username"
                            class="input"
                            autocomplete="username"
                            required
                            minlength="3"
                            :aria-invalid="(submitted && username.length < 3) || undefined"
                            aria-describedby="signup-username-help"
                        />
                        <p id="signup-username-help" class="field-help">At least 3 characters. Use this to sign in.</p>
                    </div>
                    <div class="field">
                        <label for="signup-display">Display name</label
                        ><input
                            id="signup-display"
                            v-model="displayName"
                            class="input"
                            autocomplete="nickname"
                            required
                            minlength="3"
                            maxlength="15"
                            aria-describedby="signup-display-help"
                        />
                        <p id="signup-display-help" class="field-help">3–15 characters. Visible in lobbies and games.</p>
                    </div>
                    <div class="field">
                        <label for="signup-password">Password</label><UiPassword id="signup-password" v-model="password" autocomplete="new-password" required />
                    </div>
                    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
                    <button type="submit" class="btn btn-large" :disabled="busy" :aria-busy="busy">
                        <span v-if="busy" class="spinner" />{{ busy ? "Creating your account" : "Create account" }}<UiIcon v-if="!busy" name="arrow" />
                    </button>
                    <p class="field-help">Already an explorer? <button type="button" class="text-link" @click="auth.isLoginDialog = true">Sign in</button></p>
                </form>
            </section>
        </main>
    </div>
</template>
<script setup lang="ts">
const auth = useAuthStore();
const router = useRouter();
const app = useNuxtApp();
const username = ref("");
const displayName = ref("");
const password = ref("");
const error = ref("");
const submitted = ref(false);
const busy = ref(false);
const submit = async () => {
    if (busy.value) return;
    submitted.value = true;
    if (username.value.length < 3 || displayName.value.trim().length < 3 || displayName.value.trim().length > 15 || !password.value) {
        error.value = "Check your username, display name, and password.";
        return;
    }
    error.value = "";
    busy.value = true;
    const isCurrent = app.$gameRuntime.captureNavigation();
    try {
        await auth.register(username.value, password.value, displayName.value.trim());
        password.value = "";
        if (isCurrent()) {
            auth.isLoginDialog = false;
            await router.push("/");
        }
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : "Could not create an account. Please try again.";
    } finally {
        busy.value = false;
    }
};
useHead({ title: "Create account" });
</script>
<style scoped>
.signup-shell {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 8vw, 7rem);
    max-width: 1100px;
    align-items: start;
}
.signup-intro {
    padding-top: 2rem;
}
.signup-intro h1 {
    font-size: clamp(2.6rem, 5vw, 4.5rem);
}
.signup-intro > p.muted {
    max-width: 26rem;
    line-height: 1.8;
}
@media (max-width: 760px) {
    .signup-shell {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    .signup-intro {
        padding-top: 0;
    }
}
</style>
