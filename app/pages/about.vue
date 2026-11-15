<template>
    <div>
        <Header />
        <main id="main-content" class="page-shell page-narrow">
            <p class="eyebrow">An open invitation</p>
            <h1>The world is the game.</h1>
            <p class="about-lead">
                GeoBattles is an open-source multiplayer geography game. Explore a Street View location, pick up clues, and challenge your friends to find it on the map.
            </p>
            <section class="panel mt-8">
                <h2>Go somewhere together</h2>
                <p class="muted mt-4">
                    Create a lobby, share its invite, and choose the countries you want to explore. Everyone checks in as ready before the host starts. Each guess brings you a
                    little closer.
                </p>
                <p class="muted mt-4">
                    After the expedition, your personal journal keeps a debrief on this device. No global rankings, invented streaks, or pressure to come back.
                </p>
                <div class="btn-row mt-6">
                    <NuxtLink class="btn" to="/">Start exploring <UiIcon name="arrow" /></NuxtLink
                    ><a href="https://github.com/geobattles" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">View the source <UiIcon name="external" /></a>
                </div>
            </section>
            <Version class="mt-8" />
            <details class="panel mt-6">
                <summary class="diagnostics-summary">Game diagnostics</summary>
                <GameDiagnostics />
            </details>
        </main>
    </div>
</template>
<script setup lang="ts">
useHead({ title: "About" });
</script>
<style scoped>
.diagnostics-summary {
    min-height: 44px;
    cursor: pointer;
    font-weight: 700;
}
.about-lead {
    font-size: 1.15rem;
    line-height: 1.8;
    color: var(--gb-muted);
    margin-top: 1.6rem;
}
</style>
