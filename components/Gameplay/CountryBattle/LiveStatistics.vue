<template>
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        <table class="w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    <th scope="col" class="px-6 py-3">Name</th>
                    <th scope="col" class="px-6 py-3">Lives</th>
                    <th scope="col" class="px-6 py-3">Distance</th>
                    <th scope="col" class="px-6 py-3">Score</th>
                </tr>
            </thead>
            <tbody>
                <!-- <TransitionGroup name="list" tag="tr"> -->
                <tr v-for="(player_data, player_id) in results" :key="player_id" class="bg-white border-b">
                    <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ player_id }}</th>
                    <td class="px-6 py-4">
                        <div v-for="life in total_attempts.get(player_id)" :key="life" style="display: inline-block">
                            <div v-if="player_data.lives >= life">
                                <SvgsHeartIcon class="svg-heart-icon" :color="'#FF0000'" />
                            </div>
                            <div v-else>
                                <SvgsHeartIcon class="svg-heart-icon" :color="'#8e7777'" />
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div v-if="player_data.player_countries?.length > 0" class="countries">
                            <div v-for="(country_code, id) in player_data.player_countries" :key="id">
                                <div class="flag" style="margin-right: 15px" :style="{ backgroundPosition: flag_map.get(country_code)?.x + 'px ' + flag_map.get(country_code)?.y + 'px' }"></div>
                            </div>
                        </div>
                        <div v-else>Waiting for first guess...</div>
                    </td>
                    <td class="px-6 py-4">{{ player_data.baseScr || 0 }}</td>
                </tr>
                <!-- </TransitionGroup> -->
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
export default {
    setup() {
        const results = useResults();
        const flag_map = useCountriesFlagMap();
        const total_attempts = ref(new Map<string | number, number>());
        const gameFlowManager = useGameFlowManager();

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
        watch(
            () => gameFlowManager.value?.currentState,
            (new_val) => (new_val === GameState.PLAYING ? createTotalAttempts() : null)
        );

        return { results, total_attempts, flag_map, processDistance };
    },
};
</script>

<style scoped>
.svg-heart-icon {
    width: 12px;
}

.countries {
    background-color: white;
    min-height: 35px;
    padding: 5px;
    border-radius: 5px;

    color: black;

    display: flex;
    justify-content: center;
}

.flag {
    width: 32px;
    height: 24px;
    background-image: url("/images/flags32.webp");

    border-radius: 5px;
}
/* Live statistics animation */
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
.list-leave-active {
    position: absolute;
}
</style>
