<template>
    <Panel header="Connected Players">
        <TransitionGroup name="list">
            <div v-for="(player, index) in lobbyStore.lobbySettings?.playerList" :key="index">
                <div v-if="player.connected" class="player">
                    <div class="flex flex-col">
                        <!-- Append admin star if player is admin. -->
                        <svg v-if="lobbyStore.lobbySettings?.admin === index" class="h-3 lg:h-4 m-auto" xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 256 256">
                            <path
                                d="M238.7 73.5a15.9 15.9 0 0 0-16.7-2.3l-50.6 22.5-29.4-53a16.1 16.1 0 0 0-28 0l-29.4 53L34 71.2a16 16 0 0 0-22.1 18.3l25.4 108.3a15.9 15.9 0 0 0 7.4 10.1 16.2 16.2 0 0 0 8.3 2.3 15.2 15.2 0 0 0 4.2-.6 265.5 265.5 0 0 1 141.5 0 16.5 16.5 0 0 0 12.5-1.7 15.6 15.6 0 0 0 7.4-10.1l25.5-108.3a16 16 0 0 0-5.4-16Z"
                            />
                        </svg>
                        <SvgsUserIcon :color="player.color" class="h-4 lg:h-5 m-auto" />
                    </div>
                    <div class="player-name">
                        {{ player.name }}
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </Panel>
</template>

<script setup lang="ts">
const lobbyStore = useLobbyStore();
</script>

<style scoped>
.player {
    padding: 5px 10px;
    margin-bottom: 5px;
    margin-top: 10px;

    display: flex;
    justify-content: space-between;
    align-items: center;

    letter-spacing: 1px;
    min-width: 0;
}

/* ANIMATE PLAYER LEAVE AND ENTER */
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease-out;
}
.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}
</style>
