<template>
    <div class="journal-page atlas-menu-shell">
        <Header />
        <main id="main-content" class="journal-main">
            <header class="journal-heading">
                <div>
                    <p class="eyebrow">Match archive</p>
                    <h1>Expedition <span>Journal.</span></h1>
                    <p class="journal-intro">A closer look at the places you guessed — and the answers you found.</p>
                </div>
                <NuxtLink to="/" class="back-link"
                    ><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h12" stroke="currentColor" stroke-width="1.5" /></svg>Back to the
                    world</NuxtLink
                >
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
                        <path d="M37 125h12m222 0h12M160 2v12m0 222v12" stroke="var(--gb-muted)" /></svg
                    ><span>NO EXPEDITIONS RECORDED</span>
                </div>
                <div class="empty-copy">
                    <p class="eyebrow">First entry</p>
                    <h2 id="empty-title">No matches recorded yet.</h2>
                    <p v-if="mounted && identityId">
                        Finish a Battle Royale game to save the rounds, your guesses, the revealed answers and your scores here. Only complete results are recorded — no sample
                        matches, no invented progress.
                    </p>
                    <p v-else>
                        Sign in or choose a guest identity, then finish a Battle Royale game. Your completed rounds and personal bests will stay here on this device, separate from
                        other identities.
                    </p>
                    <NuxtLink to="/" class="primary-link"
                        >{{ mounted && identityId ? "Find your next game" : "Choose how to play"
                        }}<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" /></svg
                    ></NuxtLink>
                </div>
            </section>
        </main>
        <dialog ref="clearDialog" class="clear-dialog" aria-labelledby="clear-title" aria-describedby="clear-description" @close="clearTarget = null" @click="closeFromBackdrop">
            <form @submit.prevent="confirmClear">
                <p class="eyebrow">DEVICE STORAGE</p>
                <h2 id="clear-title">Clear this journal?</h2>
                <p id="clear-description">
                    This permanently removes this identity's saved matches and personal bests from this browser. Other identities are not affected. It cannot be undone.
                </p>
                <div class="dialog-actions">
                    <button type="button" autofocus @click="clearDialog?.close()">Keep my journal</button><button type="submit" class="confirm-clear">Clear local journal</button>
                </div>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import { useMatchJournal } from "~/composables/matchJournal";
import MatchList from "~/components/journal/MatchList.vue";
import MatchDebrief from "~/components/journal/MatchDebrief.vue";
import { journalDistance, journalNumber } from "~/components/journal/format";

useHead({
    title: "Expedition Journal · GeoBattles",
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
const clearDialog = ref<HTMLDialogElement | null>(null);
const clearTarget = ref<string | null>(null);
const clearNote = ref<string | null>(null);
// Stabilize only the public empty-state copy, not the immediate private identity gates.
const mounted = ref(false);
const openClear = () => {
    clearTarget.value = identityId.value;
    clearDialog.value?.showModal();
};
const confirmClear = () => {
    if (identityId.value && clearTarget.value === identityId.value) {
        clearNote.value = clear()
            ? "This identity's local journal has been cleared."
            : "This session's journal was cleared, but browser storage is blocked. Previously saved device data could not be confirmed removed; use your browser's site-data controls if needed.";
        selectedId.value = null;
    }
    clearDialog.value?.close();
};
const closeFromBackdrop = (event: MouseEvent) => {
    const dialog = clearDialog.value;
    if (!dialog || event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
};
const storageChanged = (event: StorageEvent) => {
    if (event.key === null || event.key === `geobattles:journal:v1:${encodeURIComponent(identityId.value ?? "")}`) load();
};
watch(
    identityId,
    () => {
        selectedId.value = null;
        clearNote.value = null;
        clearDialog.value?.close();
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
    clearDialog.value?.close();
});
</script>

<style scoped>
.journal-page {
    min-height: 100dvh;
    background-color: var(--gb-bg);
    color: var(--gb-text);
}
.journal-main {
    max-width: 1280px;
    margin: 0 auto;
    padding: clamp(2rem, 5vw, 4.5rem) clamp(1rem, 4vw, 3rem) 1.5rem;
}
.journal-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 2rem;
}
.eyebrow {
    font-size: 0.66rem;
    letter-spacing: 0.15em;
    font-weight: 600;
    color: var(--gb-muted);
    margin: 0 0 0.8rem;
}
h1 {
    font-size: clamp(2.3rem, 5vw, 3.8rem);
    font-family: var(--gb-font-headline);
    font-style: italic;
    font-weight: 900;
    letter-spacing: -0.055em;
    line-height: 1.12;
    margin: 0;
}
h1 span {
    color: var(--gb-accent);
}
.journal-intro {
    color: var(--gb-muted);
    line-height: 1.7;
    font-size: 0.9rem;
    margin: 0.9rem 0 0;
    max-width: 34rem;
}
.back-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--gb-text);
    text-decoration: none;
    min-height: 44px;
    white-space: nowrap;
}
.back-link svg,
.primary-link svg {
    width: 21px;
    height: 21px;
}
a:focus-visible,
button:focus-visible {
    outline: 2px solid var(--gb-accent);
    outline-offset: 5px;
    border-radius: 4px;
}
.storage-notice {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    border-top: 1px solid var(--gb-line);
    border-bottom: 1px solid var(--gb-line);
    padding: 1rem 0;
}
.storage-notice > svg {
    width: 23px;
    height: 23px;
    flex-shrink: 0;
    color: var(--gb-muted);
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
    grid-template-columns: 1.1fr repeat(3, 1fr);
    gap: 1rem;
    align-items: center;
    padding: 1.75rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--gb-line);
}
.bests-label h2 {
    font-size: 0.8rem;
    font-weight: 600;
    margin: 0;
}
.bests-label p {
    color: var(--gb-muted);
    font-size: 0.67rem;
    margin: 0.35rem 0 0;
}
.personal-bests button,
.best-no-guess {
    padding: 0.3rem 0.75rem;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 0.45rem;
    border: 0;
    background: transparent;
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
    font-weight: 500;
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
    margin-top: 2rem;
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
    gap: clamp(1.5rem, 5vw, 5rem);
    padding: clamp(2.5rem, 6vw, 6rem) 2rem;
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
.empty-orbit > span {
    display: block;
    color: var(--gb-muted);
    font-family: ui-monospace, monospace;
    letter-spacing: 0.12em;
    font-size: 0.58rem;
    margin-top: 1rem;
}
.empty-copy h2 {
    font-size: clamp(1.65rem, 3vw, 2.5rem);
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.035em;
    margin: 0 0 1rem;
}
.empty-copy > p:not(.eyebrow) {
    color: var(--gb-muted);
    line-height: 1.8;
    font-size: 0.85rem;
    max-width: 28rem;
}
.primary-link {
    color: var(--gb-on-accent);
    background: linear-gradient(115deg, var(--gb-accent), var(--gb-accent-end));
    border: 1px solid var(--gb-accent);
    border-radius: 8px;
    padding: 0.9rem 1.1rem;
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    gap: 1.5rem;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0.7rem 0;
}
.primary-link:hover {
    filter: brightness(1.06);
}
.clear-dialog {
    color: var(--gb-text);
    background: var(--gb-surface);
    border: 1px solid var(--gb-line);
    border-radius: 14px;
    width: min(480px, calc(100vw - 2rem));
    padding: 1.75rem;
    margin: auto;
}
.clear-dialog::backdrop {
    background: color-mix(in srgb, var(--gb-bg) 80%, transparent);
}
.clear-dialog h2 {
    font-size: 1.65rem;
    margin: 0;
    font-weight: 600;
    letter-spacing: -0.03em;
}
.clear-dialog p:not(.eyebrow) {
    color: var(--gb-muted);
    line-height: 1.7;
    font-size: 0.85rem;
    margin: 1rem 0 1.5rem;
}
.dialog-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.7rem;
}
.dialog-actions button {
    border: 1px solid var(--gb-line);
    border-radius: 7px;
    background: var(--gb-raised);
    color: var(--gb-text);
    padding: 0.75rem 0.9rem;
    min-height: 44px;
    font-size: 0.8rem;
}
.dialog-actions .confirm-clear {
    background: var(--gb-danger);
    border-color: var(--gb-danger);
    color: var(--gb-bg);
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
        flex: 1;
        min-width: 220px;
    }
    .clear-button {
        margin-left: 2rem;
        padding-left: 0;
    }
    .personal-bests {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }
    .bests-label {
        grid-column: 1 / -1;
        margin-bottom: 0.75rem;
    }
    .personal-bests button,
    .best-no-guess {
        padding-left: 0;
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
    .journal-empty {
        padding: 1.25rem 0;
        grid-template-columns: 1fr;
        gap: 1.25rem;
    }
    .empty-orbit {
        max-width: 160px;
    }
    .empty-orbit > span {
        margin-top: 0.5rem;
    }
    .empty-copy {
        max-width: 32rem;
    }
}
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
    }
}
</style>
