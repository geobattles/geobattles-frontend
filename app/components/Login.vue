<template>
    <UiDialog v-model:open="auth.isLoginDialog" class="login-dialog" :title="isGuest ? 'Play as guest' : 'Sign in'" :style="viewportStyle">
        <form v-if="!isGuest" class="form-stack login-form" @submit.prevent="authenticate('login')">
            <div class="field">
                <label :for="`${id}-username`">Username</label
                ><input :id="`${id}-username`" v-model="username" class="input" autocomplete="username" autocapitalize="none" spellcheck="false" enterkeyhint="next" required />
            </div>
            <div class="field">
                <label :for="`${id}-password`">Password</label><UiPassword :id="`${id}-password`" v-model="password" autocomplete="current-password" required />
            </div>
            <p v-if="error" class="field-error" role="alert">{{ error }}</p>
            <button class="btn" type="submit" :disabled="busy" :aria-busy="busy"><span v-if="busy" class="spinner" />Sign in <UiIcon v-if="!busy" name="arrow" /></button>
        </form>
        <form v-else class="form-stack login-form" @submit.prevent="authenticate('guest')">
            <div class="field">
                <label :for="`${id}-guest`">Display name</label
                ><input
                    :id="`${id}-guest`"
                    v-model="displayName"
                    class="input"
                    autocomplete="nickname"
                    enterkeyhint="go"
                    minlength="3"
                    maxlength="15"
                    :aria-describedby="`${id}-guest-help`"
                    required
                />
                <p :id="`${id}-guest-help`" class="field-help">3–15 characters. Other players will see this.</p>
            </div>
            <p v-if="error" class="field-error" role="alert">{{ error }}</p>
            <button class="btn" type="submit" :disabled="busy" :aria-busy="busy"><span v-if="busy" class="spinner" />Continue as guest <UiIcon v-if="!busy" name="arrow" /></button>
        </form>
        <div class="login-options">
            <button class="text-link" type="button" :disabled="busy" @click="switchMode">{{ isGuest ? "Sign in instead" : "Play as guest" }}</button>
            <NuxtLink v-if="!busy" class="text-link" to="/signup">Create account</NuxtLink>
        </div>
    </UiDialog>
</template>
<script setup lang="ts">
const id = useId();
const auth = useAuthStore();
const isGuest = computed(() => auth.loginDialogMode === "guest");
const username = ref("");
const password = ref("");
const displayName = ref("");
const busy = ref(false);
const error = ref("");
const viewportStyle = shallowRef<Record<string, string>>({});
let dialogRevision = 0;
const switchMode = () => {
    if (busy.value) return;
    password.value = "";
    error.value = "";
    auth.loginDialogMode = isGuest.value ? "login" : "guest";
};
const authenticate = async (kind: "login" | "guest") => {
    if (busy.value) return;
    const attempt = dialogRevision;
    error.value = "";
    busy.value = true;
    try {
        if (kind === "login") await auth.login(username.value, password.value);
        else await auth.register(null, null, displayName.value.trim());
        if (dialogRevision === attempt) auth.isLoginDialog = false;
    } catch (cause) {
        if (dialogRevision === attempt) error.value = cause instanceof Error ? cause.message : "Could not sign in. Please try again.";
    } finally {
        busy.value = false;
    }
};
watch(
    () => auth.isLoginDialog,
    (open) => {
        if (open) return;
        dialogRevision++;
        username.value = "";
        password.value = "";
        displayName.value = "";
        error.value = "";
    },
    { flush: "sync" }
);

onMounted(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    watch(
        () => auth.isLoginDialog,
        (open, _previous, onCleanup) => {
            if (!open) return;
            const update = () => {
                // The keyboard can shrink the visible area without resizing the layout viewport.
                // Let native scrolling and zoom handle pinch-zoomed views instead of resizing with them.
                viewportStyle.value =
                    viewport.scale === 1 && viewport.height > 0 ? { "--login-viewport-top": `${viewport.offsetTop}px`, "--login-viewport-height": `${viewport.height}px` } : {};
            };
            update();
            viewport.addEventListener("resize", update);
            viewport.addEventListener("scroll", update);
            onCleanup(() => {
                viewport.removeEventListener("resize", update);
                viewport.removeEventListener("scroll", update);
                viewportStyle.value = {};
            });
        },
        { immediate: true }
    );
});
onBeforeUnmount(() => {
    dialogRevision++;
});
</script>
<style scoped>
.login-dialog {
    --login-gutter-top: max(0.5rem, env(safe-area-inset-top));
    --login-gutter-bottom: max(0.5rem, env(safe-area-inset-bottom));
    top: calc(var(--login-viewport-top, 0px) + var(--login-gutter-top));
    bottom: calc(100% - var(--login-viewport-top, 0px) - var(--login-viewport-height, 100dvh) + var(--login-gutter-bottom));
    width: min(27rem, calc(100% - 1.5rem));
    height: fit-content;
    max-height: calc(var(--login-viewport-height, 100dvh) - var(--login-gutter-top) - var(--login-gutter-bottom));
    scroll-padding-block: 0.5rem;
    overscroll-behavior: contain;
}
.login-dialog :deep(.ui-dialog-inner) {
    padding: clamp(0.75rem, 3vw, 1.25rem);
}
.login-dialog :deep(.ui-dialog-header) {
    align-items: center;
    margin-bottom: 0.5rem;
}
.login-form {
    gap: 0.65rem;
}
.login-options {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 1rem;
    margin-top: 0.25rem;
    font-size: 0.85rem;
}
.login-options > * {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
}
@media (min-width: 560px) and (max-height: 480px) {
    .login-dialog {
        width: min(34rem, calc(100% - 2rem));
    }
    .login-form:has(.password-field) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .login-form > :not(.field) {
        grid-column: 1 / -1;
    }
}
</style>
