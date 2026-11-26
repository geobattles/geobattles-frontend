import type { LobbyInfo } from "~/types/appTypes";
import type { LobbySettingsPatch } from "~/types/socketTypes";
import { createLobbyService } from "~/services/lobbyService";

/**
 * LobbyStore manages all lobby-related state and operations including:
 * - Lobby creation, joining, and leaving
 * - Lobby settings management
 * - Player tracking within lobbies
 * - Managing the online lobbies list
 */
export const useLobbyStore = () => {
    const { lobbySettings, lobbySettingsOriginal, isUpdatingSettings, lobbyList, modifySettingsModal, rejoinTimer, finalResultsReady, finalResultsPlayerId, revealedAnswers } =
        useLobbyState();
    const app = useNuxtApp();
    const recovery = useLobbyRecovery();
    const playerInfo = usePlayerInfo();
    const countries = useCountryList();
    const selectedMode = useSelectedGameMode();
    const resultsStore = useResultsStore();
    const { rememberPlayers } = usePlayerLookup();
    const auth = useAuthStore();
    const { getValidAccessToken } = auth;
    const lobbyService = createLobbyService(useRuntimeConfig().public.BACKEND_HOST);

    // ================== Lobby creation and joining ==================
    /**
     * Create a new lobby on the server, connect to it via WebSocket and redirect to the lobby page
     */
    const createLobby = async (): Promise<void> => {
        const identity = playerInfo.value.ID;
        const intent = app.$gameRuntime.beginLobbyIntent();
        const isNavigationCurrent = app.$gameRuntime.captureNavigation();
        const lobbyPostParams = {
            name: `${playerInfo.value.displayName}'s Lobby`,
            roundTime: 100,
        };

        try {
            // Create lobby via service and store the returned lobby data
            const accessToken = await getValidAccessToken();
            if (!intent.isCurrent() || !isNavigationCurrent() || identity !== playerInfo.value.ID) throw new Error("Lobby creation was cancelled.");
            if (!accessToken) throw new Error("User not authenticated");

            const lobbyData = await lobbyService.createLobby(accessToken, lobbyPostParams);
            if (!intent.isCurrent() || !isNavigationCurrent() || identity !== playerInfo.value.ID) throw new Error("Lobby creation was cancelled.");
            await recovery.join(lobbyData.ID, intent);
        } catch (error) {
            throw error;
        }
    };

    /**
     * Join an existing lobby by ID, connect via WebSocket and navigate to the lobby page
     */
    const joinLobby = async (lobbyId: string) => {
        try {
            await recovery.join(lobbyId);
        } catch (error) {
            throw new Error(error instanceof Error ? `Failed to join lobby: ${error.message}` : "This lobby is currently not joinable.");
        }
    };

    /**
     * Leave the current lobby, disconnect WebSocket, reset state, and clean up game data
     */
    const leaveLobby = () => {
        try {
            app.$gameRuntime.leave(true);

            // Reset all lobby-related state
            lobbySettings.value = null;
            lobbySettingsOriginal.value = null;
        } catch (error) {
            throw new Error("Could not leave lobby.");
        }
    };

    // ================== Lobby list management ==================
    /**
     * Fetch the current list of available lobbies from the server
     */
    const fetchLobbyList = async (signal?: AbortSignal) => {
        const identity = playerInfo.value.ID;
        const token = auth.isAuthenticated ? await getValidAccessToken() : null;
        if (signal?.aborted || identity !== playerInfo.value.ID) return;
        const rows = await lobbyService.directory(token, signal);
        if (!signal?.aborted && identity === playerInfo.value.ID) lobbyList.value = rows;
    };

    /**
     * Check if a lobby with the given ID exists
     */
    const checkIfLobby = async (lobbyId: string) => {
        if (!(await lobbyService.find(lobbyId))) {
            throw new Error("Lobby does not exist");
        }
    };

    // ================== Lobby player management ==================
    /**
     * Handle a player joining the lobby by updating settings and initializing countries
     */
    const joinedLobby = (lobbyInfo: LobbyInfo, _userId: string) => {
        updateNestedLobbySettings(lobbyInfo);

        // Ensure country list is populated
        if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
        if (lobbySettings.value.conf.ccList.length === 0) {
            lobbySettings.value.conf.ccList = countries.value;
        }
    };

    /**
     * Handle a player leaving the lobby by updating player list and cleaning up results
     */
    const leftLobby = (lobbyInfo: LobbyInfo, _userId: string) => {
        updateNestedLobbySettings(lobbyInfo);

        // Membership scopes live presentation only. Raw/best/history/totals
        // outlive removal and may alias the authoritative lobby archive.
        resultsStore.syncMembers(lobbyInfo.playerList);
    };

    /**
     * Check if the current player is the lobby admin
     */
    const isPlayerAdmin = () => {
        if (!lobbySettings.value) return false;
        return lobbySettings.value.admin === playerInfo.value.ID;
    };

    // ================== Lobby settings management ==================
    /**
     * Initialize lobby settings from received lobby info
     */
    const fetchLobbySettings = (lobbyInfo: LobbyInfo) => {
        if (!lobbyInfo) return console.error("Lobby info is not initialized");
        updateNestedLobbySettings(lobbyInfo);

        // Ensure country list is populated
        if (!lobbySettings.value) return console.error("Country list is not initialized");
        if (lobbySettings.value.conf.ccList.length === 0) {
            lobbySettings.value.conf.ccList = countries.value;
        }
    };

    /**
     * Compare current settings with original settings and return only the changed fields
     * Handles special cases for country lists and complex objects
     */
    const getChangedSettings = (): LobbySettingsPatch => {
        if (!lobbySettings.value || !lobbySettingsOriginal.value) {
            throw new Error("Lobby settings are not initialized");
        }

        const { ccList: _currentCountries, scoreScaleKm: _currentScale, ...current } = lobbySettings.value.conf;
        const { ccList: _originalCountries, scoreScaleKm: _originalScale, ...original } = lobbySettingsOriginal.value.conf;
        return { ccList: processCountryList(lobbySettings.value, countries.value), ...getSettingsDiff(current, original) };
    };

    /**
     * Apply changed lobby settings and send updated configuration to the server via WebSocket
     */
    const applyLobbySettings = () => {
        const actions = app.$gameRuntime.socketActions;
        try {
            // Get only the settings that have changed
            const changedSettings = getChangedSettings();

            // Send the changes to the server
            actions.updateSettings(changedSettings);
        } catch {
            // Do not log HTTP/socket payloads or configuration in error objects.
            console.warn("Lobby settings could not be applied.");
        }
    };

    /**
     * Update a specific configuration setting in the lobby
     */
    const updateLobbyConfigSetting = <K extends keyof LobbyInfo["conf"]>(key: K, value: LobbyInfo["conf"][K]) => {
        if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
        lobbySettings.value.conf[key] = value;
    };

    /**
     * Update a top-level lobby setting (not in the conf object)
     */
    const updateLobbySetting = <K extends keyof LobbyInfo>(key: K, value: LobbyInfo[K]) => {
        if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
        rememberPlayers(lobbySettings.value.ID, lobbySettings.value.playerList);
        lobbySettings.value[key] = value;
        rememberPlayers(lobbySettings.value.ID, lobbySettings.value.playerList);
    };

    /**
     * Initialize or update all lobby settings, creating deep clones to avoid reference issues
     * Also sets the appropriate game mode based on lobby configuration
     */
    const updateNestedLobbySettings = (lobbyInfo: LobbyInfo) => {
        rememberPlayers(lobbyInfo.ID, lobbyInfo.playerList);
        // Editing owns only a local configuration draft, never membership,
        // readiness, the host, phase or authoritative results. A host handoff
        // or phase change also invalidates the old administrator's editor.
        const previous = lobbySettings.value;
        const keepDraft =
            isUpdatingSettings.value && previous !== null && previous.ID === lobbyInfo.ID && previous.phase === lobbyInfo.phase && lobbyInfo.admin === playerInfo.value.ID;
        const draft = keepDraft && previous ? structuredClone(toRaw(previous.conf)) : null;
        const { settings, originalSettings } = cloneLobbySettings(lobbyInfo);
        if (draft) settings.conf = draft;
        else if (isUpdatingSettings.value) {
            isUpdatingSettings.value = false;
            modifySettingsModal.value = false;
        }
        lobbySettings.value = settings;
        lobbySettingsOriginal.value = originalSettings;

        // Set game mode based on lobby settings
        if (lobbySettings.value) {
            try {
                const gameModeName = getGameModeFromSettings(lobbySettings.value.conf.mode);
                selectedMode.value = gameModeName;
            } catch (error) {
                console.error("Error setting game mode:", error);
            }
        }
    };

    // Export the store's public API
    return reactive({
        // State
        lobbySettings,
        lobbySettingsOriginal,
        isUpdatingSettings,
        lobbyList,
        modifySettingsModal,
        rejoinTimer,
        gameId: computed(() => lobbySettings.value?.gameId ?? null),
        completedGame: computed(() =>
            finalResultsReady.value && finalResultsPlayerId.value === playerInfo.value.ID && lobbySettings.value?.phase === "FINISHED" ? lobbySettings.value : null
        ),
        revealedAnswers,
        isPlayerReady: computed(() => !!playerInfo.value.ID && lobbySettings.value?.playerList[playerInfo.value.ID]?.ready === true),
        readyPlayerCount: computed(() => Object.values(lobbySettings.value?.playerList ?? {}).filter((member) => member.ready === true).length),
        allPlayersReady: computed(() => {
            const connected = Object.values(lobbySettings.value?.playerList ?? {}).filter((member) => member.connected);
            return connected.length > 0 && connected.every((member) => member.ready === true);
        }),

        // Methods
        createLobby,
        joinLobby,
        leaveLobby,
        joinedLobby,
        leftLobby,
        fetchLobbySettings,
        applyLobbySettings,
        updateLobbyConfigSetting,
        updateLobbySetting,
        fetchLobbyList,
        checkIfLobby,
        isPlayerAdmin,
        setReady: (ready: boolean) => app.$gameRuntime.socketActions.setReady(ready),
    });
};
