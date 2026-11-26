<template>
    <main id="main-content" ref="gameplayPageContainer" class="game-page">
        <Login />
        <LobbyLeaveConfirmation :prompt="leavePrompt" @decide="decideLeave" />
        <ClientOnly>
            <GameplaySession :container="gameplayPageContainer" @leaveLobby="leave" />
            <template #fallback>
                <div class="page-shell connection-entry">
                    <SocketConnectionPanel tone="joining" title="Rejoining game…" description="Waiting for the game server to confirm your place." :code="lobbyId">
                        <NuxtLink to="/" class="btn btn-secondary">Cancel</NuxtLink>
                    </SocketConnectionPanel>
                </div>
            </template>
        </ClientOnly>
    </main>
</template>
<script setup lang="ts">
definePageMeta({ key: (route) => `gameplay-${String(route.params.id)}` });
const { goHome: leave, leavePrompt, decideLeave } = useLobbyLeaveGuard();
const route = useRoute();
const lobbyId = computed(() => routeLobbyId(route));
const gameplayPageContainer = ref<HTMLElement | null>(null);
useHead({ title: "Expedition" });
</script>
<style scoped>
.game-page {
    min-height: var(--gb-viewport-height);
    width: 100%;
    background: var(--gb-bg);
    color: var(--gb-text);
}
.connection-entry {
    padding-block: clamp(1rem, 10vh, 6rem);
}
</style>
