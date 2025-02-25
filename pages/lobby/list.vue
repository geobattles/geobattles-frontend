<template>
    <div>
        <Toast />
        <Header />
        <Panel class="main-content">
            <DataTable :value="Object.values(lobbyStore.lobbyList)" class="text-xs md:text-base" size="small" :loading="is_table_loading">
                <template #header>
                    <div class="flex align-items-center">
                        <span class="text-xl font-bold">Active Lobbies</span>
                        <Button @click="handleRefreshClick" icon="pi pi-refresh" rounded raised style="width: 30px; height: 30px; margin-left: auto" />
                    </div>
                </template>
                <Column field="conf.name" header="Name"></Column>
                <Column field="conf.maxPlayers" header="Max. Players"></Column>
                <Column field="numPlayers" header="Online"></Column>
                <Column header="" style="text-align: right">
                    <template #body="slotProps">
                        <Button @click="handleJoinLobbyClick(slotProps.data.ID)" :loading="isJoiningLobby" label="Join" size="small" />
                    </template>
                </Column>
            </DataTable>
        </Panel>
    </div>
</template>

<script setup lang="ts">
const is_table_loading = ref(false);
const isJoiningLobby = ref(false);
const toast = useToast();

// External services
const { fetchLobbyList, checkIfLobby, joinLobby } = useLobbyStore();
const lobbyStore = useLobbyStore();
const auth = useAuthStore();
const isLoginDialogVisible = useIsLoginDialogVisible();

const handleJoinLobbyClick = async (lobby_id: string) => {
    if (!auth.isAuthenticated) return (isLoginDialogVisible.value = true);
    isJoiningLobby.value = true;

    try {
        await checkIfLobby(lobby_id);
        await joinLobby(lobby_id);
    } catch (error: unknown) {
        if (error instanceof Error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: error.message,
                life: 3000,
            });
        }
    } finally {
        isJoiningLobby.value = false;
    }
};

const handleRefreshClick = async () => {
    is_table_loading.value = true;
    await fetchLobbyList();
    is_table_loading.value = false;
};
</script>

<style scoped>
.main-content {
    max-width: 800px;
    margin: auto;
    background-color: var(--p-panel-background);

    margin-top: 3%;
}
</style>
