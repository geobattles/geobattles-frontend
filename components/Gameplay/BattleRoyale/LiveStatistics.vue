<template>
    <div class="text-xs">
        <!-- Table Header -->
        <div class="table__header">
            <div class="table__header-element">Player</div>
            <div class="table__header-element">Attempts</div>
            <div class="table__header-element distance" style="flex: 35%">Distance</div>
            <div class="table__header-element score">Score</div>
        </div>

        <TransitionGroup name="list" tag="ul" class="flex flex-col gap-1 lg:gap-1">
            <div v-for="(value, index) in resultsStore.liveResults" :key="index">
                <div v-if="isPlayerConnected(index)" class="table__row" :id="index.toString()">
                    <!-- Player Information -->
                    <div class="table__row-element">
                        <div class="player-name">
                            {{ getPlayerNameFromID(index) }}
                        </div>
                        <div>
                            <SvgsUserIcon class="svg-user-icon h-4" :color="getPlayerColorByID(index)" />
                        </div>
                    </div>

                    <!-- Attempts Display -->
                    <div class="table__row-element">
                        <!-- Display number of attempts and a bullseye icon -->
                        <div class="flex items-center justify-center gap-1 m-auto">
                            <span class="font-semibold text-sm">{{ value.lives }}</span>
                            <i class="pi pi-map-marker text-sm lg:text-xl text-green-400 dark:text-green-400 !fill-[#243c5a]"></i>
                        </div>
                    </div>

                    <!-- Distance Display -->
                    <div class="table__row-element distance" style="flex: 35%">
                        <div class="value m-auto">
                            {{ formatDistance(value.distance) }}
                        </div>
                    </div>

                    <!-- Score Display -->
                    <div class="table__row-element score">
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
export default {
    setup() {
        const resultsStore = useResultsStore();
        const lobbyStore = useLobbyStore();

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

        const isPlayerConnected = (playerID: string | number): boolean => {
            if (lobbyStore.lobbySettings?.playerList[playerID].connected) return true;
            return false;
        };

        return {
            resultsStore,
            getPlayerColorByID,
            formatDistance,
            getPlayerNameFromID,
            isPlayerConnected,
        };
    },
};
</script>

<style scoped>
.table__header {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 3px 6px;
    margin-bottom: 4px; /* Add some space below the header */
    font-weight: 600;
    color: var(--text-color-secondary); /* Use secondary text color */
    border-bottom: 1px solid var(--surface-border); /* Add a subtle border */

    background-color: var(--surface-background); /* Use background color */
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Add a subtle shadow */
}

.table__header-element {
    flex: 25%;
    text-align: center;
}

.table__row {
    height: 40px;
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
    justify-content: center;
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

    .table__header {
        font-size: 8px;
        padding: 2px 6px;
    }
}
</style>
