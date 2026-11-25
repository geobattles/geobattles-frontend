<template>
    <div class="scenic-page">
        <Header navigation />
        <main id="main-content" class="page-shell journal-main">
            <header class="journal-heading scenic-page-hero">
                <div>
                    <h1>Expedition <em>Journal</em></h1>
                    <p class="journal-intro">A closer look at the places you guessed — and the answers you found.</p>
                </div>
                <NuxtLink to="/" class="scenic-button"><UiIcon name="home" />Back to the world</NuxtLink>
            </header>
            <section class="storage-notice" aria-label="Journal storage and privacy">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.5" />
                    <path d="M8 21h8m-4-4v4" stroke="currentColor" stroke-width="1.5" />
                </svg>
                <p>
                    <strong>On this device, for this identity.</strong> Up to {{ matchLimit }} completed matches, within a 2 MiB limit. Not synced to an account or uploaded. Other
                    people using this browser may access its local data.{{ player.guest ? " A new guest identity starts a separate journal." : "" }}
                </p>
                <button v-if="identityId && (matches.length || storageStatus === 'invalid')" type="button" class="clear-button" @click="openClear">Clear local journal</button>
            </section>
            <p v-if="storageMessage" class="storage-warning" role="status">{{ storageMessage }}</p>
            <p v-if="clearNote" class="clear-note" role="status">{{ clearNote }}</p>
            <template v-if="matches.length">
                <section class="personal-bests" aria-labelledby="personal-bests-title">
                    <div class="bests-label">
                        <h2 id="personal-bests-title">Personal bests</h2>
                        <p>Within your saved matches</p>
                    </div>
                    <button v-if="personalBests.highestScore" type="button" @click="chooseMatch(personalBests.highestScore.gameId)">
                        <span>Best match score</span><strong>{{ journalNumber(personalBests.highestScore.score) }} <small>pts</small></strong
                        ><span>Open match <span aria-hidden="true">↗</span></span>
                    </button>
                    <button v-if="personalBests.closestGuess" type="button" @click="chooseMatch(personalBests.closestGuess.gameId, personalBests.closestGuess.round)">
                        <span>Closest guess</span><strong>{{ journalDistance(personalBests.closestGuess.distanceMeters) }}</strong
                        ><span>Round {{ personalBests.closestGuess.round }} <span aria-hidden="true">↗</span></span>
                    </button>
                    <div v-else class="best-no-guess"><span>Closest guess</span><strong>Not yet</strong><span>No submitted guesses saved</span></div>
                    <button v-if="personalBests.highestRound" type="button" @click="chooseMatch(personalBests.highestRound.gameId, personalBests.highestRound.round)">
                        <span>Best round score</span><strong>{{ journalNumber(personalBests.highestRound.score) }} <small>pts</small></strong
                        ><span>Round {{ personalBests.highestRound.round }} <span aria-hidden="true">↗</span></span>
                    </button>
                </section>
                <div class="journal-workspace">
                    <aside class="match-sidebar" aria-labelledby="matches-title">
                        <div class="list-heading">
                            <h2 id="matches-title">Completed expeditions</h2>
                            <span>{{ matches.length }} / {{ matchLimit }}</span>
                        </div>
                        <MatchList :matches="matches" :selected-id="selectedMatch?.gameId ?? null" @select="chooseMatch($event)" />
                        <p class="retention-note">
                            Newest first. Older entries roll off as the device limit is reached. Scores and distances come from completed Battle Royale results.
                        </p>
                    </aside>
                    <MatchDebrief
                        v-if="selectedMatch"
                        :key="`${identityId}:${selectedMatch.gameId}`"
                        :match="selectedMatch"
                        :initial-round="initialRound"
                        :navigation-revision="navigationRevision"
                    />
                </div>
            </template>
            <section v-else class="journal-empty" aria-labelledby="empty-title">
                <div class="empty-orbit" aria-hidden="true">
                    <svg viewBox="0 0 320 250" fill="none">
                        <ellipse cx="160" cy="125" rx="104" ry="104" stroke="var(--gb-line)" />
                        <ellipse cx="160" cy="125" rx="54" ry="104" stroke="var(--gb-line)" />
                        <path d="M56 125h208M68 78h184M68 172h184M160 21v208" stroke="var(--gb-line)" />
                        <path d="M106 144C116 75 181 45 221 100" stroke="var(--gb-accent)" stroke-width="2" stroke-dasharray="5 5" />
                        <circle cx="106" cy="144" r="7" fill="var(--gb-coral)" />
                        <circle cx="221" cy="100" r="7" fill="var(--gb-accent)" />
                        <circle cx="221" cy="100" r="15" stroke="var(--gb-accent)" stroke-opacity=".5" />
                        <path d="M37 125h12m222 0h12M160 2v12m0 222v12" stroke="var(--gb-muted)" />
                    </svg>
                </div>
                <div class="empty-copy">
                    <h2 id="empty-title">No matches recorded yet.</h2>
                    <p v-if="mounted && identityId">
                        Finish a Battle Royale game to save the rounds, your guesses, the revealed answers and your scores here. Only complete results are recorded — no sample
                        matches, no invented progress.
                    </p>
                    <p v-else>
                        Sign in or choose a guest identity, then finish a Battle Royale game. Your completed rounds and personal bests will stay here on this device, separate from
                        other identities.
                    </p>
                    <NuxtLink to="/" class="scenic-button scenic-button-primary">
                        {{ mounted && identityId ? "Find your next game" : "Choose how to play" }}<UiIcon name="arrow" />
                    </NuxtLink>
                </div>
            </section>
        </main>
        <UiDialog
            class="clear-dialog"
            :open="clearTarget !== null"
            title="Clear this journal?"
            description="This permanently removes this identity's saved matches and personal bests from this browser. Other identities are not affected. It cannot be undone."
            @update:open="clearTarget = null"
        >
            <form class="dialog-actions" @submit.prevent="confirmClear">
                <button type="button" class="scenic-button" autofocus @click="clearTarget = null">Keep my journal</button>
                <button type="submit" class="scenic-button scenic-button-danger">Clear local journal</button>
            </form>
        </UiDialog>
    </div>
</template>

<script setup lang="ts">
import { useMatchJournal } from "~/composables/matchJournal";
import MatchList from "~/components/journal/MatchList.vue";
import MatchDebrief from "~/components/journal/MatchDebrief.vue";
import { journalDistance, journalNumber } from "~/components/journal/format";

useHead({
    title: "Expedition Journal",
    meta: [{ name: "description", content: "Review your completed GeoBattles expeditions, guesses and personal bests. Saved only on this device." }],
});
const player = usePlayerInfo();
const { matches, identityId, storageStatus, storageMessage, personalBests, matchLimit, load, clear } = useMatchJournal();
const selectedId = ref<string | null>(null);
const initialRound = ref(1);
const navigationRevision = ref(0);
const chooseMatch = (gameId: string, round = 1) => {
    selectedId.value = gameId;
    initialRound.value = round;
    navigationRevision.value++;
};
const selectedMatch = computed(() => matches.value.find((match) => match.gameId === selectedId.value) ?? matches.value[0] ?? null);
const clearTarget = ref<string | null>(null);
const clearNote = ref<string | null>(null);
// Stabilize only the public empty-state copy, not the immediate private identity gates.
const mounted = ref(false);
const openClear = () => {
    clearTarget.value = identityId.value;
};
const confirmClear = () => {
    if (identityId.value && clearTarget.value === identityId.value) {
        clearNote.value = clear()
            ? "This identity's local journal has been cleared."
            : "This session's journal was cleared, but browser storage is blocked. Previously saved device data could not be confirmed removed; use your browser's site-data controls if needed.";
        selectedId.value = null;
    }
    clearTarget.value = null;
};
const storageChanged = (event: StorageEvent) => {
    if (event.key === null || event.key === `geobattles:journal:v1:${encodeURIComponent(identityId.value ?? "")}`) load();
};
watch(
    identityId,
    () => {
        selectedId.value = null;
        clearNote.value = null;
        clearTarget.value = null;
        if (mounted.value) load();
    },
    { flush: "sync" }
);
onMounted(() => {
    mounted.value = true;
    load();
    window.addEventListener("storage", storageChanged);
});
onBeforeUnmount(() => {
    mounted.value = false;
    window.removeEventListener("storage", storageChanged);
});
</script>

<style scoped>
.journal-main {
    max-width: 1280px;
}
.journal-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    margin-block-end: 1rem;
}
.journal-heading .scenic-button {
    flex: none;
}
.journal-intro {
    font-size: 0.95rem;
    margin-block-start: 0.65rem;
    max-width: 34rem;
}
.storage-notice {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    border: 1px solid #87cba445;
    border-radius: 0.85rem;
    background: #0a3129;
    padding: 0.75rem clamp(0.8rem, 2vw, 1.15rem);
}
.storage-notice > svg {
    width: 23px;
    height: 23px;
    flex-shrink: 0;
    color: var(--gb-success);
}
.storage-notice p {
    color: var(--gb-muted);
    line-height: 1.7;
    font-size: 0.8rem;
    max-width: 62rem;
    margin: 0;
}
.storage-notice strong {
    color: var(--gb-text);
    font-weight: 500;
}
.clear-button {
    flex-shrink: 0;
    margin-left: auto;
    padding: 0.6rem;
    border: 0;
    background: transparent;
    color: var(--gb-coral);
    font-size: 0.8rem;
    text-decoration: underline;
    text-underline-offset: 4px;
    min-height: 44px;
}
.storage-warning,
.clear-note {
    border: 1px solid color-mix(in srgb, var(--gb-coral) 45%, var(--gb-line));
    padding: 1rem;
    border-radius: 10px;
    background: var(--gb-surface);
    color: var(--gb-coral);
    font-size: 0.8rem;
    line-height: 1.6;
    margin: 1rem 0;
}
.clear-note {
    border-color: var(--gb-line);
    background: var(--gb-raised);
    color: var(--gb-accent);
}
.personal-bests {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    align-items: center;
    padding: 1rem 0;
}
.bests-label h2 {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0;
}
.bests-label p {
    color: var(--gb-muted);
    font-size: 0.67rem;
    margin: 0.35rem 0 0;
}
.personal-bests button,
.best-no-guess {
    padding: 0.65rem 0.75rem;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 0.45rem;
    border: 1px solid #87cba442;
    border-radius: 0.85rem;
    background: linear-gradient(145deg, #103c33, #092921);
    color: var(--gb-text);
    text-align: left;
    min-height: 95px;
}
.personal-bests button:hover strong {
    color: var(--gb-accent);
}
.personal-bests span {
    color: var(--gb-muted);
    font-size: 0.7rem;
}
.personal-bests strong {
    font-size: clamp(1.25rem, 2.5vw, 1.9rem);
    font-weight: 800;
    color: #e2ffa6;
    overflow-wrap: anywhere;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
}
.personal-bests strong small {
    font-weight: 400;
    font-size: 0.7rem;
    color: var(--gb-muted);
    letter-spacing: 0;
}
.personal-bests button > span:last-child {
    font-size: 0.65rem;
}
.journal-workspace {
    display: grid;
    grid-template-columns: minmax(220px, 290px) minmax(0, 1fr);
    gap: 1.75rem;
    align-items: start;
    margin-top: 0.45rem;
}
.list-heading {
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}
.list-heading h2 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 500;
}
.list-heading span {
    font-size: 0.7rem;
    color: var(--gb-muted);
    font-variant-numeric: tabular-nums;
}
.retention-note {
    color: var(--gb-muted);
    line-height: 1.7;
    font-size: 0.68rem;
    padding: 0.5rem 0.25rem;
}
.journal-empty {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    align-items: center;
    gap: clamp(1rem, 3.5vw, 3rem);
    padding: clamp(1rem, 4vw, 3.25rem);
    margin-block-start: 1rem;
    border: 1px solid #87cba445;
    border-radius: 1.1rem;
    background:
        linear-gradient(120deg, #0c382ce0, #082721e8),
        url("/images/atlas-relief.svg") 40% 40% / cover #082a23;
}
.empty-orbit {
    max-width: 330px;
    width: 100%;
    justify-self: center;
    text-align: center;
}
.empty-orbit svg {
    width: 100%;
    height: auto;
}
.empty-copy h2 {
    font-size: clamp(1.65rem, 3vw, 2.5rem);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.035em;
    margin: 0 0 0.6rem;
}
.empty-copy > p {
    color: var(--gb-muted);
    line-height: 1.6;
    font-size: 0.9rem;
    max-width: 28rem;
}
.empty-copy .scenic-button {
    margin-block-start: 1rem;
}
.clear-dialog[open] {
    width: min(30rem, calc(100% - var(--dialog-left) - var(--dialog-right)));
    border-color: #77bf9a8a;
    border-radius: 1.15rem;
    background: linear-gradient(140deg, #0d382e, #06251f);
    box-shadow: 0 1.5rem 4rem #051a11a8;
}
.clear-dialog::backdrop {
    background: #021714b8;
}
.clear-dialog :deep(.ui-dialog-header button) {
    border-radius: 50%;
}
.clear-dialog :deep(.ui-dialog-header h2) {
    font: italic 900 1.65rem / 1.07 var(--gb-font-display);
}
.dialog-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.7rem;
}
@media (min-width: 960px) {
    .match-sidebar {
        position: sticky;
        top: 1rem;
        max-height: calc(100dvh - 2rem);
        overflow-y: auto;
        padding: 0 0.4rem 0.5rem 0;
    }
}
@media (max-width: 800px) {
    .journal-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.75rem;
    }
    .storage-notice {
        flex-wrap: wrap;
    }
    .storage-notice p {
        flex: 1 1 175px;
        min-width: 0;
    }
    .clear-button {
        margin-left: 2rem;
        padding-left: 0;
    }
    .personal-bests {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
    }
    .bests-label {
        grid-column: 1 / -1;
        margin-bottom: 0.75rem;
    }
    .personal-bests button,
    .best-no-guess {
        padding-inline: 0.48rem;
    }
    .journal-workspace {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    .match-sidebar {
        min-width: 0;
    }
    .match-sidebar :deep(.match-list) {
        display: flex;
        overflow-x: auto;
        padding: 0.3rem 0.3rem 0.7rem;
        scroll-snap-type: x proximity;
    }
    .match-sidebar :deep(.match-list li) {
        flex: 0 0 230px;
        scroll-snap-align: start;
    }
    .retention-note {
        margin-top: 0;
    }
}
@media (max-width: 530px) {
    .journal-empty {
        grid-template-columns: 1fr;
        gap: 0.6rem;
    }
    .empty-orbit {
        max-width: 132px;
    }
    .empty-copy {
        max-width: 32rem;
    }
}
</style>
