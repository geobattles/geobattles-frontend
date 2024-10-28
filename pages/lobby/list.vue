<template>
    <div>
        <Header />
        <Panel class="main-content">
            <DataTable :value="Object.values(useLobbyList().value)" class="text-xs md:text-base" size="small" :loading="is_table_loading">
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
                        <Button @click="handleJoinLobbyClick(slotProps.data.ID)" label="Join" size="small" />
                    </template>
                </Column>
            </DataTable>
        </Panel>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const is_table_loading = ref(false);
        const auth = useAuthenticationService().value;

        const handleJoinLobbyClick = async (lobby_id: string) => {
            if (!auth.isPlayerAuthenticated()) {
                return window.alert("Please log in before joining a lobby!");
            }

            try {
                await checkIfLobby(lobby_id);
                await joinLobby(lobby_id);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.log(error.message);
                }
            }
        };

        const handleRefreshClick = async () => {
            is_table_loading.value = true;
            await fetchLobbyList();
            is_table_loading.value = false;
        };

        return { is_table_loading, handleJoinLobbyClick, handleRefreshClick };
    },
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
