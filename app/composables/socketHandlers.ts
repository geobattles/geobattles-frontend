import { SocketType, type GameSocketEvent, type SocketEventHandlers } from "~/types/socketTypes";
import type { createUIRuntime } from "~/runtime/ui";
import { ROUND_COUNTDOWN_MS, type createRoundClock } from "~/runtime/roundClock";
import { decodeSocketCoordinates, decodeSocketResult, isSocketRecord } from "~/runtime/socketValues";
import type { Coordinates, LobbyInfo, LobbyPhase, Results } from "~/types/appTypes";
import type { PowerupEffect, PowerupState } from "~/types/powerups";

const decodeScoredRound = (value: unknown): Results => {
    if (!isSocketRecord(value)) throw new Error("Invalid scored round archive.");
    return Object.fromEntries(Object.entries(value).map(([playerId, row]) => [playerId, decodeSocketResult(row)]));
};
// The transport validates envelopes; decode optional archives here, before any
// state mutation. Reconstruct values instead of casting untrusted coordinate maps.
const decodeRoundArchive = <T>(value: unknown, lastRound: number, decode: (entry: unknown) => T): Record<number, T> | undefined => {
    if (value === undefined) return undefined;
    if (!isSocketRecord(value)) throw new Error("Invalid round archive.");
    return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => {
            const round = Number(key);
            if (!Number.isSafeInteger(round) || round < 1 || round > lastRound || String(round) !== key) throw new Error("Invalid archived round.");
            return [round, decode(entry)];
        })
    );
};

type GameEventEffects = Pick<ReturnType<typeof createUIRuntime>, "showPlayerPresence" | "showLiveGuess"> & {
    powerupReceipt: (gameId: string, requestId: string, effect?: PowerupEffect) => void;
    clock: Pick<ReturnType<typeof createRoundClock>, "apply" | "reset">;
    reconcileLobbyRoute: () => void;
    render: (operation: () => Promise<void>) => void;
};

export const createSocketHandlers = ({ clock, reconcileLobbyRoute, render, showPlayerPresence, showLiveGuess, powerupReceipt }: GameEventEffects) => {
    const lobby = useLobbyStore();
    const mode = useGameMode();
    const results = useResultsStore();
    const battle = useBattleRoyaleStore();
    const battleState = useBattleRoyaleState();
    const player = usePlayerInfo();
    const request = useRequestState();
    const { finalResultsReady, finalResultsPlayerId, revealedAnswers } = useLobbyState();
    const { getPlayerNameFromID } = usePlayerLookup();

    const setPhase = (phase: LobbyPhase, round: number) => {
        if (lobby.lobbySettings) {
            lobby.lobbySettings.phase = phase;
            lobby.lobbySettings.currentRound = round;
            lobby.lobbySettings.round = round;
        }
        if (mode.currentMode === "BattleRoyale") battleState.currentRound.value = round;
        reconcileLobbyRoute();
    };
    const acceptsGame = (gameId?: string) => !gameId || !lobby.lobbySettings?.gameId || gameId === lobby.lobbySettings.gameId;
    const applySnapshot = (snapshot: LobbyInfo, ownAdmission = false) => {
        const phase = phaseGameState(snapshot.phase);
        if (
            !snapshot.ID ||
            !snapshot.playerList ||
            !snapshot.conf ||
            !Number.isInteger(snapshot.currentRound) ||
            snapshot.currentRound < 0 ||
            snapshot.currentRound !== snapshot.round ||
            !Number.isFinite(snapshot.timeRemaining) ||
            snapshot.timeRemaining < 0 ||
            !snapshot.results ||
            !snapshot.endResults ||
            !snapshot.fullroundRes ||
            !snapshot.roundRes ||
            !snapshot.totalResults
        )
            throw new Error("Missing recovery state.");
        const playerId = player.value.ID;
        if (!playerId || (!snapshot.spectating && snapshot.playerList[playerId]?.connected !== true)) throw new Error("Missing connected membership.");
        if (snapshot.phase !== "WAITING" && (snapshot.currentRound < 1 || (!snapshot.spectating && !snapshot.location))) throw new Error("Missing round state.");
        const lastRevealedRound = snapshot.phase === "WAITING" ? 0 : snapshot.currentRound - (snapshot.phase === "PLAYING" ? 1 : 0);
        const endResults = decodeRoundArchive(snapshot.endResults, snapshot.spectating ? lastRevealedRound : snapshot.currentRound, decodeScoredRound);
        if (!endResults) throw new Error("Missing scored round archive.");
        const answers = decodeRoundArchive(snapshot.revealedAnswers, lastRevealedRound, decodeSocketCoordinates);
        if (snapshot.spectating) {
            if (
                snapshot.location ||
                snapshot.powerupState ||
                Object.keys(snapshot.results).length ||
                Object.keys(snapshot.fullroundRes).length ||
                Object.keys(snapshot.roundRes).length
            )
                throw new Error("Invalid spectator state.");
            lobby.fetchLobbySettings({ ...snapshot, endResults, revealedAnswers: answers });
            if (snapshot.phase === "PLAYING") {
                clock.apply({ lobbyId: snapshot.ID, playerId, gameId: snapshot.gameId, round: snapshot.currentRound }, snapshot.timeRemaining);
            } else {
                clock.reset();
            }
            reconcileLobbyRoute();
            return;
        }
        const location = snapshot.location === undefined ? undefined : decodeSocketCoordinates(snapshot.location);
        const previous = lobby.lobbySettings;
        const changed =
            !previous ||
            previous.spectating ||
            previous.ID !== snapshot.ID ||
            previous.gameId !== snapshot.gameId ||
            previous.phase !== snapshot.phase ||
            previous.currentRound !== snapshot.currentRound;
        const sameGame = previous?.ID === snapshot.ID && previous.gameId === snapshot.gameId;
        const capturedAnswers = Object.fromEntries(Object.entries(sameGame ? revealedAnswers.value : {}).map(([round, answer]) => [round, { ...answer }]));
        const nextAnswers: Record<number, Coordinates> = { ...capturedAnswers, ...answers };
        if ((snapshot.phase === "MID-ROUND" || snapshot.phase === "FINISHED") && location) nextAnswers[snapshot.currentRound] = { ...location };
        if (ownAdmission) {
            lobby.isUpdatingSettings = false;
            lobby.modifySettingsModal = false;
        }
        lobby.fetchLobbySettings({
            ...snapshot,
            location,
            revealedAnswers: nextAnswers,
            results: Object.fromEntries(Object.entries(snapshot.results).map(([round, raw]) => [round, normalizeRawResults(raw)])),
            endResults: Object.fromEntries(Object.entries(endResults).map(([round, best]) => [round, normalizeResults(best)])),
            fullroundRes: normalizeRawResults(snapshot.fullroundRes),
            roundRes: normalizeResults(snapshot.roundRes),
        });
        setPhase(snapshot.phase, snapshot.currentRound);
        results.restoreRound(snapshot.playerList, snapshot.fullroundRes, snapshot.roundRes);
        results.syncTotalResults(snapshot.totalResults);
        if (lobby.lobbySettings) {
            lobby.lobbySettings.fullroundRes = results.rawResults;
            lobby.lobbySettings.roundRes = results.bestResults;
            lobby.lobbySettings.totalResults = results.totalResults;
        }
        if (snapshot.phase === "PLAYING") {
            lobby.rejoinTimer = clock.apply({ lobbyId: snapshot.ID, playerId, gameId: snapshot.gameId, round: snapshot.currentRound }, snapshot.timeRemaining);
        } else {
            lobby.rejoinTimer = null;
            clock.reset();
        }
        revealedAnswers.value = nextAnswers;
        if (location) mode.modeLogic.setSearchedLocationCoords(location);
        finalResultsPlayerId.value = snapshot.phase === "FINISHED" ? playerId : null;
        finalResultsReady.value = snapshot.phase === "FINISHED";
        const member = player.value.ID ? snapshot.playerList[player.value.ID] : undefined;
        request.acknowledgeReady(member?.ready);
        if (ownAdmission || changed) {
            request.resetPending();
            if (mode.currentMode === "BattleRoyale") render(() => battle.restoreRound(phase, snapshot.currentRound, !changed));
        }
    };
    const applyPowerups = (state: PowerupState, players?: LobbyInfo["playerList"]) => {
        const snapshot = lobby.lobbySettings;
        if (!snapshot || state.gameId !== snapshot.gameId || state.round !== snapshot.currentRound) return;
        const previous = snapshot.powerupState;
        if (previous && previous.gameId === state.gameId && previous.round === state.round && previous.status === "CLOSED" && state.status === "OPEN") return;
        snapshot.powerupState = state;
        if (players) lobby.updateLobbySetting("playerList", players);
        if (state.startRequested || state.starting) request.isStartPending = false;
    };
    const handlers: SocketEventHandlers = {
        [SocketType.POWERUP_STATE]: ({ payload: data }) => {
            const snapshot = lobby.lobbySettings;
            if (!snapshot || data.gameId !== snapshot.gameId || data.round !== snapshot.currentRound || data.phase !== snapshot.phase) return;
            applyPowerups(data.powerupState, data.players);
        },
        [SocketType.POWERUP_USED]: ({ payload: data }) => {
            powerupReceipt(data.gameId, data.requestId, data.effect);
            applyPowerups(data.powerupState, data.players);
        },
        [SocketType.POWERUP_READY]: ({ payload: data }) => {
            powerupReceipt(data.gameId, data.requestId);
            applyPowerups(data.powerupState);
        },
        // Persistent incoming effects, not a consent prompt. The ledger also
        // restores this notification after a missed warning/reconnect.
        [SocketType.DUEL_FROM]: () => {},
        [SocketType.JOINED_LOBBY]: (message) => {
            const { lobby: snapshot, user } = message.payload;
            if (!snapshot || !user) throw new Error("Missing lobby state.");
            // Full peer snapshots replace data too, but ordinary membership /
            // readiness updates never recreate this player's map or countdown.
            const previous = lobby.lobbySettings;
            const member = previous?.playerList[user];
            const reclaimed = !!previous?.admin && previous.admin !== user && snapshot.admin === user;
            applySnapshot(snapshot, user === player.value.ID);
            if (snapshot.spectating) return;
            if (reclaimed && user === player.value.ID) showPlayerPresence("You’re hosting again");
            else if (member && !member.connected) {
                const name = snapshot.playerList[user]?.name ?? member.name;
                showPlayerPresence(reclaimed ? `${name} returned as host` : `${name} returned to the lobby`);
            }
        },
        [SocketType.LEFT_LOBBY]: (message) => {
            const { lobby: snapshot, user } = message.payload;
            if (!snapshot || !user) throw new Error("Missing lobby state.");
            const name = getPlayerNameFromID(user) ?? "Unknown Player";
            applySnapshot(snapshot);
            const member = snapshot.playerList[user];
            if (member?.away) showPlayerPresence(`${name} stepped away`);
            else if (member) showPlayerPresence(`${name} is reconnecting`, true);
            else showPlayerPresence(`${name} left the lobby`);
        },
        [SocketType.REJOIN_ROUND]: (message) => {
            const data = message.payload;
            if (data.gameId && data.lobby.gameId && data.gameId !== data.lobby.gameId) throw new Error("Conflicting recovery match identity.");
            applySnapshot(
                {
                    ...data.lobby,
                    gameId: data.gameId ?? data.lobby.gameId,
                    phase: data.phase,
                    currentRound: data.round,
                    round: data.round,
                    playerList: data.players,
                    timeRemaining: data.timeRemaining,
                    fullroundRes: data.fullroundRes,
                    roundRes: data.roundRes,
                    totalResults: data.totalResults,
                    powerLog: data.powerLog,
                    location: data.location,
                },
                true
            );
        },
        [SocketType.UPDATED_LOBBY]: (message) => {
            if (!message.payload.lobby) throw new Error("Missing lobby state.");
            applySnapshot(message.payload.lobby);
        },
        [SocketType.START_ROUND]: (message) => {
            const data = message.payload;
            const previous = lobby.lobbySettings;
            const playerId = player.value.ID;
            if (!previous || !playerId || !data.players || data.phase !== "PLAYING") throw new Error("Missing round state.");
            const round = data.round;
            if (!Number.isInteger(round) || round < 1) throw new Error("Missing authoritative round.");
            const sameGame = !data.gameId || !previous.gameId || data.gameId === previous.gameId;
            if (sameGame && round < previous.currentRound && !(round === 1 && previous.phase === "FINISHED" && !data.gameId)) return;
            if (sameGame && round === previous.currentRound && (previous.phase === "PLAYING" || previous.phase === "MID-ROUND")) return;
            if (data.gameId && previous.gameId === data.gameId && previous.phase === "FINISHED") return;
            if (!sameGame && (round !== 1 || (previous.phase !== "WAITING" && previous.phase !== "FINISHED"))) throw new Error("Unexpected match start.");
            const remaining = data.timeRemaining === undefined ? previous.conf.roundTime * 1000 + ROUND_COUNTDOWN_MS : data.timeRemaining;
            if (!Number.isSafeInteger(remaining) || remaining < 0) throw new Error("Invalid round clock.");
            // Never clear a completed summary when merely REQUESTING a replay.
            if (round === 1) {
                results.resetResults();
                revealedAnswers.value = {};
                previous.results = {};
                previous.endResults = {};
                delete previous.revealedAnswers;
                previous.totalResults = {};
                delete previous.matchRoster;
                delete previous.endedEarly;
            }
            results.restoreRound(data.players, {}, {});
            previous.gameId = data.gameId ?? (round === 1 ? undefined : previous.gameId);
            lobby.updateLobbySetting("playerList", data.players);
            previous.results[round] = {};
            previous.endResults[round] = {};
            previous.fullroundRes = {};
            previous.roundRes = {};
            previous.powerLog = data.powerLog;
            previous.powerupState = data.powerupState;
            previous.location = data.location;
            lobby.rejoinTimer = null;
            finalResultsReady.value = false;
            finalResultsPlayerId.value = null;
            request.resetPending();
            setPhase(data.phase, round);
            clock.apply({ lobbyId: previous.ID, playerId, gameId: previous.gameId, round }, remaining);
            mode.modeLogic.setSearchedLocationCoords(data.location);
            request.clearError();
            render(() => mode.startRound());
        },
        [SocketType.NEW_RESULT]: (message) => {
            const { user, playerRes, round, gameId } = message.payload;
            if (!user || !playerRes || !Number.isInteger(playerRes.attempt) || playerRes.attempt < 1) throw new Error("Missing player result.");
            const snapshot = lobby.lobbySettings;
            if (!snapshot || !acceptsGame(gameId) || snapshot.phase !== "PLAYING" || snapshot.currentRound !== round) return;
            // Legacy frames without seq are idempotent by per-player attempt.
            // A duplicate cannot add raw history or ACK a newer pending guess.
            if ((results.rawResults[user] ?? []).some((guess) => guess.attempt >= playerRes.attempt)) return;
            const feedback = results.applySingleResult(user, playerRes);
            snapshot.fullroundRes = results.rawResults;
            snapshot.roundRes = results.bestResults;
            snapshot.results[round] = results.rawResults;
            snapshot.endResults[round] = results.bestResults;
            if (snapshot.playerList[user]) snapshot.playerList[user].lives = playerRes.lives;
            if (user === player.value.ID) battle.acceptGuess(round);
            if (feedback) showLiveGuess(feedback);
        },
        [SocketType.ROUND_RESULT]: (message) => {
            const data = message.payload;
            const snapshot = lobby.lobbySettings;
            if (!data.totalResults || !data.roundRes || !data.players || !data.fullroundRes || !data.location) throw new Error("Missing round results.");
            if (!snapshot || !acceptsGame(data.gameId) || data.round < snapshot.currentRound) return;
            if (snapshot.phase === "FINISHED" && data.phase !== "FINISHED") return;
            if (!Number.isInteger(data.round) || data.round < 1 || (data.phase !== "MID-ROUND" && data.phase !== "FINISHED")) throw new Error("Invalid round results.");
            const location = decodeSocketCoordinates(data.location);
            const roundResults = decodeScoredRound(data.roundRes);
            const changed = snapshot.phase !== data.phase || snapshot.currentRound !== data.round;
            results.restoreRound(data.players, data.fullroundRes, roundResults);
            results.syncTotalResults(data.totalResults);
            if (data.gameId !== undefined) snapshot.gameId = data.gameId;
            lobby.updateLobbySetting("playerList", data.players);
            snapshot.fullroundRes = results.rawResults;
            snapshot.roundRes = results.bestResults;
            snapshot.results[data.round] = results.rawResults;
            // Presentation may derive best geometry from raw guesses. The
            // journal archive retains only the actual final scored wire rows.
            snapshot.endResults[data.round] = roundResults;
            snapshot.totalResults = results.totalResults;
            snapshot.powerLog = data.powerLog;
            snapshot.powerupState = data.powerupState;
            snapshot.location = location;
            snapshot.timeRemaining = 0;
            revealedAnswers.value[data.round] = { ...location };
            mode.modeLogic.setSearchedLocationCoords(location);
            lobby.rejoinTimer = null;
            clock.reset();
            setPhase(data.phase, data.round);
            request.resetPending();
            if (changed) render(() => Promise.resolve(mode.finishRound(data.round, data.polygon)));
            if (data.phase === "FINISHED") mode.finishGame();
        },
        [SocketType.GAME_END]: (message) => {
            const data = message.payload;
            const snapshot = lobby.lobbySettings;
            if (!data.totalResults || !data.results || data.phase !== "FINISHED" || !Number.isInteger(data.round) || data.round < 1) throw new Error("Missing final results.");
            if (!snapshot || !acceptsGame(data.gameId) || data.round < snapshot.currentRound) return;
            const endResults = decodeRoundArchive(data.endResults, data.round, decodeScoredRound);
            const answers = decodeRoundArchive(data.revealedAnswers, data.round, decodeSocketCoordinates);
            const previousAnswer = revealedAnswers.value[data.round];
            const answer = answers?.[data.round] ?? previousAnswer;
            const restoreFinalMap =
                snapshot.currentRound !== data.round ||
                (snapshot.phase !== "MID-ROUND" && snapshot.phase !== "FINISHED") ||
                previousAnswer?.lat !== answer?.lat ||
                previousAnswer?.lng !== answer?.lng;
            if (data.gameId !== undefined) snapshot.gameId = data.gameId;
            snapshot.results = Object.fromEntries(Object.entries(data.results).map(([round, raw]) => [round, normalizeRawResults(raw)]));
            snapshot.powerupState = data.powerupState;
            snapshot.endedEarly = data.endedEarly;
            if (data.players) lobby.updateLobbySetting("playerList", data.players);
            // On legacy servers, only prior finalized answers prove which
            // locally retained score rounds finished. A live best row alone
            // must not become a scored archive when ROUND_RESULT was missed.
            snapshot.endResults = endResults ?? Object.fromEntries(Object.entries(snapshot.endResults).filter(([round]) => Object.hasOwn(revealedAnswers.value, round)));
            if (answers !== undefined) revealedAnswers.value = { ...revealedAnswers.value, ...answers };
            snapshot.revealedAnswers = Object.fromEntries(Object.entries(revealedAnswers.value).map(([round, answer]) => [round, { ...answer }]));
            snapshot.fullroundRes = snapshot.results[data.round] ?? {};
            results.restoreRound(snapshot.playerList, snapshot.fullroundRes, snapshot.endResults[data.round] ?? {});
            snapshot.roundRes = results.bestResults;
            snapshot.timeRemaining = 0;
            results.syncTotalResults(data.totalResults);
            snapshot.totalResults = results.totalResults;
            lobby.rejoinTimer = null;
            clock.reset();
            setPhase(data.phase, data.round);
            request.resetPending();
            if (answer) {
                snapshot.location = { ...answer };
                mode.modeLogic.setSearchedLocationCoords(answer);
            }
            if (restoreFinalMap && mode.currentMode === "BattleRoyale") {
                // Restore directly into FINISHED, fencing any pending gameplay
                // render. Never draw an unrevealed/stale answer on legacy ends.
                if (answer) render(() => battle.restoreRound(phaseGameState(data.phase), data.round));
                else battle.clearMap();
            }
            mode.finishGame();
            // The client journal owner observes only applied final archives and
            // totals. Its validator still rejects incomplete legacy history.
            finalResultsPlayerId.value = player.value.ID ?? null;
            finalResultsReady.value = true;
        },
        [SocketType.ROUND_FINISHED]: () => {
            lobby.rejoinTimer = null;
        },
        [SocketType.TIMES_UP]: () => {},
        [SocketType.NO_COUNTRY]: () => {},
        [SocketType.CC]: (message) => {
            const { polygon, cc } = message.payload;
            if (polygon && cc) mode.processClickedCountry(polygon, cc);
        },
    };
    return <T extends SocketType>(event: GameSocketEvent<T>) => handlers[event.type](event);
};
