<template>
    <header class="site-header" :class="{ 'has-navigation': navigation, 'account-only': accountOnly }">
        <div class="header-inner">
            <slot />
            <NuxtLink v-if="!accountOnly" to="/" class="brand" aria-label="GeoBattles home">
                <img src="/images/emerald-mark.svg" alt="" width="34" height="36" /><span>Geo<span class="brand-light">Battles</span></span>
            </NuxtLink>
            <button
                v-if="navigation"
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
            <nav v-if="navigation" id="main-nav" class="header-links" :class="{ 'is-open': navOpen }" aria-label="Main navigation">
                <NuxtLink to="/lobby/list" :aria-current="route.path.startsWith('/lobby') ? 'page' : undefined">Find a lobby</NuxtLink>
                <NuxtLink to="/journal" :aria-current="route.path === '/journal' ? 'page' : undefined">Expedition journal</NuxtLink>
                <NuxtLink to="/about" :aria-current="route.path === '/about' ? 'page' : undefined">About</NuxtLink>
            </nav>
            <div class="header-account">
                <span v-if="!accountMounted" class="account-placeholder"><UiIcon name="user" /></span>
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
                        <button class="btn btn-secondary sign-in" type="button" @click="auth.openLoginDialog()"><span class="sr-only">Sign in</span><UiIcon name="user" /></button>
                    </div>
                    <details v-else ref="accountMenu" class="account-menu">
                        <summary class="account-summary" :aria-label="`${player.displayName || 'Explorer'}, ${player.guest ? 'guest account' : 'account'} menu`">
                            <span class="avatar" aria-hidden="true"><UiIcon name="user" /></span>
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
const props = defineProps<{ navigation?: boolean; accountOnly?: boolean; installBlocked?: boolean }>();
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
    border-bottom: 1px solid #a7f3ce25;
    background:
        linear-gradient(110deg, #051e18df, #07322ab5),
        url("/images/atlas-relief.svg") 60% 43% / 58rem auto;
    backdrop-filter: blur(4px);
    --header-safe-top: var(--gb-safe-top);
}
/* Some installed Android browsers overlap the status bar without reporting an inset. */
:global(html[data-android-app] .site-header) {
    --header-safe-top: max(var(--gb-safe-top), calc(2rem - var(--gb-screen-top, 0px)));
}
.header-inner {
    padding: max(0.55rem, var(--header-safe-top)) max(clamp(1rem, 2.65vw, 2.75rem), var(--gb-safe-right)) 0.55rem max(clamp(1rem, 2.65vw, 2.75rem), var(--gb-safe-left));
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 3rem);
}
.account-only {
    position: absolute;
    inset: 0 0 auto;
    border: 0;
    background: transparent;
    backdrop-filter: none;
}
.account-only :is(.sign-in, .avatar, .account-placeholder, .guest-install) {
    border-color: #b9eab158;
    border-radius: 50%;
    background: #092b225c;
}
.brand {
    display: inline-flex;
    gap: 0.65rem;
    align-items: center;
    font: italic 900 clamp(1.15rem, 2.6vw, 1.5rem) / 1 var(--gb-font-display);
    letter-spacing: -0.055em;
    text-decoration: none;
    min-height: 44px;
    white-space: nowrap;
}
.brand img {
    width: auto;
    height: 2rem;
}
.brand-light {
    font-weight: 800;
    color: var(--emerald-lime, #ddffa2);
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
    color: #d8ebe1;
    white-space: nowrap;
}
.header-links > a:hover,
.header-links > a[aria-current] {
    color: var(--emerald-lime, #ddffa2);
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
    border-color: #a8eabd54;
    border-radius: 50%;
    background: #0b322a9c;
}
.account-menu {
    position: relative;
}
.account-summary {
    list-style: none;
    min-height: 44px;
    cursor: pointer;
    border-radius: 50%;
}
.account-summary::-webkit-details-marker {
    display: none;
}
.sign-in,
.avatar,
.account-placeholder {
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    padding: 0;
    border: 1px solid #99e89a;
    border-radius: 50%;
    color: var(--emerald-white, #f3fdf7);
    background: #052e2466;
}
.sign-in:hover,
.account-summary:hover .avatar {
    background: #174c35;
}
.site-header .ui-icon {
    width: 22px;
    height: 22px;
}
.account-popover {
    position: absolute;
    right: 0;
    top: calc(100% + 0.55rem);
    min-width: 220px;
    padding: 0.6rem;
    background: #0a2d25;
    border: 1px solid #8bcea983;
    border-radius: 0.85rem;
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
    border-radius: 0.55rem;
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
        gap: 0.75rem;
    }
    .has-navigation .header-inner {
        flex-wrap: wrap;
    }
    .mobile-toggle {
        display: inline-flex;
        order: 3;
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
}
@media (max-width: 380px) {
    .header-inner {
        gap: 0.375rem;
    }
    .brand {
        gap: 0.4rem;
    }
}
@media (orientation: landscape) and (max-height: 480px) {
    .header-inner {
        padding-top: max(0.2rem, var(--header-safe-top));
        padding-bottom: 0.2rem;
    }
    .brand img {
        height: 1.65rem;
    }
}
</style>
