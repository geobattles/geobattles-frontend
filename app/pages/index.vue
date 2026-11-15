<template>
    <div class="landing">
        <Header />
        <main id="main-content" class="landing-main">
            <section class="welcome-card" aria-labelledby="welcome-title">
                <p class="welcome-label">Welcome to</p>
                <h1 id="welcome-title">GeoBattles</h1>
                <div class="play-card">
                    <button class="btn btn-command play-button" type="button" :disabled="creating" :aria-busy="creating" @click="play">
                        <span>{{ creating ? "Creating lobby…" : "PLAY NOW" }}</span
                        ><span v-if="creating" class="spinner" /><UiIcon v-else name="arrow" />
                    </button>
                    <p class="join-prompt">or join a lobby by <NuxtLink to="/lobby/join">game code!</NuxtLink></p>
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
const awaitingSignIn = ref(false);
let active = true;
const play = async () => {
    if (!active || creating.value) return;
    if (!auth.isAuthenticated) {
        awaitingSignIn.value = true;
        auth.isLoginDialog = true;
        return;
    }
    awaitingSignIn.value = false;
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
        if (signedIn && awaitingSignIn.value) void play();
    }
);
watch(
    () => auth.isLoginDialog,
    (open) => {
        if (!open && !auth.isAuthenticated) awaitingSignIn.value = false;
    }
);
onBeforeUnmount(() => {
    active = false;
    awaitingSignIn.value = false;
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
.play-button {
    width: 100%;
    min-height: 56px;
    justify-content: space-between;
    padding-inline: 1.25rem;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.16em;
}
.join-prompt {
    color: var(--gb-muted);
    font-size: clamp(0.75rem, 3vw, 0.85rem);
}
.join-prompt a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--gb-accent);
    text-decoration: underline;
    text-underline-offset: 4px;
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
        gap: 0;
    }
    .play-button {
        min-height: 52px;
    }
}
</style>
