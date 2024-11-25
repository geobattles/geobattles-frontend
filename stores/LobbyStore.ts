// stores/LobbyStore.ts
import type { LobbyInfo, Results, TotalResults } from "~/types/appTypes";
import { useWebSocketStore } from "~/stores/WebSocketStore";

export const useLobbyStore = defineStore("lobby", () => {
    // Lobby settings states
    const lobbySettings = ref<LobbyInfo | null>(null);
    const lobbySettingsOriginal = ref<LobbyInfo | null>(null);

    // Lobby list state
    const lobbyList = ref<string[]>([]);
    const modifySettingsModal = ref<boolean>(false); // Modify settings modal (show or hide modal to change lobby settings)

    // Results states
    // const liveResults = ref<Results>({} as Results);
    // const totalResults = ref<TotalResults>({} as TotalResults);

    /**
     * Create a new lobby. It will make a post request to the backend.
     * If successful, it will initialize a WebSocket connection to the lobby and redirect to the lobby page.
     * If unsuccessful, it will throw an error.
     *
     * @throws {Error} If failed to create lobby
     * @returns {Promise<void>} Void promise
     */
    const createLobby = async (): Promise<void> => {
        const playerInfo = usePlayerInfo();
        const router = useRouter();
        const auth = useAuthenticationService().value;
        const socketStore = useWebSocketStore();

        const lobbyPostParams = {
            name: `${playerInfo.value.displayName}'s Lobby`,
            roundTime: 100,
        };

        try {
            // Make authenticated post request to create lobby
            const authToken = auth.getToken();
            const response = await fetch(`${useBackendAPI().value}/lobby`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${authToken}`,
                },
                body: JSON.stringify(lobbyPostParams),
            });

            // Check if response is ok
            if (!response.ok) throw new Error(`Failed to create lobby: ${response.statusText}`);
            lobbySettings.value = await response.json();

            // Initialize WebSocket connection to created lobby
            if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
            await socketStore.initWebSocket(lobbySettings.value.ID);

            // Redirect to lobby page
            await router.push({ path: `/lobby/${lobbySettings.value.ID}` });
        } catch (error) {
            console.error("Error creating lobby:", error);
            throw error;
        }
    };

    const joinLobby = async (lobbyId: string) => {
        const router = useRouter();
        const socketStore = useWebSocketStore();

        try {
            // Initialize WebSocket connection to lobby
            socketStore.initWebSocket(lobbyId);

            // Redirect to lobby page
            router.push({ path: `/lobby/${lobbyId}` });
        } catch (error) {
            console.error("Error joining lobby:", error);
            throw new Error("Could not connect to a lobby.");
        }
    };

    const leaveLobby = () => {
        const socketStore = useWebSocketStore();
        try {
            socketStore.closeConnection();
        } catch (error) {
            console.error("Error leaving lobby:", error);
            throw new Error("Could not leave lobby.");
        }
    };

    const joinedLobby = (lobbyInfo: LobbyInfo, userId: string) => {
        updateNestedLobbySettings(lobbyInfo);

        if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
        if (lobbySettings.value.conf.ccList.length === 0) {
            lobbySettings.value.conf.ccList = useCountryList().value;
        }
        console.log(`Player ${userId} joined the lobby!`);
    };

    const leftLobby = (lobbyInfo: LobbyInfo, userId: string) => {
        const liveResults = useLiveResults();
        const totalResults = useTotalResults();

        updateNestedLobbySettings(lobbyInfo);
        if (liveResults.value[userId]) {
            delete liveResults.value[userId];
        }
        if (totalResults.value[userId]) {
            delete totalResults.value[userId];
        }
    };

    const fetchLobbySettings = (lobbyInfo: LobbyInfo) => {
        if (!lobbyInfo) return console.error("Lobby info is not initialized");
        updateNestedLobbySettings(lobbyInfo);

        if (!lobbySettings.value) return console.error("Country list is not initialized");
        if (lobbySettings.value.conf.ccList.length === 0) {
            lobbySettings.value.conf.ccList = useCountryList().value;
        }
    };

    const applyLobbySettings = () => {
        const socketStore = useWebSocketStore();
        const ls = lobbySettings.value;
        const lso = lobbySettingsOriginal.value;
        if (!ls || !lso) return console.error("Lobby settings are not initialized");

        //@ts-ignore If ccList is empty (=wrong input) dont send it so it wont update on server. Empty arrray if every country is selected
        if (ls.conf.ccList.length === 0) delete lso.conf.ccList;
        else if (ls.conf.ccList.length === useCountryList().value.length) ls.conf.ccList = [];

        // If objects are equal delete them from original settings, else update original settings
        for (const field in lso.conf) {
            //@ts-ignore  Nested objects (ccList) are always different so they are stringified and compared as such
            if (typeof lso.conf[field] === "object") {
                //@ts-ignore
                if (JSON.stringify(lso.conf[field]) === JSON.stringify(ls.conf[field])) delete lso.conf[field]; //@ts-ignore
                else lso.conf[field] = ls.conf[field];
            } else {
                //@ts-ignore
                if (lso.conf[field] === ls.conf[field]) delete lso.conf[field]; //@ts-ignore
                else lso.conf[field] = ls.conf[field];
            }
        }

        const settings = {
            command: "update_lobby_settings",
            conf: { ...lso.conf },
        };

        socketStore.sendMessage(settings);
    };

    const updateLobbySetting = <K extends keyof LobbyInfo["conf"]>(key: K, value: LobbyInfo["conf"][K]) => {
        if (!lobbySettings.value) return console.error("Lobby settings are not initialized");
        lobbySettings.value.conf[key] = value;
    };

    const updateNestedLobbySettings = (lobbyInfo: LobbyInfo) => {
        lobbySettings.value = structuredClone(lobbyInfo);
        lobbySettings.value.conf = structuredClone(lobbyInfo.conf);
        lobbySettingsOriginal.value = structuredClone(lobbyInfo);
        lobbySettingsOriginal.value.conf = structuredClone(lobbyInfo.conf);

        const gameFlowManager = useGameFlowManager().value;
        if (gameFlowManager) {
            if (lobbySettings.value.conf.mode === 1) {
                gameFlowManager.updateGameMode("BattleRoyale");
            } else if (lobbySettings.value.conf.mode === 2) {
                gameFlowManager.updateGameMode("CountryBattle");
            } else {
                console.warn("Unknown game mode");
            }
        }
    };

    const fetchLobbyList = async () => {
        const response = await fetch(`${useBackendAPI().value}/lobby`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        } else {
            lobbyList.value = await response.json();
        }
    };

    const checkIfLobby = async (lobbyId: string) => {
        await fetchLobbyList();
        if (!lobbyList.value.includes(lobbyId)) throw new Error("Lobby does not exist");
    };

    const isPlayerAdmin = () => {
        if (!lobbySettings.value) return false;
        return lobbySettings.value.admin === usePlayerInfo().value.ID;
    };

    return {
        lobbySettings,
        lobbySettingsOriginal,
        lobbyList,
        modifySettingsModal,
        createLobby,
        joinLobby,
        leaveLobby,
        joinedLobby,
        leftLobby,
        fetchLobbySettings,
        applyLobbySettings,
        updateLobbySetting,
        fetchLobbyList,
        checkIfLobby,
        isPlayerAdmin,
    };
});
