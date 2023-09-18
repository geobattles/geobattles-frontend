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
                <tr v-for="(value, index) in results" :key="index" class="bg-white border-b">
                    <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ index }}</th>
                    <td class="px-6 py-4">{{ value.lives }}</td>
                    <td class="px-6 py-4">{{ processDistance(value.distance) }}</td>
                    <td class="px-6 py-4">{{ value.baseScr || 0 }}</td>
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

        const processDistance = (distance: number | undefined): string => {
            if (!distance) return "--"; // This means no guess yet from player
            const distanceInMeters = distance < 1000 ? distance : distance / 1000; // Convert to km unit if neccesary
            return `${Math.round(distanceInMeters * 10) / 10} ${distance < 1000 ? "m" : "km"}`; // Return distance in corret units
        };

        return { results, processDistance };
    },
};
</script>

<style scoped>
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
