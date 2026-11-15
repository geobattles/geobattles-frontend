import type {
    MsgJoinedLobbyData,
    MsgLeftLobbyData,
    MsgUpdatedLobbyData,
    MsgStartRoundData,
    MsgNewResultData,
    MsgRoundResultData,
    MsgCCData,
    MsgGameEndData,
    MsgRejoinRound,
} from "~/types/socketTypes";
import { SocketType } from "~/types/socketTypes";
import { type Coordinates, type LobbyInfo, type LobbyPhase, type ResultData, type Results } from "~/types/appTypes";

const wireRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const decodeCoordinates = (value: unknown): Coordinates => {
    if (
        !wireRecord(value) ||
        typeof value.lat !== "number" ||
        typeof value.lng !== "number" ||
        !Number.isFinite(value.lat) ||
        !Number.isFinite(value.lng) ||
        Math.abs(value.lat) > 90 ||
        Math.abs(value.lng) > 180
    )
        throw new Error("Invalid archived coordinates.");
    return { lat: value.lat, lng: value.lng };
};
const wireInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);
const decodeScoredRound = (value: unknown): Results => {
    if (!wireRecord(value)) throw new Error("Invalid scored round archive.");
    return Object.fromEntries(
        Object.entries(value).map(([playerId, row]) => {
            if (
                !wireRecord(row) ||
                !wireInteger(row.attempt) ||
                row.attempt < 0 ||
                !wireInteger(row.baseScr) ||
                !wireInteger(row.lives) ||
                typeof row.distance !== "number" ||
                !Number.isFinite(row.distance) ||
                row.distance < 0
            )
                throw new Error("Invalid scored result.");
            const result: ResultData = { attempt: row.attempt, baseScr: row.baseScr, lives: row.lives, distance: row.distance, location: decodeCoordinates(row.location) };
            for (const field of ["placeScr", "dblScr", "duelScr", "total", "time"] as const) {
                const score = row[field];
                if (score !== undefined) {
                    if (!wireInteger(score)) throw new Error("Invalid scored result.");
                    result[field] = score;
                }
            }
            if (row.cc !== undefined) {
                if (typeof row.cc !== "string") throw new Error("Invalid scored result.");
                result.cc = row.cc;
            }
            if (row.player_countries !== undefined) {
                if (!Array.isArray(row.player_countries) || !row.player_countries.every((country): country is string => typeof country === "string"))
                    throw new Error("Invalid scored result.");
                result.player_countries = [...row.player_countries];
            }
            return [playerId, result];
        })
    );
};
// The transport validates envelopes; decode optional archives here, before any
// state mutation. Reconstruct values instead of casting untrusted coordinate maps.
const decodeRoundArchive = <T>(value: unknown, lastRound: number, decode: (entry: unknown) => T): Record<number, T> | undefined => {
    if (value === undefined) return undefined;
    if (!wireRecord(value)) throw new Error("Invalid round archive.");
    return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => {
            const round = Number(key);
            if (!Number.isSafeInteger(round) || round < 1 || round > lastRound || String(round) !== key) throw new Error("Invalid archived round.");
            return [round, decode(entry)];
        })
    );
};

export const SOCKET_COMMANDS = {
    START: "start",
    SUBMIT_LOCATION: "submit_location",
    LOC_TO_CC: "loc_to_cc",
    UPDATE_LOBBY_SETTINGS: "update_lobby_settings",
    SET_READY: "setReady",
};

export const createSocketHandlers = () => {
    const app = useNuxtApp();
    const lobby = useLobbyStore();
    const mode = useGameMode();
    const results = useResultsStore();
    const battle = useBattleRoyaleStore();
    const battleState = useBattleRoyaleState();
    const player = usePlayerInfo();
    const request = useRequestState();
    const { roundDeadline, finalResultsReady, finalResultsPlayerId, revealedAnswers } = useLobbyState();
    const { getPlayerNameFromID } = usePlayerLookup();
    const render = (operation: () => Promise<void>) => {
        const owner = app.$gameRuntime.battleRoyale;
        // Only applied round/phase state grants mapView/activeRound. SDK waits
        // remain detached from ordered dispatch and admission acknowledgement.
        const pending = operation();
        const epoch = owner.generation;
        owner.trackRender(
            pending.catch(() => {
                if (epoch === owner.generation && lobby.lobbySettings) owner.renderError.value = true;
            })
        );
    };
    const setPhase = (phase: LobbyPhase, round: number) => {
        if (lobby.lobbySettings) {
            lobby.lobbySettings.phase = phase;
            lobby.lobbySettings.currentRound = round;
            lobby.lobbySettings.round = round;
        }
        if (mode.currentMode === "BattleRoyale") battleState.currentRound.value = round;
        app.$gameRuntime.reconcileLobbyRoute();
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
        if (!player.value.ID || snapshot.playerList[player.value.ID]?.connected !== true) throw new Error("Missing connected membership.");
        if (snapshot.phase !== "WAITING" && (!snapshot.location || snapshot.currentRound < 1)) throw new Error("Missing round solution.");
        const location = snapshot.location === undefined ? undefined : decodeCoordinates(snapshot.location);
        const endResults = decodeRoundArchive(snapshot.endResults, snapshot.currentRound, decodeScoredRound);
        if (!endResults) throw new Error("Missing scored round archive.");
        const lastRevealedRound = snapshot.phase === "WAITING" ? 0 : snapshot.currentRound - (snapshot.phase === "PLAYING" ? 1 : 0);
        const answers = decodeRoundArchive(snapshot.revealedAnswers, lastRevealedRound, decodeCoordinates);
        const previous = lobby.lobbySettings;
        const changed =
            !previous || previous.ID !== snapshot.ID || previous.gameId !== snapshot.gameId || previous.phase !== snapshot.phase || previous.currentRound !== snapshot.currentRound;
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
        lobby.rejoinTimer = snapshot.phase === "PLAYING" ? Math.max(0, Math.ceil(snapshot.timeRemaining / 1000)) : null;
        if (snapshot.phase === "PLAYING") {
            const deadline = Date.now() + snapshot.timeRemaining;
            // Repeated membership/recovery snapshots may arrive with different
            // latency. They can shorten this round, never grant extra time.
            roundDeadline.value = !changed && roundDeadline.value !== null ? Math.min(roundDeadline.value, deadline) : deadline;
        } else roundDeadline.value = null;
        revealedAnswers.value = nextAnswers;
        if (location) mode.modeLogic.setSearchedLocationCoords(location);
        finalResultsPlayerId.value = snapshot.phase === "FINISHED" ? player.value.ID : null;
        finalResultsReady.value = snapshot.phase === "FINISHED";
        const member = player.value.ID ? snapshot.playerList[player.value.ID] : undefined;
        request.acknowledgeReady(member?.ready);
        if (ownAdmission || changed) {
            request.resetPending();
            if (mode.currentMode === "BattleRoyale") render(() => battle.restoreRound(phase, snapshot.currentRound));
        }
    };
    return {
        [SocketType.JOINED_LOBBY]: (message: MsgJoinedLobbyData) => {
            const { lobby: snapshot, user } = message.payload;
            if (!snapshot || !user) throw new Error("Missing lobby state.");
            // Full peer snapshots replace data too, but ordinary membership /
            // readiness updates never recreate this player's map or countdown.
            applySnapshot(snapshot, user === player.value.ID);
        },
        [SocketType.LEFT_LOBBY]: (message: MsgLeftLobbyData) => {
            const { lobby: snapshot, user } = message.payload;
            if (!snapshot || !user) throw new Error("Missing lobby state.");
            app.$gameRuntime.ui.showPlayerLeftToast(getPlayerNameFromID(user) ?? "Unknown Player", !!snapshot.playerList[user]);
            applySnapshot(snapshot);
        },
        [SocketType.REJOIN_ROUND]: (message: MsgRejoinRound) => {
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
        [SocketType.UPDATED_LOBBY]: (message: MsgUpdatedLobbyData) => {
            if (!message.payload.lobby) throw new Error("Missing lobby state.");
            applySnapshot(message.payload.lobby);
        },
        [SocketType.START_ROUND]: (message: MsgStartRoundData) => {
            const data = message.payload;
            const previous = lobby.lobbySettings;
            if (!previous || !data.location || !data.players || data.phase !== "PLAYING") throw new Error("Missing round state.");
            const round = data.round;
            if (!Number.isInteger(round) || round < 1) throw new Error("Missing authoritative round.");
            const sameGame = !data.gameId || !previous.gameId || data.gameId === previous.gameId;
            if (sameGame && round < previous.currentRound && !(round === 1 && previous.phase === "FINISHED" && !data.gameId)) return;
            if (sameGame && round === previous.currentRound && (previous.phase === "PLAYING" || previous.phase === "MID-ROUND")) return;
            if (data.gameId && previous.gameId === data.gameId && previous.phase === "FINISHED") return;
            if (!sameGame && (round !== 1 || (previous.phase !== "WAITING" && previous.phase !== "FINISHED"))) throw new Error("Unexpected match start.");
            const remaining = data.timeRemaining === undefined ? previous.conf.roundTime * 1000 + 3000 : data.timeRemaining;
            if (!Number.isSafeInteger(remaining) || remaining < 0) throw new Error("Invalid round clock.");
            // Never clear a completed summary when merely REQUESTING a replay.
            if (round === 1) {
                results.resetResults();
                revealedAnswers.value = {};
                previous.results = {};
                previous.endResults = {};
                delete previous.revealedAnswers;
                previous.totalResults = {};
            }
            results.restoreRound(data.players, {}, {});
            previous.gameId = data.gameId ?? (round === 1 ? undefined : previous.gameId);
            lobby.updateLobbySetting("playerList", data.players);
            previous.results[round] = {};
            previous.endResults[round] = {};
            previous.fullroundRes = {};
            previous.roundRes = {};
            previous.powerLog = data.powerLog;
            previous.location = data.location;
            lobby.rejoinTimer = null;
            finalResultsReady.value = false;
            finalResultsPlayerId.value = null;
            request.resetPending();
            setPhase(data.phase, round);
            roundDeadline.value = Date.now() + remaining;
            mode.modeLogic.setSearchedLocationCoords(data.location);
            request.clearError();
            render(() => mode.startRound());
        },
        [SocketType.NEW_RESULT]: (message: MsgNewResultData) => {
            const { user, playerRes, round, gameId } = message.payload;
            if (!user || !playerRes || !Number.isInteger(playerRes.attempt) || playerRes.attempt < 1) throw new Error("Missing player result.");
            const snapshot = lobby.lobbySettings;
            if (!snapshot || !acceptsGame(gameId) || snapshot.phase !== "PLAYING" || snapshot.currentRound !== round) return;
            // Legacy frames without seq are idempotent by per-player attempt.
            // A duplicate cannot add raw history or ACK a newer pending guess.
            if ((results.rawResults[user] ?? []).some((guess) => guess.attempt >= playerRes.attempt)) return;
            const leaders = results.applySingleResult(user, playerRes);
            snapshot.fullroundRes = results.rawResults;
            snapshot.roundRes = results.bestResults;
            snapshot.results[round] = results.rawResults;
            snapshot.endResults[round] = results.bestResults;
            if (snapshot.playerList[user]) snapshot.playerList[user].lives = playerRes.lives;
            if (leaders) app.$gameRuntime.ui.applyGuessStyles(user, leaders.leaderBefore, leaders.leaderAfter);
            if (user === player.value.ID) battle.acceptGuess(round);
        },
        [SocketType.ROUND_RESULT]: (message: MsgRoundResultData) => {
            const data = message.payload;
            const snapshot = lobby.lobbySettings;
            if (!data.totalResults || !data.roundRes || !data.players || !data.fullroundRes || !data.location) throw new Error("Missing round results.");
            if (!snapshot || !acceptsGame(data.gameId) || data.round < snapshot.currentRound) return;
            if (snapshot.phase === "FINISHED" && data.phase !== "FINISHED") return;
            if (!Number.isInteger(data.round) || data.round < 1 || (data.phase !== "MID-ROUND" && data.phase !== "FINISHED")) throw new Error("Invalid round results.");
            const location = decodeCoordinates(data.location);
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
            snapshot.location = location;
            snapshot.timeRemaining = 0;
            revealedAnswers.value[data.round] = { ...location };
            mode.modeLogic.setSearchedLocationCoords(location);
            lobby.rejoinTimer = null;
            roundDeadline.value = null;
            setPhase(data.phase, data.round);
            request.resetPending();
            if (changed) render(() => Promise.resolve(mode.finishRound(data.round, data.polygon)));
            if (data.phase === "FINISHED") mode.finishGame();
        },
        [SocketType.GAME_END]: (message: MsgGameEndData) => {
            const data = message.payload;
            const snapshot = lobby.lobbySettings;
            if (!data.totalResults || !data.results || data.phase !== "FINISHED" || !Number.isInteger(data.round) || data.round < 1) throw new Error("Missing final results.");
            if (!snapshot || !acceptsGame(data.gameId) || data.round < snapshot.currentRound) return;
            const endResults = decodeRoundArchive(data.endResults, data.round, decodeScoredRound);
            const answers = decodeRoundArchive(data.revealedAnswers, data.round, decodeCoordinates);
            if (data.gameId !== undefined) snapshot.gameId = data.gameId;
            snapshot.results = Object.fromEntries(Object.entries(data.results).map(([round, raw]) => [round, normalizeRawResults(raw)]));
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
            roundDeadline.value = null;
            setPhase(data.phase, data.round);
            request.resetPending();
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
        [SocketType.CC]: (message: MsgCCData) => {
            const { polygon, cc } = message.payload;
            if (polygon && cc) mode.processClickedCountry(polygon, cc);
        },
    };
};
