<template>
    <div class="statistics">
        <div class="table__row winner">
            <div class="table__row-element">Place</div>
            <div class="table__row-element"><span>Name</span></div>
            <div class="table__row-element">Score</div>
        </div>
        <div>
            <TransitionGroup name="list">
                <div v-for="(value, player_id, index) in resultsStore.totalResults" :key="player_id" class="table__row p-2 md:p-2.5">
                    <div class="table__row-element">
                        <SvgsTrophyIcon :color="trophyColor[index]" class="w-4 lg:w-6" />
                    </div>
                    <div class="table__row-element">
                        <div class="flex">
                            <SvgsUserIcon :color="getPlayerColorByID(player_id)" class="mr-2 w-3 lg:w-5" />
                            <div>
                                {{ getPlayerNameFromID(player_id) }}
                            </div>
                        </div>
                    </div>
                    <div class="table__row-element">
                        <HelpersAnimateScore :startAmount="0" :endAmount="value.total" :duration="3" separator="" :autoinit="true" />
                    </div>
                    <!-- <PowerupDuel v-if="setting_store.lobby_settings.powerups[1] == true" :player_id="value[0]" /> -->
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<script>
export default {
    setup() {
        const trophyColor = ["gold", "silver", "#CD7F32"];
        const resultsStore = useResultsStore();

        return { trophyColor, resultsStore };
    },
};
</script>

<style scoped>
.statistics {
    border-radius: 5px;
}

.table__row {
    display: flex;
    justify-content: space-between;
}

/* LIVE STATS ANIMATION LIST */
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
    transition: all 0.8s linear;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(45px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
    position: absolute;
}
</style>
