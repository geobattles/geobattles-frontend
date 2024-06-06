<template>
    <div class="statistics">
        <TransitionGroup name="list" tag="ul">
            <div v-for="(value, index) in results" :key="index">
                <div class="table__row list-item" :id="index.toString()">
                    <div class="table__row-element user-avatar" style="flex-direction: row">
                        <SvgsUserIcon class="svg-user-icon" style="margin: auto" :color="getPlayerColorByID(index)" />
                    </div>
                    <div class="table__row-element">
                        <div class="player-name">
                            {{ getPlayerNameFromID(index) }}
                        </div>
                        <div style="display: block; margin-top: -8px">
                            <div v-for="life in total_attempts.get(index)" :key="life" style="display: inline-block">
                                <div v-if="value.lives >= life">
                                    <SvgsHeartIcon class="svg-heart-icon" :color="'#FF0000'" />
                                </div>
                                <div v-else>
                                    <SvgsHeartIcon class="svg-heart-icon" :color="'#8e7777'" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="table__row-element distance">
                        <div class="header">Distance:</div>
                        <div class="value">
                            {{ processDistance(value.distance) }}
                        </div>
                    </div>
                    <div class="table__row-element score">
                        <div class="header">Score:</div>
                        <span class="value"> {{ value.baseScr || 0 }}</span>
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const results = useResults();
        const game_flow = useGameFlow();
        const total_attempts = ref(new Map<string | number, number>());

        /**
         * Process distance to display in results table
         * @param distance Distance in meters
         * @returns Distance in meters or km
         */
        const processDistance = (distance: number | undefined): string => {
            if (!distance) return "--"; // This means no guess yet from player
            const distanceInMeters = distance < 1000 ? distance : distance / 1000; // Convert to km unit if neccesary
            return `${Math.round(distanceInMeters * 10) / 10} ${distance < 1000 ? "m" : "km"}`; // Return distance in corret units
        };

        /**
         * Function creates total attempts constant variable for every player
         * at the start of every round. This is used to display lives in results table.
         */
        const createTotalAttempts = () => {
            // Create an array map of total lives for every player
            for (const player_id in results.value) total_attempts.value.set(player_id, results.value[player_id].lives);
        };

        // Watch game flow to create total attempts
        watch(game_flow, (new_val) => (new_val === "PLAYING" ? createTotalAttempts() : null));

        return { results, total_attempts, getPlayerColorByID, processDistance, getPlayerNameFromID };
    },
};
</script>

<style scoped>
.statistics {
    background-color: var(--bluegray-900);
    z-index: 4;

    border-radius: 10px;
    padding: 10px;

    position: absolute;
    top: 5rem;
    right: 1rem;

    max-height: 800px;
    min-width: 400px;
    max-width: 450px;
}

.table__row {
    height: 45px;

    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    z-index: 3;

    color: var(--text-color);

    border-radius: 4px;
    margin-bottom: 10px;
    overflow: hidden;

    /* For applied guess animation */
    background: linear-gradient(to right, var(--bluegray-400) 50%, var(--surface-card) 50%);
    background-size: 200% 100%;
    background-position: right bottom;
    transition: all 0.4s ease-out;
}

.table__row-element {
    height: 100%;
    flex: 25%;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    position: relative;
    z-index: 3;
}

.user-avatar {
    flex: 15%;
}

.svg-user-icon {
    width: 20px;
}

.svg-heart-icon {
    width: 14px;
    margin-right: 2px;
}

.player-name {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    max-width: 100px;
}

.distance {
    font-size: 1rem;
}

.distance .value {
    font-size: 1rem;
    margin-bottom: 4px;
}

.score .value {
    font-size: 1rem;
    margin-bottom: 4px;
}

.score .value {
    font-size: 1rem;
    letter-spacing: 1px;
    font-weight: 700;

    color: #00a708;
}
/* APPLIED GUESS ROW STYLE */
.applied-guess {
    background: linear-gradient(to right, var(--bluegray-400) 50%, var(--surface-card) 50%);
    background-size: 200% 100%;
    width: 100%;

    background-position: left;
}

.applied-guess-lead {
    background: linear-gradient(to right, #00dc82 50%, var(--surface-card) 50%);
    background-size: 200% 100%;
    width: 100%;

    background-position: left;
}

.player-icon {
    width: 18px;
    height: 18px;
}

/* LIVE STATS ANIMATION LIST */
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
    transition: all 0.4s ease-out;
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

/* MOBILE VIEW */
@media (max-width: 1000px) {
    .statistics {
        padding: 5px;

        min-width: 150px;
    }
    .table__row {
        height: 25px;
        font-size: 8px;
        margin-bottom: 3px;
    }
    .player-name {
        font-size: 8px;
    }
    .svg-user-icon {
        width: 10px;
    }
    .svg-heart-icon {
        width: 6px;
        margin-right: 0.5px;
    }
    .distance {
        font-size: 8px;
    }
    .distance .value {
        font-size: 8px;
    }
    .distance span {
        font-size: 8px;
    }
    .score {
        font-size: 8px;
    }
    .score .value {
        font-size: 8px;
    }
}
</style>
