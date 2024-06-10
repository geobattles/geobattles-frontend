<template>
    <div>
        <Header />
        <div class="main-content">
            <div class="lobby-table">
                <DataTable :value="Object.values(useLobbyList().value)" stripedRows size="small" style="font-size: 14px" :loading="is_table_loading">
                    <template #header>
                        <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                            <span class="text-xl text-900 font-bold">Active Lobbies</span>
                            <Button @click="handleRefreshClick" icon="pi pi-refresh" rounded raised style="width: 30px; height: 30px; margin-left: auto" />
                        </div>
                    </template>
                    <Column field="conf.name" header="Name"></Column>
                    <Column field="conf.maxPlayers" header="Max. Players"></Column>
                    <Column field="numPlayers" header="Online"></Column>
                    <Column field="conf.ID" header="" style="text-align: right">
                        <template #body="slotProps" style="width: 50%">
                            <Button @click="handleJoinLobbyClick(slotProps.data.ID)" label="Join" size="small" style="padding: 6px 14px; font-size: 12px" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const is_table_loading = ref(false);

        const handleJoinLobbyClick = async (lobby_id: string) => {
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
    text-align: center;
    width: 95%;
    max-width: 800px;

    margin: auto;
    border-radius: 10px;

    margin-top: 50px;
    background-color: var(--surface-card);
}

.lobby-table {
    padding: 20px;
}
</style>
