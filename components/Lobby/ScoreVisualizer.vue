<template>
    <div class="card">
        <Chart type="line" :data="chartData" :options="chartOptions" class="h-[15rem]" />
    </div>
</template>

<script setup lang="ts">
// Define the props for the score factor and animation flag
const props = defineProps<{ scoreFactor: number; animate: boolean }>();

// Convert the Go function to JavaScript
const scoreDistance = (x: number, a: number) => {
    const score = Math.floor(5000 * Math.pow(0.999, (x / 1000 - a / 1000) * (0.2 + 30 * Math.pow(0.98, 10 * Math.pow(a, 0.6)))));
    return score > 5000 ? 5000 : score;
};

const chartData = ref();
const chartOptions = ref();

onMounted(() => {
    nextTick(() => {
        chartData.value = setChartData();
        chartOptions.value = setChartOptions();
    });
});

// Watch for changes to the scoreFactor prop and update the chart data
watch(
    () => props.scoreFactor,
    () => {
        nextTick(() => {
            chartData.value = setChartData();
        });
    }
);

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);

    // Create 1000 data points from 0 to 2_0000_000 aka. 20_000 km
    const distances = Array.from({ length: 1000 }, (_, i) => i * 20000); // Example distances from 0 to 200000
    const scores = distances.map((d) => scoreDistance(d, props.scoreFactor)); // Use the scoreFactor prop

    // Filter distances and scores to include only those with scores greater than 5
    const filteredData = distances.map((d, i) => ({ distance: d, score: scores[i] })).filter((data) => data.score > 0);

    return {
        labels: filteredData.map((data) => data.distance / 1000), // Convert distances to kilometers
        datasets: [
            {
                label: "Score vs Distance",
                data: filteredData.map((data) => data.score),
                fill: false,
                borderColor: documentStyle.getPropertyValue("--p-primary-500"),
                borderWidth: 4, // Add this property to make the line thicker (adjust value as needed)
                tension: 0.4,
                pointRadius: 0, // Remove circles or dots around the points
            },
        ],
    };
};

const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: {
                labels: {
                    boxWidth: 30, // Adjust the width of the legend box
                    boxHeight: 3, // Adjust the height of the legend box
                    // padding: 10, // Adjust the padding around the legend labels
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        size: 10, // Adjust the font size for x-axis labels
                    },
                },
                grid: {
                    display: false, // Turn off grid lines for x-axis
                },
                title: {
                    display: true,
                    text: "Distance (km)",
                },
            },
            y: {
                ticks: {
                    font: {
                        size: 10, // Adjust the font size for y-axis labels
                    },
                },
                grid: {
                    display: true, // Turn off grid lines for y-axis
                    color: isDarkMode ? documentStyle.getPropertyValue("--p-gray-700") : documentStyle.getPropertyValue("--p-gray-200"),
                },
                title: {
                    display: true,
                    text: "Score > 0",
                },
            },
        },
        animation: {
            duration: props.animate ? 1000 : 0, // Set animation duration based on the animate prop
        },
    };
};
</script>

<style scoped></style>
