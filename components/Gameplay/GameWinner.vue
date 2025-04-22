<template>
    <div v-if="winnerData" class="game-winner-overlay">
        <div class="game-winner-card animate-celebration">
            <!-- Golden Trophy Icon -->
            <SvgsTrophyIcon color="gold" class="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 text-yellow-400" />

            <h2 class="text-3xl md:text-4xl font-bold mb-4 text-yellow-400">WINNER!</h2>
            <div class="flex items-center justify-center mb-6">
                <!-- Player Icon -->
                <SvgsUserIcon :color="getPlayerColorByID(winnerId || '')" class="w-16 h-16 md:w-20 md:h-20 mr-4" />
                <span class="text-2xl md:text-3xl font-semibold">{{ winnerData.name }}</span>
            </div>
            <p class="text-xl md:text-2xl">
                Score: <span class="font-bold text-green-400">{{ winnerData.score }}</span>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import confetti from "canvas-confetti";

// Define props to accept winnerId
const props = defineProps<{
    winnerId: string | null;
}>();

// Import necessary stores
const resultsStore = useResultsStore();

// Compute winner data based on winnerId
const winnerData = computed(() => {
    if (!props.winnerId) return null;

    // Get player details from lobbyStore based on ID
    const playerName = getPlayerNameFromID(props.winnerId);

    // Get score from resultsStore based on ID
    const playerScore = resultsStore.totalResults[props.winnerId]?.total;

    if (!playerName) return null; // Handle case where player info might not be available

    return {
        name: playerName, // Function to get player name from ID
        score: playerScore ?? 0, // Use score from results, default to 0 if not found
    };
});

// Trigger confetti on mount
onMounted(() => {
    confetti({
        particleCount: 250,
        spread: 120,
        origin: { y: 0.6 },
        zIndex: 1001, // Ensure confetti is above the overlay
        ticks: 300,
    });
});
</script>

<style scoped>
.game-winner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8); /* Darker overlay */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure it's above other content */
}

.game-winner-card {
    background: linear-gradient(to bottom right, var(--surface-background), var(--surface-background));
    padding: 2rem 3rem;
    border-radius: 1.5rem;
    text-align: center;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6);
    border: 2px solid var(--p-primary-500);
    min-width: 325px;
    max-width: 90%;
}

/* Simple celebration animation */
@keyframes celebration {
    0% {
        transform: scale(0.3) rotate(-15deg);
        opacity: 0;
    }
    60% {
        transform: scale(1.1) rotate(5deg);
        opacity: 1;
    }
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
}

.animate-celebration {
    animation: celebration 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; /* Smoother easing */
}
</style>
