<template>
    <div class="statistics">
        <div class="table__row winner">
            <div class="table__row-element" style="flex: 10%">Place</div>
            <div class="table__row-element" style="flex: 20%"><span>Name</span></div>
            <div class="table__row-element" style="flex: 20%">&nbsp;</div>
            <div class="table__row-element">Score</div>
        </div>
        <div>
            <TransitionGroup name="list">
                <div v-for="(value, player_id, index) in total_results" :key="player_id" class="table__row" :class="[index === 0 ? 'winner' : '', index === 1 ? 'second' : '', index === 2 ? 'third' : '']">
                    <div class="table__row-element" style="flex: 10%">
                        <SvgsTrophyIcon :color="trophy_color[index]" width="30" />
                    </div>
                    <div class="table__row-element" style="flex: 20%">
                        <div class="player-name">
                            {{ getPlayerNameFromID(player_id) }}
                        </div>
                    </div>
                    <div class="table__row-element" style="flex: 20%">
                        <SvgsUserIcon :color="getPlayerColorByID(player_id)" :width="20" />
                    </div>
                    <div class="table__row-element"><HelpersAnimateScore :startAmount="0" :endAmount="value.total" :duration="3" separator="" :autoinit="true" /></div>
                    <!-- <PowerupDuel v-if="setting_store.lobby_settings.powerups[1] == true" :player_id="value[0]" /> -->
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<script>
export default {
    setup() {
        const trophy_color = ["gold", "silver", "#CD7F32"];
        const total_results = useTotalResults();

        return { trophy_color, total_results };
    },
};
</script>

<style scoped>
.statistics {
    background-color: var(--primary-color);
    border-radius: 5px;

    color: var(--primary-color-text);
}
.table__row {
    display: flex;

    padding: 10px;
    margin: auto;
    margin-bottom: 10px;

    width: 85%;

    position: relative;
}

.table__row-element {
    flex: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    margin: 0px 10px;

    margin: auto;
}

.player-name {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    max-width: 150px;
}

.winner {
    width: 95%;
}

.second {
    width: 92.5%;
}

.third {
    width: 90%;
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
