import { watch } from "vue";
import { useMatchJournal } from "~/composables/matchJournal";

const PROCESSED_LIMIT = 256;
// Client-app ownership, including plugin HMR. This is not persisted journal data
// or serializable Nuxt state; an unmounted app can be garbage-collected normally.
const processedByApp: WeakMap<object, Set<string>> = import.meta.hot?.data.journalProcessedByApp ?? new WeakMap();
if (import.meta.hot) import.meta.hot.data.journalProcessedByApp = processedByApp;

export default defineNuxtPlugin((nuxtApp) => {
    const lobby = useLobbyStore();
    const player = usePlayerInfo();
    const journal = useMatchJournal();
    const processed = processedByApp.get(nuxtApp) ?? new Set<string>();
    processedByApp.set(nuxtApp, processed);
    let disposed = false;
    const stop = watch(
        [() => lobby.completedGame, journal.identityId, () => lobby.revealedAnswers],
        ([completed, playerId]) => {
            if (
                disposed ||
                !completed ||
                completed.phase !== "FINISHED" ||
                !completed.gameId ||
                !playerId ||
                playerId !== player.value.ID ||
                completed.playerList[playerId]?.connected !== true ||
                (completed.conf.mode !== 1 && completed.conf.mode !== 2)
            )
                return;
            const key = JSON.stringify([playerId, completed.gameId]);
            if (processed.has(key)) return;
            // No awaits or composable construction here: the captured journal
            // validates and copies the complete authoritative input synchronously.
            const outcome = journal.recordCompletedGame({
                gameId: completed.gameId,
                lobbyId: completed.ID,
                playerId,
                mode: getGameModeFromSettings(completed.conf.mode),
                phase: completed.phase,
                roundCount: completed.conf.numRounds,
                round: completed.round,
                results: completed.results,
                totalResults: completed.totalResults,
                endResults: completed.endResults,
                answers: lobby.revealedAnswers,
            });
            // Keep incomplete/storage-rejected candidates retryable. A successful
            // record or existing record is processed even if the user later clears
            // local history while repeated FINISHED/ready snapshots keep arriving.
            if (outcome.status === "recorded" || outcome.status === "duplicate") {
                processed.add(key);
                if (processed.size > PROCESSED_LIMIT) {
                    const oldest = processed.values().next().value;
                    if (oldest !== undefined) processed.delete(oldest);
                }
            }
        },
        // Batch each synchronous handler application; never observe its partially
        // replaced archive/phase. Deep observation retries a repaired candidate.
        { immediate: true, deep: true, flush: "post" }
    );
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        stop();
    };
    nuxtApp.vueApp.onUnmount(dispose);
    if (import.meta.hot) import.meta.hot.dispose(dispose);
});
