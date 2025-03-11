<template>
    <div class="text-xs">
        <TransitionGroup name="list" tag="ul" class="flex flex-col gap-1 lg:gap-1">
            <div v-for="(value, index) in resultsStore.liveResults" :key="index">
                <div class="table__row" :id="index.toString()">
                    <!-- Player Information -->
                    <div class="table__row-element">
                        <div class="player-name">
                            {{ getPlayerNameFromID(index) }}
                        </div>
                        <div>
                            <SvgsUserIcon class="svg-user-icon h-4" :color="getPlayerColorByID(index)" />
                        </div>
                    </div>

                    <!-- Lives Display -->
                    <div class="table__row-element">
                        <div>Lives</div>
                        <div class="flex gap-0 lg:gap-1 m-auto">
                            <div v-for="life in totalAttempts.get(index)" :key="life">
                                <SvgsHeartIcon class="svg-heart-icon h-4" :color="value.lives >= life ? 'var(--p-red-500)' : 'var(--p-gray-400)'" />
                            </div>
                        </div>
                    </div>

                    <!-- Distance Display -->
                    <div class="table__row-element distance" style="flex: 35%">
                        <div>Distance</div>
                        <div class="value m-auto">
                            {{ formatDistance(value.distance) }}
                        </div>
                    </div>

                    <!-- Score Display -->
                    <div class="table__row-element score">
                        <div>Score</div>
                        <div class="value m-auto">
                            {{ value.baseScr || 0 }}
                        </div>
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script lang="ts">
import { GameState } from "~/types/appTypes";
import type { WatchStopHandle } from "vue";

export default {
    setup() {
        const resultsStore = useResultsStore();
        const totalAttempts = ref(new Map<string | number, number>());
        const gameMode = useGameMode();
        let gameStateWatcher: WatchStopHandle | null = null;

        /**
         * Format distance for display in results table.
         * @param distance Distance in meters.
         * @returns Formatted distance in meters or kilometers.
         */
        const formatDistance = (distance: number | undefined): string => {
            if (!distance) return "--"; // No guess yet from player

            const isMeters = distance < 1000;
            const formattedDistance = isMeters ? distance : distance / 1000;

            return `${Math.round(formattedDistance * 10) / 10} ${isMeters ? "m" : "km"}`;
        };

        /**
         * Initialize total attempts for every player at the start of each round.
         */
        const initializeTotalAttempts = () => {
            for (const player_id in resultsStore.liveResults) totalAttempts.value.set(player_id, resultsStore.liveResults[player_id].lives);
        };

        onMounted(() => {
            // Setup watcher when component is mounted
            gameStateWatcher = watch(
                () => gameMode.modeLogic.currentState,
                (newVal) => {
                    if (newVal === GameState.PLAYING) {
                        initializeTotalAttempts();
                    }
                }
            );
        });

        onUnmounted(() => {
            // Clean up watcher when component is unmounted
            if (gameStateWatcher) {
                gameStateWatcher();
            }
        });

        return {
            resultsStore,
            totalAttempts,
            getPlayerColorByID,
            formatDistance,
            getPlayerNameFromID,
        };
    },
};
</script>

<style scoped>
.table__row {
    height: 45px;
    padding: 3px 6px;

    display: flex;
    justify-content: space-around;
    align-items: center;

    z-index: 3;
    border-radius: 4px;
    background: linear-gradient(to right, var(--p-blue-400) 50%, var(--surface-background) 50%);
    background-size: 200% 100%;
    background-position: right bottom;
    transition: all 0.4s ease-out;

    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.9);
}

.table__row-element {
    flex: 25%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    z-index: 3;

    overflow-x: hidden;
}

.score .value {
    font-weight: 600;
    color: var(--p-primary-600);
    font-size: 1rem;
}

/* Applied Guess Row Style */
.applied-guess {
    background: linear-gradient(to right, var(--p-blue-400) 50%, var(--surface-background) 50%);
    background-size: 200% 100%;
    background-position: left;
}

.applied-guess-lead {
    background: linear-gradient(to right, var(--p-green-400) 50%, var(--surface-background) 50%);
    background-size: 200% 100%;
    background-position: left;
}

/* Live Stats Animation */
.list-move,
.list-enter-active,
.list-leave-active {
    transition: all 0.4s ease-out;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(45px);
}

.list-leave-active {
    position: absolute;
}

/* Mobile View */
@media (max-width: 1000px) {
    .statistics {
        min-width: 180px;
    }

    .table__row {
        height: 28px;
        font-size: 8px;
    }

    .player-name {
        font-size: 7px;
    }

    .svg-user-icon {
        width: 8px;
    }

    .svg-heart-icon {
        width: 7px;
    }

    .distance .value {
        font-size: 7px;
    }

    .score {
        font-size: 7px;
    }

    .score .value {
        font-size: 8px;
    }
}
</style>
