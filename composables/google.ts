import { BattleRoyaleMode } from "~/core/BattleRoyaleMode";
import type { Coordinates } from "~/types/appTypes";

// Google map states
export const useGoogleMap = shallowRef<google.maps.Map | undefined>(undefined);
export const useGoogleMapHTML = () => useState<HTMLElement | null>("google_map_html", () => null);
export const useGooglePanorama = () => useState<google.maps.StreetViewPanorama>("google_panorama", () => ({} as google.maps.StreetViewPanorama));
export const useGooglePanoramaHTML = () => useState<HTMLElement | null>("google_panorama_html", () => null);

const map_starting_view_position: Coordinates = { lat: 0, lng: 0 }; // Constant

/// GOOGLE MAP ///
export const initalizeNewGoogleMap = async (map_html: HTMLElement) => {
    const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;

    useGoogleMap.value = new Map(map_html as HTMLElement, {
        center: { ...map_starting_view_position },
        zoom: 2,
        mapId: "DEMO_MAP_ID",
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

    console.log("GOOGLE MAP INITIALIZED");
};

/**
 * Function that adds click listener to google map and calls
 * provided function on every click.
 * @param processPin Function that processes pin when clicked on map.
 */
export const addMapClickListener = (processPin: (coordinates: Coordinates) => void): any => {
    const listener = isGoogleMap().addListener("click", (event: any) => {
        // Process pin
        const clicked_coordinates: Coordinates = {
            lat: parseFloat(event.latLng.lat()),
            lng: parseFloat(event.latLng.lng()),
        };

        // Process pin
        processPin(clicked_coordinates);
    });

    return listener;
};

export const setMapZoom = (zoom: number) => isGoogleMap().setZoom(zoom);
export const fitCustomBounds = (bounds: google.maps.LatLngBounds, padding: number) => isGoogleMap().fitBounds(bounds, padding);
export const addGeoJSON = (geo_json: Object) => isGoogleMap().data.addGeoJson(geo_json);
export const drawPolygonToMap = (polygon: google.maps.Data) => polygon.setMap(isGoogleMap());
export const removeMapEventListener = (type: string) => google.maps.event.clearListeners(isGoogleMap(), type);
/// END GOOGLE MAP ///

/// GOOGLE PANORAMA ///
export const initalizeNewPanoramaView = (panorama_html: HTMLElement | null): void => {
    if (!panorama_html) throw new Error("Panorama html element is not defined");
    const gameStore = useGameplayStore();

    // Timeout heres is added just to track Google Maps API billing (so panorama is alomst for sure loaded after map)
    setTimeout(() => {
        useGooglePanorama().value = new google.maps.StreetViewPanorama(panorama_html as HTMLElement, {
            position: gameStore.searchedLocationCoords,
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
    }, 2000);
};
export const updatePanoramaView = (coordinates: Coordinates) => useGooglePanorama().value.setPosition(coordinates);
/// END GOOGLE PANORAMA ///

/// MAP MARKERS ///
export const addNewMapMarker = async (coordinates: Coordinates, marker_color: string, playerName?: string) => {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

    // Get marker content
    const markerContent = await getMarkerContent(marker_color, playerName);

    // Create marker
    const marker = new AdvancedMarkerElement({
        map: isGoogleMap(),
        position: coordinates,
        title: "Pin",
        content: markerContent,
    });
    return marker;
};

export const createSearchedLocationMarker = async (coordinates: Coordinates) => {
    const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

    // Change the background color.
    const pinBackground = new PinElement({
        background: "black",
        borderColor: "white",
        glyphColor: "white",
        scale: 1.5,
    });

    const marker = new AdvancedMarkerElement({
        position: coordinates,
        title: "Searched location",
        map: isGoogleMap(),
        content: pinBackground.element,
    });

    return marker;
};

/**
 * Function to shade a color by a given percentage.
 * @param color The color to shade.
 * @param percent The percentage to shade the color.
 * @returns The shaded color.
 */
const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, R + (R * percent) / 100));
    G = Math.min(255, Math.max(0, G + (G * percent) / 100));
    B = Math.min(255, Math.max(0, B + (B * percent) / 100));

    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1).toUpperCase()}`;
};

const getMarkerContent = async (playerColor: string, playerName: string | undefined) => {
    const { PinElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

    // Change the background color.
    const pinBackground = new PinElement({
        background: playerColor,
        borderColor: shadeColor(playerColor, -10),
        glyphColor: shadeColor(playerColor, -20),
        scale: 1.2,
    });

    if (!playerName) return pinBackground.element;

    // Create marker content with player name
    const markerContent = document.createElement("div");
    markerContent.style.display = "flex";
    markerContent.style.flexDirection = "column";
    markerContent.style.alignItems = "center";

    const nameElement = document.createElement("div");
    nameElement.style.textAlign = "center";
    nameElement.style.marginBottom = "1px";
    nameElement.style.fontWeight = "bold";
    nameElement.style.fontSize = "11px";
    nameElement.style.color = "var(--p-surface-0)";
    nameElement.style.backgroundColor = "var(--p-surface-900)";
    nameElement.style.borderRadius = "3px";
    nameElement.style.padding = "1px 3px";
    nameElement.style.letterSpacing = "0.5px";
    nameElement.innerText = playerName;

    markerContent.appendChild(nameElement);
    markerContent.appendChild(pinBackground.element);

    return markerContent;
};

/// END MAP MARKERS ///

/// MAP POLYLINES ///
export const makePolyline = (from: Coordinates, to: Coordinates) => {
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

    return polyline;
};
/// END MAP POLYLINES ///

/**
 * Work the same as useGoogleMap().value, but throws error if google map is not defined
 * @returns Google map object
 */
export const isGoogleMap = () => {
    const google_map = useGoogleMap.value;
    if (!google_map) throw new Error("Google map is not defined when trying to access it.");
    return google_map;
};
