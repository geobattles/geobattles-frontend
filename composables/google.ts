import type { Coordinates } from "~/types";
import { usePolyLines } from "./states";

const map_starting_view_position: Coordinates = { lat: 0, lng: 0 }; // Constant

/// GOOGLE MAP ///
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
    isGoogleMap().addListener("click", (event: any) => {
        // Process pin
        const clicked_coordinates: Coordinates = {
            lat: parseFloat(event.latLng.lat()),
            lng: parseFloat(event.latLng.lng()),
        };

        // Process pin
        processMapPin(clicked_coordinates);
    });
};

export const updateMapView = (coordinates: Coordinates) => isGoogleMap().setCenter(coordinates);
export const setMapZoom = (zoom: number) => isGoogleMap().setZoom(zoom);
export const fitCustomBounds = (bounds: google.maps.LatLngBounds, padding: number) => isGoogleMap().fitBounds(bounds, padding);
/// END GOOGLE MAP ///

/// GOOGLE PANORAMA ///
export const initalizeNewPanoramaView = (panorama_html: HTMLElement | null): void => {
    if (!panorama_html) throw new Error("Panorama html element is not defined");

    useGooglePanorama().value = new google.maps.StreetViewPanorama(panorama_html as HTMLElement, {
        position: useCoordinates().value,
        pov: {
            heading: 34,
            pitch: 10,
        },
        fullscreenControl: false,
        showRoadLabels: false,
        addressControl: false,
        motionTracking: false,
        motionTrackingControl: false,
    });
};
export const updatePanoramaView = (coordinates: Coordinates) => useGooglePanorama().value.setPosition(coordinates);
/// END GOOGLE PANORAMA ///

/// MAP MARKERS ///
export const addNewMapMarker = (coordinates: Coordinates, marker_color: string): google.maps.Marker => {
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
    marker.setMap(isGoogleMap()); // Append marker to active googleMap
    return marker;
};

export const removeMarkersFromMap = (delete_markers: Boolean) => {
    for (let i = 0; i < useMapMarkers().value.length; i++) toRaw(useMapMarkers().value[i]).setMap(null);
    if (delete_markers) useMapMarkers().value = [];
};

export const createSearchedLocationMarker = (coordinates: Coordinates) => {
    const marker = new google.maps.Marker({
        position: coordinates,
        title: "Searched location",
        icon: "game/map-icons/location.svg",
    });
    marker.setMap(isGoogleMap());
    return marker;
};
/// END MAP MARKERS ///

/// MAP POLYLINES ///
export const drawPolyLine = (from: Coordinates, to: Coordinates) => {
    // Create polyline object
    const lineSymbol = {
        path: "M 0,-1 0,1",
        strokeOpacity: 1,
        scale: 2,
    };
    const polyline = new google.maps.Polyline({
        path: [from, to],
        strokeColor: "#000000",
        strokeOpacity: 0,
        icons: [
            {
                icon: lineSymbol,
                offset: "0",
                repeat: "10px",
            },
        ],
    });
    usePolyLines().value.push(polyline); // State where all polylines are saved
    if (!useGoogleMap().value) throw new Error("Google map is not defined");
    polyline.setMap(isGoogleMap()); // Add to map
};

export const removePolyLinesFromMap = (delete_lines: Boolean) => {
    for (let i = 0; i < usePolyLines().value.length; i++) toRaw(usePolyLines().value[i]).setMap(null); // Remove from map
    if (delete_lines) usePolyLines().value = []; // Remove from saved polylines
};
/// END MAP POLYLINES ///

/**
 * Work the same as useGoogleMap().value, but throws error if google map is not defined
 * @returns Google map object
 */
const isGoogleMap = () => {
    const google_map = useGoogleMap().value;
    if (!google_map) throw new Error("Google map is not defined");
    return google_map;
};
