import type { Coordinates } from "~/types";

const map_starting_view_position: Coordinates = { lat: 0, lng: 0 }; // Constant

export const initalizeNewGoogleMap = (map_html: HTMLElement): void => {
    useGoogleMap().value = new google.maps.Map(map_html as HTMLElement, {
        center: { ...map_starting_view_position },
        zoom: 2,
        styles: [
            {
                featureType: "poi",
                stylers: [{ visibility: "off" }],
            },
        ],
        clickableIcons: false,
        streetViewControl: false,
        mapTypeControl: false,
        draggableCursor: "crosshair",
        fullscreenControl: false,
        minZoom: 2,

        restriction: {
            latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180,
            },
        },

        gestureHandling: "greedy", // Does not need 2 fingers to move on map when using touchscreen

        keyboardShortcuts: false,
    });
};

export const addMapClickListener = (): void => {
    useGoogleMap().value.addListener("click", (event: any) => {
        // Process pin
        const clicked_coordinates: Coordinates = {
            lat: parseFloat(event.latLng.lat()),
            lng: parseFloat(event.latLng.lng()),
        };
        console.log("Clicked coordinates: ", clicked_coordinates); //! Dev

        // Process pin
        processMapPin(clicked_coordinates);
    });
};

export const addNewMapMarker = (coordinates: Coordinates): google.maps.Marker => {
    // Get player color
    const marker_color = getPlayerColorByName(usePlayerInfo().value.name);
    if (!marker_color) throw new Error("Player color is not defined");

    // Create marker
    const marker = new google.maps.Marker({
        position: coordinates,
        title: "Pin",
        icon: {
            path: "M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 256c-35.3 0-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64s-28.7 64-64 64z",
            fillColor: marker_color,
            fillOpacity: 1,
            anchor: new google.maps.Point(192, 512),
            strokeWeight: 1,
            strokeColor: "#000000",
            scale: 0.07,
        },
    });
    marker.setMap(useGoogleMap().value); // Append marker to active googleMap
    return marker;
};
