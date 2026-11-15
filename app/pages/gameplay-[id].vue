<template>
    <main id="main-content" ref="gameplayPageContainer" class="game-page">
        <ClientOnly>
            <GameplaySession :container="gameplayPageContainer" @leaveLobby="leave" />
            <template #fallback
                ><div class="page-shell page-narrow">
                    <p class="eyebrow">Your expedition</p>
                    <h1>Finding your way back.</h1>
                    <p class="muted mt-5">
                        GeoBattles is restoring your lobby, round, and guesses from the game server. The interactive landscape will appear here once your connection is ready.
                    </p>
                    <NuxtLink class="text-link mt-6" to="/">Return to the world <UiIcon name="arrow" /></NuxtLink></div
            ></template>
        </ClientOnly>
    </main>
</template>
<script setup lang="ts">
definePageMeta({ key: (route) => `gameplay-${String(route.params.id)}` });
const { goHome: leave } = useLobbyLeaveGuard();
const gameplayPageContainer = ref<HTMLElement | null>(null);
useHead({ title: "Expedition" });
</script>
<style scoped>
.game-page {
    min-height: 100dvh;
    width: 100%;
    background: var(--gb-bg);
    color: var(--gb-text);
}
</style>
