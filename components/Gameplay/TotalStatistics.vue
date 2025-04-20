<template>
    <div class="statistics bg-gradient-to-b from-slate-50/90 to-slate-100/80 dark:from-slate-800/90 dark:to-slate-900/80 rounded-xl shadow-lg backdrop-blur-sm">
        <div class="table__header rounded-t-lg bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white px-4 py-2 mb-2 font-semibold text-sm md:text-base">
            <div class="table__row-element text-center">#</div>
            <div class="table__row-element flex-grow text-left">Player</div>
            <div class="table__row-element text-right">Total Score</div>
        </div>

        <div class="leaderboard-container max-h-[400px] overflow-y-auto pr-1">
            <TransitionGroup name="list">
                <div
                    v-for="(value, player_id, index) in resultsStore.totalResults"
                    :key="player_id"
                    :class="[
                        'table__row p-3 md:p-4 mb-2 rounded-lg transition-all duration-200 hover:translate-x-1',
                        index === 0
                            ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-l-4 border-yellow-500 dark:from-yellow-700/30 dark:to-amber-700/30'
                            : index === 1
                              ? 'bg-gradient-to-r from-slate-300/20 to-slate-400/20 border-l-4 border-slate-400 dark:from-slate-600/30 dark:to-slate-500/30'
                              : index === 2
                                ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/20 border-l-4 border-amber-800 dark:from-amber-800/30 dark:to-amber-900/30'
                                : 'bg-white/50 dark:bg-slate-800/50',
                    ]"
                >
                    <div class="table__row-element flex items-center justify-center">
                        <div
                            :class="[
                                'flex items-center justify-center w-8 h-8 rounded-full',
                                index === 0
                                    ? 'bg-yellow-500 text-yellow-900'
                                    : index === 1
                                      ? 'bg-slate-300 text-slate-700'
                                      : index === 2
                                        ? 'bg-amber-800 text-amber-100'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
                            ]"
                        >
                            <span v-if="index <= 2">
                                <SvgsTrophyIcon :color="trophyColor[index]" class="w-5 lg:w-6" />
                            </span>
                            <span v-else class="font-bold">{{ index + 1 }}</span>
                        </div>
                    </div>

                    <div class="table__row-element flex-grow">
                        <div class="flex items-center">
                            <SvgsUserIcon :color="getPlayerColorByID(player_id)" class="mr-2 w-4 lg:w-5" />
                            <div class="font-medium text-slate-800 dark:text-slate-100">
                                {{ getPlayerNameFromID(player_id) }}
                            </div>
                        </div>
                    </div>

                    <div class="table__row-element text-right">
                        <div class="px-3 py-1 rounded-full bg-blue-600/10 dark:bg-blue-500/20">
                            <HelpersAnimateScore
                                :startAmount="0"
                                :endAmount="value.total"
                                :duration="3"
                                separator=""
                                :autoinit="true"
                                class="font-bold text-blue-700 dark:text-blue-400"
                            />
                        </div>
                    </div>
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup lang="ts">
const trophyColor = ["gold", "silver", "#CD7F32"];
const resultsStore = useResultsStore();
</script>

<style scoped>
.statistics {
    border-radius: 0.75rem;
}

.table__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table__row-element {
    flex: 1;
}

.table__row-element:first-child {
    flex: 0 0 40px;
}

.table__row-element:last-child {
    flex: 0 0 100px;
}

/* Custom scrollbar */
.leaderboard-container::-webkit-scrollbar {
    width: 6px;
}

.leaderboard-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
}

.leaderboard-container::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 10px;
}

/* LIVE STATS ANIMATION LIST */
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
    position: absolute;
}
</style>
