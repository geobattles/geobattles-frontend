<template>
    <div class="scenic-page">
        <Header navigation />
        <main id="main-content" class="page-shell guide-page">
            <header class="guide-title scenic-page-hero">
                <h1>How to <em>play</em></h1>
                <p class="about-lead">You're dropped on an unfamiliar road. Who can read the landscape and place the closest pin?</p>
                <NuxtLink class="scenic-button scenic-button-primary" to="/lobby/join">Join with code <UiIcon name="arrow" /></NuxtLink>
            </header>
            <section aria-label="Match guide">
                <ol class="route-book" role="list">
                    <li>
                        <span class="guide-icon"><UiIcon name="users" /></span>
                        <div>
                            <h2>Get on the grid</h2>
                            <p>Create a lobby or join with its four-character code. Once everyone is ready, the host can start.</p>
                        </div>
                    </li>
                    <li>
                        <span class="guide-icon"><UiIcon name="compass" /></span>
                        <div>
                            <h2>Read the road</h2>
                            <p>Look for clues: road markings, scripts, vegetation or which side the traffic drives on. Open the map, place your pin and submit your guess.</p>
                        </div>
                    </li>
                    <li>
                        <span class="guide-icon"><UiIcon name="trophy" /></span>
                        <div>
                            <h2>Check your line</h2>
                            <p>Compare guesses with the answer after each round. When powerups are available, choose how to play the next round.</p>
                        </div>
                    </li>
                </ol>
            </section>
            <div class="guide-footer">
                <details class="guide-diagnostics">
                    <summary class="diagnostics-summary"><UiIcon name="settings" />Game diagnostics</summary>
                    <GameDiagnostics />
                </details>
                <div class="guide-meta">
                    <Version />
                    <a href="https://github.com/geobattles" target="_blank" rel="noopener noreferrer" class="scenic-button">View the source <UiIcon name="external" /></a>
                </div>
            </div>
        </main>
    </div>
</template>
<script setup lang="ts">
useHead({ title: "About" });
</script>
<style scoped>
.guide-page {
    display: grid;
    gap: clamp(0.9rem, 2.4vw, 1.45rem);
}
.guide-title {
    --scenic-hero-image: url("/images/emerald-lake.webp");
    display: grid;
    justify-items: start;
    align-content: center;
    gap: 0.85rem;
    min-block-size: clamp(14rem, 27vw, 20rem);
}
.about-lead {
    max-inline-size: 30rem;
    font-size: clamp(0.95rem, 2.2vw, 1.18rem);
}
.guide-title .scenic-button {
    margin-block-start: 0.3rem;
}
.route-book {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.6rem, 2vw, 1rem);
    padding: 0;
    margin: 0;
    list-style: none;
}
.route-book li {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
    min-inline-size: 0;
    padding: clamp(0.9rem, 2.4vw, 1.4rem);
    border: 1px solid #81c7a142;
    border-radius: 0.95rem;
    background: linear-gradient(145deg, #104035b3, #082a24);
}
.guide-icon {
    display: grid;
    place-items: center;
    inline-size: 2.4rem;
    block-size: 2.4rem;
    flex: none;
    border: 1px solid #c3fda941;
    border-radius: 0.8rem;
    background: #cbfb9d13;
    color: #dfff9c;
}
.route-book li h2 {
    color: #f1fcf5;
    font-size: clamp(1.04rem, 2.5vw, 1.32rem);
}
.route-book li p {
    margin-block-start: 0.35rem;
    color: #c4ddd1;
    font-size: 0.9rem;
    line-height: 1.55;
}
.guide-footer {
    display: grid;
    gap: 0.85rem;
}
.guide-diagnostics {
    padding: 0 0.9rem;
    border: 1px solid #7ac69d48;
    border-radius: 0.85rem;
    background: #082c24;
}
.guide-diagnostics[open] {
    padding-block-end: 0.85rem;
}
.diagnostics-summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-block-size: 44px;
    cursor: pointer;
    font-weight: 700;
}
.diagnostics-summary::after {
    content: "+";
    margin-inline-start: auto;
    color: #c5efaf;
}
.guide-diagnostics[open] > .diagnostics-summary::after {
    content: "−";
}
.guide-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.7rem;
}
@media (max-width: 590px) {
    .route-book {
        grid-template-columns: minmax(0, 1fr);
    }
    .route-book li {
        flex-direction: row;
    }
}
</style>
