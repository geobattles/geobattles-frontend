import type { LobbyInfo } from "~/types/appTypes";

/**
 * LobbyStore manages all lobby-related state and operations including:
 * - Lobby creation, joining, and leaving
 * - Lobby settings management
 * - Player tracking within lobbies
 * - Managing the online lobbies list
 */
export const useLobbyStore = defineStore("lobby", () => {
    // Lobby settings states
    const lobbySettings = ref<LobbyInfo | null>(null); // Current lobby settings
    const lobbySettingsOriginal = ref<LobbyInfo | null>(null); // Original settings for comparison
    const isUpdatingSettings = ref(false); // Flag to prevent settings updates during changes

    // Lobby list and UI state
    const lobbyList = ref<string[]>([]); // List of available lobbies
    const modifySettingsModal = ref<boolean>(false); // Controls visibility of settings modal

    // ================== Lobby creation and joining ==================
    /**
     * Create a new lobby on the server, connect to it via WebSocket and redirect to the lobby page
     */
    const createLobby = async (): Promise<void> => {
        const playerInfo = usePlayerInfo();
        const router = useRouter();
        const { getToken } = useAuthStore();
        const socketStore = useWebSocketStore();

        const lobbyPostParams = {
            name: `${playerInfo.value.displayName}'s Lobby`,
            roundTime: 100,
        };

        try {
            // Create lobby via service and store the returned lobby data
            const authToken = getToken();
            if (!authToken) throw new Error("User not authenticated");

            const lobbyData = await lobbyService.createLobby(authToken, lobbyPostParams);
            lobbySettings.value = lobbyData;

            // Connect to the lobby via WebSocket and navigate to lobby page
            if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
            await socketStore.connect(lobbySettings.value.ID);
            await router.push({ path: `/lobby/${lobbySettings.value.ID}` });
        } catch (error) {
            console.error("Error creating lobby:", error);
            throw error;
        }
    };

    /**
     * Join an existing lobby by ID, connect via WebSocket and navigate to the lobby page
     */
    const joinLobby = async (lobbyId: string) => {
        const router = useRouter();
        const socketStore = useWebSocketStore();

        try {
            await socketStore.connect(lobbyId);
            await router.push({ path: `/lobby/${lobbyId}` });
        } catch (error) {
            console.error(`Error joining lobby ${lobbyId}:`, error);
            throw new Error(error instanceof Error ? `Failed to join lobby: ${error.message}` : "This lobby is currently not joinable.");
        }
    };

    /**
     * Leave the current lobby, disconnect WebSocket, reset state, and clean up game data
     */
    const leaveLobby = () => {
        const socketStore = useWebSocketStore();
        try {
            // Disconnect and clean up all related data
            socketStore.disconnect();

            // Exit gameplay mode if active
            const gameMode = useGameMode();
            try {
                gameMode.exitGameplay();
            } catch (error) {
                // Silent fail - gameplay might not be active
            }

            // Reset all lobby-related state
            lobbySettings.value = null;
            lobbySettingsOriginal.value = null;
            useLiveResults().value = {};
            useTotalResults().value = {};
        } catch (error) {
            console.error("Error leaving lobby:", error);
            throw new Error("Could not leave lobby.");
        }
    };

    // ================== Lobby list management ==================
    /**
     * Fetch the current list of available lobbies from the server
     */
    const fetchLobbyList = async () => {
        try {
            lobbyList.value = await lobbyService.fetchLobbyList();
        } catch (error) {
            console.error("Error fetching lobby list:", error);
            throw error;
        }
    };

    /**
     * Check if a lobby with the given ID exists
     */
    const checkIfLobby = async (lobbyId: string) => {
        await fetchLobbyList();
        if (!Object.keys(lobbyList.value).includes(lobbyId)) {
            throw new Error("Lobby does not exist");
        }
    };

    // ================== Lobby player management ==================
    /**
     * Handle a player joining the lobby by updating settings and initializing countries
     */
    const joinedLobby = (lobbyInfo: LobbyInfo, userId: string) => {
        updateNestedLobbySettings(lobbyInfo);

        // Ensure country list is populated
        if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
        if (lobbySettings.value.conf.ccList.length === 0) {
            lobbySettings.value.conf.ccList = useCountryList().value;
        }
        console.log(`Player ${userId} joined the lobby!`);
    };

    /**
     * Handle a player leaving the lobby by updating player list and cleaning up results
     */
    const leftLobby = (lobbyInfo: LobbyInfo, userId: string) => {
        const liveResults = useLiveResults();

        // Update player list and admin in lobby settings
        updateLobbySetting("playerList", lobbyInfo.playerList);
        updateLobbySetting("admin", lobbyInfo.admin);

        // Remove player from results tracking
        if (liveResults.value[userId]) {
            delete liveResults.value[userId];
        }
    };

    /**
     * Check if the current player is the lobby admin
     */
    const isPlayerAdmin = () => {
        if (!lobbySettings.value) return false;
        return lobbySettings.value.admin === usePlayerInfo().value.ID;
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
            lobbySettings.value.conf.ccList = useCountryList().value;
        }
    };

    // Type definitions for settings manipulation
    type ConfField = keyof LobbyInfo["conf"];
    type ConfValue = LobbyInfo["conf"][ConfField];
    type LobbySettings = Record<ConfField, ConfValue>;

    /**
     * Compare current settings with original settings and return only the changed fields
     * Handles special cases for country lists and complex objects
     */
    const getChangedSettings = (): LobbySettings => {
        if (!lobbySettings.value || !lobbySettingsOriginal.value) {
            throw new Error("Lobby settings are not initialized");
        }

        const countryList = useCountryList().value;
        const ls = lobbySettings.value;
        const lso = lobbySettingsOriginal.value;

        // Configure special handling for country list
        const specialFields = {
            ccList: () => processCountryList(ls, countryList),
        };

        // Get changed settings using utility function
        return getSettingsDiff(ls.conf, lso.conf, specialFields) as LobbySettings;
    };

    /**
     * Apply changed lobby settings and send updated configuration to the server via WebSocket
     */
    const applyLobbySettings = () => {
        const socketStore = useWebSocketStore();

        try {
            // Get only the settings that have changed
            const changedSettings = getChangedSettings();

            // Send the changes to the server
            socketStore.sendMessage({
                command: SOCKET_COMMANDS.UPDATE_LOBBY_SETTINGS,
                conf: changedSettings,
            });
        } catch (error) {
            console.error("Error applying lobby settings:", error);
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
        lobbySettings.value[key] = value;
    };

    /**
     * Initialize or update all lobby settings, creating deep clones to avoid reference issues
     * Also sets the appropriate game mode based on lobby configuration
     */
    const updateNestedLobbySettings = (lobbyInfo: LobbyInfo) => {
        // Skip update if settings are currently being modified
        if (isUpdatingSettings.value) return;

        // Use utility to clone lobby settings
        const { settings, originalSettings } = cloneLobbySettings(lobbyInfo);
        lobbySettings.value = settings;
        lobbySettingsOriginal.value = originalSettings;

        // Set game mode based on lobby settings
        if (lobbySettings.value) {
            try {
                const gameModeName = getGameModeFromSettings(lobbySettings.value.conf.mode);
                const gameMode = useGameMode();
                gameMode.updateGameMode(gameModeName);
            } catch (error) {
                console.error("Error setting game mode:", error);
            }
        }
    };

    // Export the store's public API
    return {
        // State
        lobbySettings,
        lobbySettingsOriginal,
        isUpdatingSettings,
        lobbyList,
        modifySettingsModal,

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
    };
});
