<template>
    <div class="atlas-menu-shell">
        <Header />
        <main id="main-content" class="page-shell page-narrow">
            <header class="guide-title">
                <p class="eyebrow">GeoBattles / Field manual</p>
                <h1>How to play</h1>
                <p class="about-lead">You're dropped on an unfamiliar road. Who can read the landscape and place the closest pin?</p>
            </header>
            <section aria-label="Match guide">
                <ol class="route-book">
                    <li>
                        <div>
                            <h2>Get on the grid</h2>
                            <p>Create a lobby or join with its four-letter code. Once everyone is ready, the host can start.</p>
                        </div>
                    </li>
                    <li>
                        <div>
                            <h2>Read the road</h2>
                            <p>Look for clues: road markings, scripts, vegetation or which side the traffic drives on. Open the map, place your pin and submit your guess.</p>
                        </div>
                    </li>
                    <li>
                        <div>
                            <h2>Check your line</h2>
                            <p>Compare guesses with the answer after each round. When powerups are available, choose how to play the next round.</p>
                        </div>
                    </li>
                </ol>
                <div class="btn-row mt-6">
                    <NuxtLink class="btn" to="/lobby/join">Join with code <UiIcon name="arrow" /></NuxtLink
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
.guide-title {
    padding-block: clamp(1.5rem, 7vw, 4rem) 1rem;
}
.guide-title h1 {
    font: italic 900 clamp(2.6rem, 8vw, 5rem) / 0.98 var(--gb-font-headline);
    letter-spacing: -0.055em;
}
.route-book {
    list-style: none;
    counter-reset: checkpoint;
    padding: 0;
    margin: 1.5rem 0;
}
.route-book li {
    counter-increment: checkpoint;
    display: grid;
    grid-template-columns: 3.4rem minmax(0, 1fr);
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid var(--gb-line);
}
.route-book li::before {
    content: counter(checkpoint, decimal-leading-zero);
    color: var(--gb-success);
    font: italic 900 2rem var(--gb-font-headline);
}
.route-book li p {
    margin: 0.35rem 0 0;
    color: var(--gb-muted);
    max-width: 55ch;
}
.about-lead {
    font-size: 1.15rem;
    line-height: 1.8;
    color: var(--gb-muted);
    margin-top: 1.6rem;
}
</style>
