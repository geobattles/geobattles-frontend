<template>
    <header ref="siteHeader" class="site-header" :class="{ 'has-navigation': navigation, 'account-only': accountOnly }">
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
                @click="toggleNav"
            >
                <UiIcon :name="navOpen ? 'close' : 'menu'" />
            </button>
            <nav v-if="navigation" id="main-nav" class="header-links" :class="{ 'is-open': navOpen }" aria-label="Main navigation">
                <NuxtLink to="/lobby/list" :aria-current="route.path.startsWith('/lobby') ? 'page' : undefined"
                    ><UiIcon name="compass" class="nav-link-icon" />Find a lobby</NuxtLink
                >
                <NuxtLink to="/journal" :aria-current="route.path === '/journal' ? 'page' : undefined"><UiIcon name="journal" class="nav-link-icon" />Expedition journal</NuxtLink>
                <NuxtLink to="/about" :aria-current="route.path === '/about' ? 'page' : undefined"><UiIcon name="info" class="nav-link-icon" />About</NuxtLink>
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
                    <details v-else ref="accountMenu" class="account-menu" @toggle="onAccountToggle">
                        <summary class="account-summary" :aria-label="`${player.displayName || 'Explorer'}, ${player.guest ? 'guest account' : 'account'} menu`">
                            <span class="avatar" aria-hidden="true"><UiIcon name="user" /></span>
                        </summary>
                        <div class="account-popover">
                            <div class="account-popover-head">
                                <strong class="account-popover-name">{{ player.displayName || "Explorer" }}</strong>
                                <span v-if="player.guest" class="account-guest-pill">Guest</span>
                            </div>
                            <NuxtLink to="/profile"><UiIcon name="user" />Profile</NuxtLink>
                            <NuxtLink to="/journal"><UiIcon name="journal" />Expedition journal</NuxtLink>
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
                            <div class="account-popover-divider" role="separator" />
                            <button v-if="!inLobby" class="account-signout" type="button" @click="logout"><UiIcon name="leave" />Sign out</button>
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
const siteHeader = ref<HTMLElement | null>(null);
const navToggle = ref<HTMLButtonElement | null>(null);
const accountMenu = ref<HTMLDetailsElement | null>(null);
const inLobby = computed(() => !!routeLobbyId(route));
const { available, canPrompt, pending: installPending, requestInstall } = usePwaInstall();
const showInstall = computed(() => available.value && !props.installBlocked);
const installMenuLabel = computed(() => (canPrompt.value ? "Install GeoBattles" : "How to install GeoBattles"));
function toggleNav() {
    navOpen.value = !navOpen.value;
    if (navOpen.value && accountMenu.value?.open) accountMenu.value.open = false;
}
function onAccountToggle() {
    if (accountMenu.value?.open) navOpen.value = false;
}
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
    const target = event.target as Node;
    if (accountMenu.value && !accountMenu.value.contains(target)) accountMenu.value.open = false;
    if (navOpen.value && siteHeader.value && !siteHeader.value.contains(target)) navOpen.value = false;
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
    display: flex;
    align-items: center;
    gap: clamp(0.85rem, 2.2vw, 1.75rem);
    margin-left: auto;
}
.header-links > a {
    position: relative;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-decoration: none;
    color: #d8ebe1;
    white-space: nowrap;
}
.nav-link-icon {
    display: none;
    width: 1rem;
    height: 1rem;
    color: #9de8bd;
    flex: none;
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
    border-radius: 999px;
    background: var(--gb-accent);
}
.header-account {
    position: relative;
    z-index: 35;
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
    z-index: 50;
    right: 0;
    top: calc(100% + 0.45rem);
    min-width: min(14.5rem, calc(100vw - 1.5rem));
    padding: 0.38rem;
    border: 1px solid #8ddbaf55;
    border-radius: 0.95rem;
    background: linear-gradient(155deg, #0b332af5, #05201bf8);
    box-shadow:
        0 14px 36px #00130fc4,
        inset 0 1px #e2ffd020;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: grid;
    gap: 0.14rem;
}
.account-popover-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.34rem 0.58rem 0.46rem;
    margin-bottom: 0.12rem;
    border-bottom: 1px solid #9be0a524;
}
.account-popover-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #f4fbf3;
    font-size: 0.8rem;
    font-weight: 800;
}
.account-guest-pill {
    flex: none;
    padding: 0.08rem 0.42rem;
    border: 1px solid #9be0a538;
    border-radius: 999px;
    background: #b6efa318;
    color: #cde8d5;
    font-size: 0.64rem;
    font-weight: 740;
    line-height: 1.3;
}
.account-popover > a,
.account-popover > button {
    display: flex;
    align-items: center;
    gap: 0.52rem;
    min-height: 36px;
    padding: 0.38rem 0.58rem;
    border: 0;
    background: transparent;
    color: #e8f8ec;
    text-align: left;
    border-radius: 0.58rem;
    text-decoration: none;
    font-size: 0.79rem;
    font-weight: 680;
    white-space: nowrap;
}
.account-popover > a .ui-icon,
.account-popover > button .ui-icon {
    width: 1rem;
    height: 1rem;
    color: #9de8bd;
    flex: none;
}
.account-popover > a:hover,
.account-popover > button:hover {
    background: #a4ecd31c;
    color: #ffffff;
}
.account-popover p {
    margin: 0;
    padding: 0.35rem 0.58rem;
    font-size: 0.72rem;
    line-height: 1.35;
}
.account-popover-divider {
    height: 1px;
    margin: 0.14rem 0.35rem;
    background: #9be0a524;
}
.account-popover > .account-install .ui-icon {
    color: #b8f695;
}
.account-popover > .account-signout {
    color: #ffd0ad;
}
.account-popover > .account-signout .ui-icon {
    color: #ffd0ad;
}
.account-popover > .account-signout:hover {
    background: #ff998924;
    color: #ffe3cc;
}
@media (max-width: 850px), (max-width: 1100px) and (max-height: 540px) and (orientation: landscape) {
    .header-inner {
        position: relative;
        gap: 0.6rem;
    }
    .mobile-toggle {
        display: inline-flex;
        order: 3;
    }
    .header-links {
        display: none;
        position: absolute;
        z-index: 45;
        top: calc(100% + 0.35rem);
        right: max(0.75rem, var(--gb-safe-right));
        min-width: min(13.5rem, calc(100vw - 1.5rem));
        margin-left: 0;
        padding: 0.38rem;
        border: 1px solid #8ddbaf55;
        border-radius: 0.95rem;
        background: linear-gradient(155deg, #0b332af5, #05201bf8);
        box-shadow:
            0 14px 36px #00130fc4,
            inset 0 1px #e2ffd020;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        gap: 0.14rem;
    }
    .header-links.is-open {
        display: grid;
    }
    .header-links > a {
        min-height: 36px;
        padding: 0.38rem 0.6rem;
        border: 1px solid transparent;
        border-radius: 0.58rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #e8f8ec;
    }
    .header-links > a:hover {
        background: #a4ecd31c;
        color: #ffffff;
    }
    .header-links > a[aria-current] {
        border-color: #b6efa340;
        background: #b6efa31e;
        color: #dcf7aa;
    }
    .header-links > a[aria-current]::after {
        display: none;
    }
    .nav-link-icon {
        display: inline-block;
    }
    .header-links > a[aria-current] .nav-link-icon {
        color: #c8f994;
    }
}
@media (max-width: 760px), (orientation: landscape) and (max-height: 540px) {
    .header-inner {
        padding: max(0.3rem, var(--header-safe-top)) max(0.75rem, var(--gb-safe-right)) 0.3rem max(0.75rem, var(--gb-safe-left));
        gap: 0.5rem;
    }
    .brand {
        min-height: 36px;
        gap: 0.42rem;
        font-size: 1.06rem;
    }
    .brand img {
        height: 1.62rem;
    }
    .account-summary {
        min-height: 36px;
    }
    .sign-in,
    .avatar,
    .account-placeholder,
    .mobile-toggle,
    .guest-install {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
    }
    .site-header .ui-icon {
        width: 18px;
        height: 18px;
    }
    .account-popover > a .ui-icon,
    .account-popover > button .ui-icon,
    .nav-link-icon {
        width: 1rem;
        height: 1rem;
    }
}
@media (max-width: 380px) {
    .header-inner {
        gap: 0.375rem;
    }
    .brand {
        gap: 0.38rem;
    }
}
@media (orientation: landscape) and (max-height: 480px) {
    .header-inner {
        padding-top: max(0.2rem, var(--header-safe-top));
        padding-bottom: 0.2rem;
    }
    .brand img {
        height: 1.5rem;
    }
}
</style>
