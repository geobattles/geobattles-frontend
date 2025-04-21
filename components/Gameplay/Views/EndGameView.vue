<template>
    <div class="endgame-container">
        <div id="endgame-map-and-results">
            <div id="endgame-results-container" class="overflow-auto">
                <GameplayTotalStatistics class="text-xs lg:text-base p-2 md:p-4" />
            </div>
            <!-- Google Map Gets Appended here in ENDGAME -->
        </div>
        <div v-if="isPlayerAdmin()" class="endgame-menu-container" :class="[uiManager.isVertical ? 'w-full' : 'w-1/2']">
            <Button
                type="button"
                label="New Game"
                severity="primary"
                icon="pi pi-play-circle"
                variant="outlined"
                size="large"
                @click="useWebSocketStore().sendMessage({ command: SOCKET_COMMANDS.START })"
                pt:root:class="!text-xs lg:!text-base"
            />
            <Button
                type="button"
                label="Settings"
                severity="info"
                icon="pi pi-cog"
                variant="outlined"
                @click="lobbyStore.modifySettingsModal = !lobbyStore.modifySettingsModal"
                pt:root:class="!text-xs lg:!text-base"
            />
            <LobbyLeave @click="handleClickLeaveLobby" />
        </div>
        <div v-else class="endgame-menu-container" :class="[uiManager.isVertical ? 'w-full' : 'w-1/2']">
            <div class="flex gap-3">
                <div class="flex flex-col justify-center">
                    <Tag class="text-center" severity="danger">GAME OVER</Tag>
                    <p class="text-xs lg:text-base">Admin can start next game!</p>
                </div>
                <LobbyLeave @click="handleClickLeaveLobby" />
            </div>
        </div>
        <div></div>
        <Dialog v-model:visible="lobbyStore.modifySettingsModal" header="Lobby Settings" modal class="m-3" :style="{ width: '95%' }">
            <LobbyModifySettings />
        </Dialog>
        <!-- Display the Game Winner component -->
        <GameWinner v-if="showWinner" :winner-id="winnerId" />
    </div>
</template>

<script setup lang="ts">
import { GameState } from "~/types/appTypes";

const emit = defineEmits(["leaveLobby"]);

// External services
const lobbyStore = useLobbyStore();
const resultsStore = useResultsStore();
const { isPlayerAdmin } = useLobbyStore();
const uiManager = useUIManagerStore();
const gameMode = useGameMode();

const showWinner = ref(false);

// Compute the winner ID based on the results store
const winnerId = computed<string | null>(() => {
    const totalResults = resultsStore.totalResults;
    let topPlayerId: string | null = null;
    let maxScore = -Infinity;

    for (const playerId in totalResults) {
        const result = totalResults[playerId];
        if (result && result.total !== undefined && result.total > maxScore) {
            maxScore = result.total;
            topPlayerId = playerId;
        }
    }
    return topPlayerId;
});

// Show the winner component after a delay when the game state becomes FINISHED
watchEffect(() => {
    if (gameMode.modeLogic.currentState === GameState.FINISHED) {
        setTimeout(() => {
            showWinner.value = true;
            setTimeout(() => {
                showWinner.value = false; // Hide the winner after 5 seconds
            }, 5000);
        }, 500); // 0.5-second delay
    } else {
        // Reset if the state changes away from FINISHED (e.g., new game starts)
        showWinner.value = false;
    }
});

// Handle leaving the lobby
const handleClickLeaveLobby = () => emit("leaveLobby");
</script>

<style>
.endgame-container {
    position: relative;
    height: 100dvh;
    width: 100dvw;

    overflow: hidden;
}

.endgame-menu-container {
    position: absolute;
    bottom: 0;
    right: 0;

    background-color: var(--p-content-background); /* Use the root background color variable */
    padding: 8px 0px;

    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
}
</style>
