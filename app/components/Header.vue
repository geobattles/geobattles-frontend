<template>
    <header class="site-header">
        <div class="header-inner">
            <NuxtLink to="/" class="brand" aria-label="GeoBattles home"
                ><UiIcon name="compass" /><span>Geo<span class="brand-light">Battles</span><span class="brand-point">.</span></span></NuxtLink
            >
            <button
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
            <nav id="main-nav" class="header-links" :class="{ 'is-open': navOpen }" aria-label="Main navigation">
                <NuxtLink to="/lobby/list" :aria-current="route.path.startsWith('/lobby') ? 'page' : undefined">Find a lobby</NuxtLink>
                <NuxtLink to="/journal" :aria-current="route.path === '/journal' ? 'page' : undefined">Expedition journal</NuxtLink>
                <NuxtLink to="/about" :aria-current="route.path === '/about' ? 'page' : undefined">About</NuxtLink>
            </nav>
            <div class="header-account">
                <span v-if="!accountMounted" class="badge account-placeholder">Your account</span>
                <template v-else>
                    <button v-if="!auth.isAuthenticated" class="btn btn-secondary" type="button" @click="auth.isLoginDialog = true">Sign in <UiIcon name="arrow" /></button>
                    <details v-else ref="accountMenu" class="account-menu">
                        <summary class="account-summary">
                            <span class="avatar">{{ (player.displayName || "E").slice(0, 1).toUpperCase() }}</span
                            ><span class="account-name"
                                >{{ player.displayName || "Explorer" }}<small>{{ player.guest ? "Guest explorer" : "Your account" }}</small></span
                            >
                        </summary>
                        <div class="account-popover">
                            <NuxtLink to="/profile">Profile</NuxtLink><NuxtLink to="/journal">Expedition journal</NuxtLink
                            ><button v-if="!inLobby" type="button" @click="logout">Sign out</button>
                            <p v-else class="field-help">Leave the lobby before signing out.</p>
                        </div>
                    </details>
                </template>
            </div>
        </div>
        <UiDialog v-model:open="auth.isLoginDialog" title="Your next expedition" eyebrow="Welcome, explorer" wide>
            <Login @userLogged="auth.isLoginDialog = false" />
        </UiDialog>
    </header>
</template>
<script setup lang="ts">
const auth = useAuthStore();
const player = usePlayerInfo();
const route = useRoute();
const navOpen = ref(false);
const accountMounted = ref(false);
const navToggle = ref<HTMLButtonElement | null>(null);
const accountMenu = ref<HTMLDetailsElement | null>(null);
const inLobby = computed(() => !!routeLobbyId(route));
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
    box-shadow: 0 1px 0 #0008;
}
.header-inner {
    min-height: var(--gb-header-height);
    max-width: 1440px;
    margin: auto;
    padding: 0.5rem clamp(0.875rem, 3vw, 2.5rem);
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 3rem);
}
.brand {
    display: inline-flex;
    gap: 0.65rem;
    align-items: center;
    font-size: 1.35rem;
    font-weight: 800;
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
.brand-point {
    color: var(--gb-accent);
}
.header-links {
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
    width: 24px;
    height: 2px;
    background: var(--gb-accent);
}
.header-account {
    margin-left: auto;
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
@media (max-width: 850px) {
    .header-inner {
        min-height: var(--gb-header-height);
        padding-block: 0.25rem;
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
        display: none;
    }
}
@media (max-width: 380px) {
    .header-inner {
        padding-inline: 0.5rem;
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
</style>
