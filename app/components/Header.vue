<template>
    <header class="site-header" :class="{ 'scenic-header': scenic, 'scenic-navigation': scenic && navigation }">
        <div class="header-inner">
            <NuxtLink to="/" class="brand" aria-label="GeoBattles home"
                ><img v-if="scenic" src="/images/emerald-mark.svg" alt="" width="34" height="36" /><svg v-else viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <path fill="currentColor" d="m18 1 16 29-16-7L2 30z" />
                    <path fill="var(--gb-bg)" d="m18 10 8 15-8-5z" />
                    <path stroke="var(--gb-success)" stroke-width="2" d="m5 33 13-6 13 6" /></svg
                ><span>Geo<span class="brand-light">Battles</span></span></NuxtLink
            >
            <button
                v-if="!scenic || navigation"
                ref="navToggle"
                class="btn btn-icon btn-quiet mobile-toggle"
                type="button"
                :aria-expanded="navOpen"
                aria-controls="main-nav"
                aria-label="Toggle navigation"
                @click="navOpen = !navOpen"
            >
                <UiIcon :name="navOpen ? 'close' : 'menu'" />
            </button>
            <nav v-if="!scenic || navigation" id="main-nav" class="header-links" :class="{ 'is-open': navOpen }" aria-label="Main navigation">
                <NuxtLink to="/lobby/list" :aria-current="route.path.startsWith('/lobby') ? 'page' : undefined">Find a lobby</NuxtLink>
                <NuxtLink to="/journal" :aria-current="route.path === '/journal' ? 'page' : undefined">Expedition journal</NuxtLink>
                <NuxtLink to="/about" :aria-current="route.path === '/about' ? 'page' : undefined">About</NuxtLink>
            </nav>
            <div class="header-account">
                <span v-if="!accountMounted" class="badge account-placeholder">
                    <UiIcon v-if="scenic" name="user" />
                    <template v-else>Your account</template>
                </span>
                <template v-else>
                    <div v-if="!auth.isAuthenticated" class="guest-account">
                        <button
                            v-if="showInstall"
                            class="btn btn-icon guest-install"
                            type="button"
                            :aria-label="installMenuLabel"
                            :aria-haspopup="canPrompt ? undefined : 'dialog'"
                            :title="installMenuLabel"
                            :disabled="installPending"
                            @click="installFromMenu"
                        >
                            <UiIcon name="install" />
                        </button>
                        <button class="btn btn-secondary sign-in" type="button" @click="auth.openLoginDialog()">
                            <span :class="{ 'sr-only': scenic }">Sign in</span><UiIcon :name="scenic ? 'user' : 'arrow'" />
                        </button>
                    </div>
                    <details v-else ref="accountMenu" class="account-menu">
                        <summary class="account-summary">
                            <span class="avatar" aria-hidden="true"
                                ><UiIcon v-if="scenic" name="user" /><template v-else>{{ (player.displayName || "E").slice(0, 1).toUpperCase() }}</template></span
                            ><span class="account-name"
                                >{{ player.displayName || "Explorer" }}<small>{{ player.guest ? "Guest explorer" : "Your account" }}</small></span
                            >
                        </summary>
                        <div class="account-popover">
                            <NuxtLink to="/profile">Profile</NuxtLink>
                            <NuxtLink to="/journal">Expedition journal</NuxtLink>
                            <button
                                v-if="showInstall"
                                class="account-install"
                                type="button"
                                :disabled="installPending"
                                :aria-haspopup="canPrompt ? undefined : 'dialog'"
                                @click="installFromMenu"
                            >
                                <UiIcon name="install" />{{ installMenuLabel }}
                            </button>
                            <button v-if="!inLobby" type="button" @click="logout">Sign out</button>
                            <p v-else class="field-help">Leave the lobby before signing out.</p>
                        </div>
                    </details>
                </template>
            </div>
        </div>
        <Login />
    </header>
</template>
<script setup lang="ts">
const props = defineProps<{ scenic?: boolean; navigation?: boolean; installBlocked?: boolean }>();
const auth = useAuthStore();
const player = usePlayerInfo();
const route = useRoute();
const navOpen = ref(false);
const accountMounted = ref(false);
const navToggle = ref<HTMLButtonElement | null>(null);
const accountMenu = ref<HTMLDetailsElement | null>(null);
const inLobby = computed(() => !!routeLobbyId(route));
const { available, canPrompt, pending: installPending, requestInstall } = usePwaInstall();
const showInstall = computed(() => available.value && !props.installBlocked);
const installMenuLabel = computed(() => (canPrompt.value ? "Install GeoBattles" : "How to install GeoBattles"));
function installFromMenu() {
    if (accountMenu.value?.open) {
        accountMenu.value.open = false;
        accountMenu.value.querySelector("summary")?.focus({ preventScroll: true });
    }
    void requestInstall(() => !props.installBlocked);
}
watch(
    () => route.path,
    () => {
        navOpen.value = false;
        auth.isLoginDialog = false;
        if (accountMenu.value) accountMenu.value.open = false;
    }
);
const logout = async () => {
    if (accountMenu.value) accountMenu.value.open = false;
    await auth.logout();
};
const closeMenu = (event: MouseEvent) => {
    if (accountMenu.value && !accountMenu.value.contains(event.target as Node)) accountMenu.value.open = false;
};
const escape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        if (navOpen.value) navToggle.value?.focus();
        navOpen.value = false;
        if (accountMenu.value?.open) {
            accountMenu.value.open = false;
            accountMenu.value.querySelector("summary")?.focus();
        }
    }
};
onMounted(() => {
    accountMounted.value = true;
    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", escape);
});
onBeforeUnmount(() => {
    document.removeEventListener("click", closeMenu);
    document.removeEventListener("keydown", escape);
});
</script>
<style scoped>
.site-header {
    position: relative;
    z-index: 20;
    border-bottom: 1px solid var(--gb-line);
    background: var(--gb-bg);
    border-top: 2px solid var(--gb-accent);
}
.header-inner {
    min-height: var(--gb-header-height);
    max-width: 1440px;
    margin: auto;
    padding: max(0.5rem, var(--gb-safe-top)) max(clamp(0.875rem, 3vw, 2.5rem), var(--gb-safe-right)) 0.5rem max(clamp(0.875rem, 3vw, 2.5rem), var(--gb-safe-left));
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 3rem);
}
.brand {
    display: inline-flex;
    gap: 0.65rem;
    align-items: center;
    font-size: 1.35rem;
    font: italic 900 1.35rem var(--gb-font-headline);
    letter-spacing: -0.05em;
    text-decoration: none;
    min-height: 44px;
    white-space: nowrap;
}
.brand > svg {
    color: var(--gb-accent);
    width: 30px;
    height: 30px;
    stroke-width: 1.5;
}
.brand-light {
    font-weight: 800;
    color: var(--gb-accent);
}

.header-links {
    font-family: var(--gb-font-mono);
    display: flex;
    align-items: center;
    gap: clamp(1rem, 2.5vw, 2rem);
    margin-left: auto;
}
.header-links > a {
    position: relative;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.025em;
    text-decoration: none;
    color: var(--gb-muted);
    white-space: nowrap;
}
.header-links > a:hover,
.header-links > a[aria-current] {
    color: var(--gb-accent);
}
.header-links > a[aria-current]::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--gb-accent);
}
.header-account {
    margin-left: auto;
}
.guest-account {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}
.guest-install {
    border-color: #a8eabd47;
    border-radius: 0.65rem;
    background: #0b322aaf;
    color: #d2f7b8;
}
.guest-install:enabled:hover {
    border-color: #b8eea5a6;
    background: #174638;
}
.mobile-toggle {
    display: none;
}
.account-menu {
    position: relative;
}
.account-summary {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    list-style: none;
    min-height: 44px;
    cursor: pointer;
    border-radius: var(--gb-radius);
}
.account-summary::-webkit-details-marker {
    display: none;
}
.avatar {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
    color: var(--gb-accent);
    font: 700 1rem var(--gb-font-mono);
    background: var(--gb-surface);
}
.account-name {
    font-size: 0.85rem;
    max-width: 155px;
    overflow-wrap: anywhere;
}
.account-name small {
    display: block;
    color: var(--gb-muted);
    font-size: 0.65rem;
}
.account-popover {
    position: absolute;
    right: 0;
    top: calc(100% + 14px);
    min-width: 220px;
    padding: 0.6rem;
    background: var(--gb-surface);
    border: 1px solid var(--gb-line);
    border-radius: var(--gb-radius);
    box-shadow: 0 12px 40px #0008;
    display: grid;
}
.account-popover > a,
.account-popover > button {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 0.65rem;
    border: 0;
    background: transparent;
    text-align: left;
    border-radius: 3px;
    text-decoration: none;
    font-size: 0.85rem;
}
.account-popover > a:hover,
.account-popover > button:hover {
    background: var(--gb-raised);
}
.account-popover p {
    padding: 0.6rem;
}
.account-install {
    gap: 0.48rem;
}
.account-install .ui-icon {
    color: var(--gb-accent);
}
@media (max-width: 850px), (max-width: 1100px) and (max-height: 540px) and (orientation: landscape) {
    .header-inner {
        min-height: var(--gb-header-height);
        padding-block: max(0.25rem, var(--gb-safe-top)) 0.25rem;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
    .mobile-toggle {
        display: inline-flex;
        margin-left: auto;
        order: 3;
    }
    .header-account {
        margin-left: auto;
    }
    .header-links {
        display: none;
        order: 4;
        flex-basis: 100%;
        padding-top: 0.5rem;
        border-top: 1px solid var(--gb-line);
    }
    .header-links.is-open {
        display: flex;
        flex-wrap: wrap;
    }
    .account-name {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
}
@media (max-width: 380px) {
    .header-inner {
        padding-inline: max(0.5rem, var(--gb-safe-left)) max(0.5rem, var(--gb-safe-right));
        gap: 0.375rem;
    }
    .brand {
        font-size: 1.15rem;
        gap: 0.4rem;
    }
    .brand > svg {
        width: 26px;
    }
    .header-account > .btn {
        padding-inline: 0.65rem;
        font-size: 0.8rem;
    }
}
.scenic-header {
    border-top: 0;
    border-bottom: 1px solid #a7f3ce1c;
    background: #031b178f;
    backdrop-filter: blur(5px);
}
.scenic-header .header-inner {
    min-height: 0;
    max-width: none;
    padding: max(0.55rem, var(--gb-safe-top)) max(clamp(1rem, 2.65vw, 2.75rem), var(--gb-safe-right)) 0.55rem max(clamp(1rem, 2.65vw, 2.75rem), var(--gb-safe-left));
    flex-wrap: nowrap;
}
.scenic-header .brand {
    font: italic 900 clamp(1.15rem, 2.6vw, 1.5rem) / 1 var(--gb-font-display);
    letter-spacing: -0.055em;
}
.scenic-header .brand img {
    width: auto;
    height: 2rem;
}
.scenic-header .brand-light {
    color: var(--emerald-lime);
}
.scenic-header .sign-in,
.scenic-header .avatar,
.scenic-header .account-placeholder {
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    padding: 0;
    border: 1px solid #99e89a;
    border-radius: 50%;
    color: var(--emerald-white);
    background: #052e2466;
}
.scenic-header .sign-in:hover,
.scenic-header .account-summary:hover .avatar {
    background: #174c35;
}
.scenic-header .ui-icon {
    width: 22px;
    height: 22px;
}
.scenic-header .account-summary {
    border-radius: 50%;
}
.scenic-header .account-name {
    @apply sr-only;
}
.scenic-header .account-popover {
    top: calc(100% + 0.55rem);
}
.scenic-navigation .header-links > a {
    color: #d8ebe1;
}
.scenic-navigation .header-links > a:hover,
.scenic-navigation .header-links > a[aria-current] {
    color: var(--emerald-lime);
}
@media (max-width: 850px), (max-width: 1100px) and (max-height: 540px) and (orientation: landscape) {
    .scenic-navigation .header-inner {
        flex-wrap: wrap;
    }
    .scenic-navigation .mobile-toggle {
        margin-left: 0;
    }
}
@media (orientation: landscape) and (max-height: 480px) {
    .scenic-header .header-inner {
        padding-top: max(0.2rem, var(--gb-safe-top));
        padding-bottom: 0.2rem;
    }
    .scenic-header .brand img {
        height: 1.65rem;
    }
}
</style>
