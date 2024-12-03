<template>
    <div class="game-container">
        <div id="map" class="map"></div>
        <!-- Add this div for the map -->
    </div>
</template>

<script lang="ts">
import { onMounted } from "vue";

export default {
    setup() {
        const googleMap: Ref<google.maps.Map | undefined> = shallowRef();
        onMounted(async () => {
            // Ensure Google Maps is loaded
            if (window.google && window.google.maps) {
                // Initialize the map
                const mapElement = document.getElementById("map");
                const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;

                if (mapElement) {
                    // const map = new Map(mapElement, {
                    //     center: { lat: -34.397, lng: 150.644 },
                    //     zoom: 8,
                    //     mapId: "DEMO_MAP_ID",
                    // });
                    googleMap.value = new Map(mapElement, {
                        center: { lat: -34.397, lng: 150.644 },
                        zoom: 8,
                        mapId: "DEMO_MAP_ID",
                    });
                    console.log("Google Map initialized:", googleMap.value);

                    // Add an AdvancedMarkerElement
                    google.maps
                        .importLibrary("marker")
                        .then(async () => {
                            const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

                            const marker = new AdvancedMarkerElement({
                                position: { lat: -34.397, lng: 150.644 },
                                title: "Advanced Marker",
                                // map: map,
                                map: googleMap.value,
                            });

                            const markerOld = new google.maps.Marker({
                                position: { lat: -34.097, lng: 150.644 },
                                title: "Old Marker",
                                // map: map,
                                map: googleMap.value,
                            });
                            console.log("Advanced Marker added:", markerOld);

                            console.log("Advanced Marker added:", marker);
                        })
                        .catch((error) => {
                            console.error("Failed to load AdvancedMarkerElement:", error);
                        });
                }
            } else {
                console.error("Google Maps is not loaded");
            }
        });
    },
};
</script>

<style scoped>
/* Game Container */
.game-container {
    position: relative; /* Enable absolute positioning for children */
    height: 100vh; /* Fullscreen height */
    width: 100vw; /* Fullscreen width */
}

.map {
    width: 500px;
    height: 500px;
}
</style>
