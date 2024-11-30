<template>
    <div class="game-container">
        <!-- Panorama -->
        <GameplayGooglePanorama id="panorama" class="google-panorama" />

        <!-- Connection Status -->
        <div class="connection-status">Connected</div>

        <!-- Results -->
        <div class="game-results">Results</div>

        <!-- Map (overlapping the Panorama) -->
        <div class="map-wrapper">
            <GameplayGoogleMap id="map" class="map-container" />
            <button class="submit-button">Submit Guess</button>
        </div>
    </div>
</template>

<script script lang="ts"></script>

<style scoped>
/* Game Container */
.game-container {
    position: relative; /* Enable absolute positioning for children */
    height: 100vh; /* Fullscreen height */
    width: 100vw; /* Fullscreen width */
}

/* Panorama (Fullscreen) */
.google-panorama {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1; /* Base layer */
}

/* Connection Status (Absolute) */
.connection-status {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10; /* Above panorama */
}

/* Results (Absolute) */
.game-results {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 16px;
    z-index: 10; /* Above panorama */
}

/* Wrapper for Map and Submit Button */
.map-wrapper {
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: flex;
    flex-direction: column; /* Stack Map and Button vertically */
    align-items: flex-start; /* Align items to the left */
    z-index: 20; /* Above panorama */
}

/* Map (Overlapping Bottom-Left) */
.map-container {
    width: 300px;
    height: 200px;
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid white;
    border-radius: 0px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: width 0.3s, height 0.3s; /* Smooth transition for hover effect */
}

/* Map Hover Effect */
.map-container:hover {
    width: 450px;
    height: 450px;
}

/* Submit Button Styling */
.submit-button {
    margin-top: 10px; /* Space between map and button */
    padding: 10px 20px;
    font-size: 16px;
    color: white;
    background-color: #007bff; /* Blue button */
    border: none;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background-color 0.3s;
}

.submit-button:hover {
    background-color: #0056b3; /* Darker blue on hover */
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .map-wrapper {
        left: 5px;
        bottom: 5px;
    }

    .map-container {
        width: 200px;
        height: 150px;
    }

    .submit-button {
        font-size: 14px;
        padding: 8px 16px;
    }

    .game-results {
        padding: 5px;
        font-size: 14px;
    }

    .connection-status {
        font-size: 12px;
    }
}
</style>
