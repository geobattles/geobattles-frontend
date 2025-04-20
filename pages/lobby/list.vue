<template>
    <Header />
    <div class="lobby-list-container">
        <Toast />
        <Panel class="main-content">
            <template #header>
                <div class="flex items-center justify-between w-full">
                    <h1 class="text-lg md:text-xl lg:text-2xl font-bold">Active Lobbies</h1>
                    <div class="flex gap-2 ml-auto">
                        <Button @click="handleRefreshClick" icon="pi pi-refresh" rounded :loading="isTableLoading" />
                    </div>
                </div>
            </template>

            <div v-if="Object.values(lobbyStore.lobbyList).length === 0 && !isTableLoading" class="flex flex-col items-center justify-center py-12">
                <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">No Active Lobbies</h2>
                <p class="text-gray-500 mb-6 text-center">There are currently no active lobbies. Refresh to check again or create a new one!</p>
                <Button label="Create New Lobby" icon="pi pi-plus" @click="navigateToCreateLobby" severity="primary" />
            </div>

            <DataTable
                v-else
                :value="Object.values(lobbyStore.lobbyList)"
                class="w-full"
                stripedRows
                :loading="isTableLoading"
                paginator
                :rows="10"
                size="small"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 20]"
                :responsiveLayout="'scroll'"
            >
                <Column field="conf.name" header="Name" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <span class="font-medium">{{ data.conf.name }}</span>
                        </div>
                    </template>
                </Column>
                <Column header="Players" sortable sortField="numPlayers">
                    <template #body="{ data }">
                        <div class="flex items-center">
                            <i class="pi pi-users mr-2 text-blue-500"></i>
                            <span>{{ data.numPlayers }}/{{ data.conf.maxPlayers }}</span>
                        </div>
                    </template>
                </Column>
                <Column field="conf.rounds" header="Round" sortable>
                    <template #body="{ data }">
                        <span class="font-medium">{{ data.currentRound }}/{{ data.conf.numRounds }}</span>
                    </template>
                </Column>
                <Column header="Status">
                    <template #body="slotProps">
                        <Button
                            @click="handleJoinLobbyClick(slotProps.data.ID)"
                            :loading="isJoiningLobby === slotProps.data.ID"
                            :disabled="!isLobbyJoinableForCurrentuser(slotProps.data.ID)"
                            :label="isLobbyJoinableForCurrentuser(slotProps.data.ID) ? 'Join' : 'In Progress'"
                            :severity="isLobbyJoinableForCurrentuser(slotProps.data.ID) ? 'primary' : 'warn'"
                            :icon="isLobbyJoinableForCurrentuser(slotProps.data.ID) ? 'pi pi-sign-in' : 'pi pi-times'"
                            size="small"
                            variant="outlined"
                            class="md:!text-base !text-xs"
                        />
                    </template>
                </Column>
            </DataTable>
        </Panel>
    </div>
</template>

<script setup lang="ts">
const router = useRouter();
const isTableLoading = ref(false);
const isJoiningLobby = ref<string | null>(null);
const toast = useToast();

// External services
const { fetchLobbyList, checkIfLobby, joinLobby } = useLobbyStore();
const lobbyStore = useLobbyStore();
const authStore = useAuthStore();

/**
 * Handles the join lobby button click
 * @param lobby_id The ID of the lobby to join
 */
const handleJoinLobbyClick = async (lobby_id: string) => {
    await fetchLobbyList(); // Ensure the lobby list is up to date

    if (!authStore.isAuthenticated) {
        authStore.isLoginDialog = true;
        return;
    }

    if (!isLobbyJoinableForCurrentuser(lobby_id)) {
        toast.add({
            severity: "warn",
            summary: "Cannot Join",
            detail: "This game is already in progress.",
            life: 3000,
        });
        return;
    }

    isJoiningLobby.value = lobby_id;

    try {
        await checkIfLobby(lobby_id);
        await joinLobby(lobby_id);
        // Navigation to lobby page should happen automatically via websocket message handler
    } catch (error: unknown) {
        if (error instanceof Error) {
            toast.add({
                severity: "error",
                summary: "Error Joining Lobby",
                detail: error.message || "An unexpected error occurred.",
                life: 3000,
            });
        } else {
            toast.add({
                severity: "error",
                summary: "Error Joining Lobby",
                detail: "An unexpected error occurred.",
                life: 3000,
            });
        }
        console.error("Error joining lobby:", error);
    } finally {
        isJoiningLobby.value = null;
    }
};

/**
 * Refresh the lobby list
 */
const handleRefreshClick = async () => {
    isTableLoading.value = true;
    try {
        await fetchLobbyList();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error Refreshing",
            detail: "Could not fetch lobby list.",
            life: 3000,
        });
        console.error("Error fetching lobby list:", error);
    } finally {
        isTableLoading.value = false;
    }
};

/**
 * Navigate to the create lobby page
 */
const navigateToCreateLobby = () => {
    if (!authStore.isAuthenticated) {
        authStore.isLoginDialog = true;
        return;
    }
    try {
        lobbyStore.createLobby();
    } catch (error) {
        console.error("Failed to create lobby:", error);
        toast.add({
            severity: "error",
            summary: "Failed to create lobby",
            detail: error instanceof Error ? error.message : String(error),
            life: 5000,
        });
    }
};

const isLobbyJoinableForCurrentuser = (lobbyName: string) => {
    // Get player ID
    const playerID = usePlayerInfo().value.ID;

    // Lobby
    const lobby = lobbyStore.lobbyList[lobbyName];

    // Check round number
    if (lobby.currentRound > 0) {
        // Check if the player is already in the lobby
        const playerIDsInLobby = Object.keys(lobby.playerList || {});
        if (playerIDsInLobby.includes(playerID || "")) return true;
        return false;
    } else {
        return true;
    }
};

// Fetch lobby list on page load
onMounted(async () => {
    isTableLoading.value = true;
    try {
        await fetchLobbyList();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error Loading Lobbies",
            detail: "Could not fetch lobby list.",
            life: 3000,
        });
        console.error("Error fetching lobby list on mount:", error);
    } finally {
        isTableLoading.value = false;
    }
});
</script>

<style scoped>
.lobby-list-container {
    min-height: calc(100vh - 4rem); /* Adjust based on header height */
    padding: 1rem;
}

.main-content {
    max-width: 1000px;
    margin: auto;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .p-datatable {
        font-size: 0.8rem; /* Smaller font size on mobile */
    }
}

/* Style disabled button */
:deep(.p-button.p-disabled) {
    cursor: not-allowed !important;
    opacity: 0.6;
}
</style>
