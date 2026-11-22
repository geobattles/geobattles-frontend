<template>
    <UiDialog v-model:open="auth.isLoginDialog" class="auth-dialog auth-surface" :title="title">
        <UiAuthExperience v-model:mode="auth.loginDialogMode" @authenticated="auth.isLoginDialog = false" />
    </UiDialog>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const titles = { login: "Sign in", guest: "Play as guest", register: "Create account" };
const title = computed(() => titles[auth.loginDialogMode]);
</script>

<style scoped>
.auth-dialog {
    --dialog-gap: 0.5rem;
    width: min(31rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    height: fit-content;
}
.auth-dialog::backdrop {
    background:
        linear-gradient(110deg, #031d1a48, #031b17b0),
        url("/images/emerald-lake.webp") center / cover no-repeat #052e24;
}
.auth-dialog:has([data-auth-compact])::backdrop {
    background: #041e1c;
}
.auth-dialog :deep(.ui-dialog-inner) {
    padding: 0;
    animation: none;
}
.auth-dialog :deep(.ui-dialog-header) {
    position: sticky;
    z-index: 1;
    top: 0;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    padding: 0.65rem var(--auth-pad);
    background: linear-gradient(110deg, #0b352feb, #062320f5);
    border-bottom: 1px solid #b5f7dd29;
}
.auth-dialog :deep(.ui-dialog-header h2) {
    margin: 0;
    font-size: 1.25rem;
}
.auth-dialog :deep(.ui-dialog-header .btn) {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border-radius: 0.7rem;
    border: 1px solid #a5ead847;
    background: #b2f8df0a;
    color: #e7fff8;
}
.auth-dialog :deep(.ui-dialog-header .btn:hover) {
    background: #b2f8df23;
}
.auth-dialog :deep(.auth-experience) {
    padding: var(--auth-pad);
}
.auth-dialog:has([data-auth-compact]) :deep(.ui-dialog-header) {
    padding-block: 0;
    background: #0b302b;
}
.auth-dialog:has([data-auth-compact]) :deep(.ui-dialog-header .btn:focus-visible) {
    outline-offset: -3px;
}
.auth-dialog:has([data-auth-short]) :deep(.ui-dialog-header) {
    display: none;
}
@media (min-width: 1000px) {
    .auth-dialog {
        margin-inline-end: clamp(1rem, 9vw, 10rem);
    }
}
@media (orientation: portrait) and (max-width: 760px) {
    .auth-dialog:not(:has([data-auth-compact]))::backdrop {
        background-image: linear-gradient(0deg, #031b17b0, #031d1a48), url("/images/emerald-lake-portrait.webp");
    }
}
@media (prefers-reduced-motion: no-preference) {
    .auth-dialog[open]::backdrop {
        animation: auth-backdrop-in 200ms ease-out;
    }
}
@keyframes auth-backdrop-in {
    from {
        opacity: 0;
    }
}
@media (orientation: landscape) and (max-height: 500px) and (min-width: 560px) {
    .auth-dialog {
        width: min(41rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    }
    .auth-dialog :deep(.ui-dialog-header) {
        padding-block: 0.25rem;
    }
}
</style>
