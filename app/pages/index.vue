<template>
    <div class="landing">
        <Header />
        <main id="main-content" class="landing-main">
            <section class="welcome-card" aria-labelledby="welcome-title">
                <p class="welcome-label">Welcome to</p>
                <h1 id="welcome-title">GeoBattles</h1>
                <div class="play-card">
                    <NuxtLink class="btn btn-command join-button" to="/lobby/join">Join with code <UiIcon name="arrow" /></NuxtLink>
                    <button class="btn btn-secondary create-button" type="button" :disabled="creating" :aria-busy="creating" @click="create">
                        {{ creating ? "Creating lobby…" : "Create lobby" }}<span v-if="creating" class="spinner" />
                    </button>
                </div>
            </section>
        </main>
    </div>
</template>
<script setup lang="ts">
const auth = useAuthStore();
const { createLobby } = useLobbyStore();
const toast = useToast();
const creating = ref(false);
const awaitingAuth = ref(false);
let active = true;
const create = async () => {
    if (!active || creating.value) return;
    if (!auth.isAuthenticated) {
        awaitingAuth.value = true;
        auth.openLoginDialog("guest");
        return;
    }
    awaitingAuth.value = false;
    creating.value = true;
    try {
        await createLobby();
    } catch (cause) {
        if (active) toast.add({ severity: "error", summary: "Could not create a lobby", detail: cause instanceof Error ? cause.message : "Please try again." });
    } finally {
        if (active) creating.value = false;
    }
};
watch(
    () => auth.isAuthenticated,
    (signedIn) => {
        if (signedIn && awaitingAuth.value) void create();
    }
);
watch(
    () => auth.isLoginDialog,
    (open) => {
        if (!open && !auth.isAuthenticated) awaitingAuth.value = false;
    }
);
onBeforeUnmount(() => {
    active = false;
    awaitingAuth.value = false;
});
useHead({ title: "GeoBattles" });
</script>
<style scoped>
.landing {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background:
        linear-gradient(90deg, #181818ed, #18181880 65%, #18181855),
        url("/images/wallpaper.jpg") center / cover no-repeat;
}
.landing-main {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: clamp(1.5rem, 6vw, 5rem) 1rem;
}
.welcome-card {
    position: relative;
    width: min(100%, 36rem);
    padding: clamp(1.25rem, 4vw, 2.5rem);
    border: 1px solid #b6e38835;
    border-radius: var(--gb-radius);
    background: #181818ed;
    box-shadow: 0 24px 64px #0005;
}
/* Survey corners tie the title screen to the command-room frame. */
.welcome-card::before,
.welcome-card::after {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    pointer-events: none;
    border-color: var(--gb-accent);
    border-style: solid;
}
.welcome-card::before {
    top: -1px;
    left: -1px;
    border-width: 2px 0 0 2px;
}
.welcome-card::after {
    right: -1px;
    bottom: -1px;
    border-width: 0 2px 2px 0;
}
.welcome-label {
    margin-bottom: 0.7rem;
    color: var(--gb-muted);
    font: 600 0.75rem / 1.4 var(--gb-font-mono);
    letter-spacing: 0.2em;
    text-transform: uppercase;
}
h1 {
    font-size: clamp(2.35rem, 8vw, 4.5rem);
    font-weight: 800;
    letter-spacing: -0.065em;
    line-height: 1.05;
    color: var(--gb-accent);
    overflow-wrap: normal;
}
.play-card {
    display: grid;
    gap: 0.5rem;
    padding-top: clamp(1.25rem, 4vw, 2rem);
    margin-top: clamp(1.25rem, 4vw, 2rem);
    border-top: 1px solid var(--gb-line);
}
.join-button {
    width: 100%;
    min-height: 56px;
    justify-content: space-between;
    padding-inline: 1.25rem;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: normal;
}
.create-button {
    min-height: 44px;
}
@media (min-width: 1024px) {
    .landing-main {
        justify-content: flex-start;
        padding-inline: clamp(2rem, 8vw, 8rem);
    }
}
@media (max-width: 640px) {
    .landing {
        background:
            linear-gradient(#18181899, #181818cf),
            url("/images/wallpaper.jpg") center / cover no-repeat;
    }
}
@media (max-height: 480px) and (orientation: landscape) {
    .landing-main {
        padding-block: 0.75rem;
    }
    .welcome-card {
        padding: 0.75rem 1.25rem;
    }
    .welcome-label {
        margin-bottom: 0.3rem;
    }
    h1 {
        font-size: 2.5rem;
    }
    .play-card {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
    }
    .join-button {
        min-height: 52px;
    }
}
</style>
