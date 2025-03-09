import type { Coordinates } from "~/types/appTypes";

export const useGoogleStore = defineStore("googleStore", () => {
    // States
    const googleMap = shallowRef<google.maps.Map | undefined>(undefined);
    const googleMapHTML = ref<HTMLElement | null>(null);
    const googlePanorama = shallowRef<google.maps.StreetViewPanorama | undefined>(undefined);
    const googlePanoramaHTML = ref<HTMLElement | null>(null);

    // Constants
    const mapStartingViewPosition: Coordinates = { lat: 0, lng: 0 };

    // Getters
    const isGoogleInitialized = computed(() => {
        // Check if both map and panorama are initialized
        return !!googleMap.value && !!googlePanorama.value;
    });

    const getMap = computed(() => {
        const google_map = googleMap.value;
        if (!google_map) throw new Error("Google Map is not defined when trying to access it.");
        return google_map;
    });

    const getMapHTML = computed(() => {
        const map_html = googleMapHTML.value;
        if (!map_html) throw new Error("Google map HTML is not defined when trying to access it.");
        return map_html;
    });

    const getPanorama = computed(() => {
        const panorama = googlePanorama.value;
        if (!panorama) throw new Error("Google StreetViewPanorama is not defined when trying to access it.");
        return panorama;
    });

    const getPanoramaHTML = computed(() => {
        const panorama_html = googlePanoramaHTML.value;
        if (!panorama_html) throw new Error("Google panorama HTML is not defined when trying to access it.");
        return panorama_html;
    });

    const waitForMapAndPano = async (): Promise<void> => {
        // Wait for both Google Map and Panorama to be initialized
        let attempts = 0;

        while (!isGoogleInitialized.value && attempts < 20) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            attempts++;
        }

        if (!getMap.value) {
            console.error("Google Map failed to initialize after multiple attempts");
            return;
        }

        if (!getPanorama.value) {
            console.error("Google Panorama failed to initialize after multiple attempts");
            return;
        }
    };

    // Setup functions
    const setMapHTML = (element: HTMLElement) => {
        googleMapHTML.value = element;
    };

    const setPanoramaHTML = (element: HTMLElement) => {
        googlePanoramaHTML.value = element;
    };

    const initializeGoogleMap = async (mapHTML: HTMLElement) => {
        const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;

        googleMap.value = new Map(mapHTML as HTMLElement, {
            center: { ...mapStartingViewPosition },
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

            gestureHandling: "greedy",

            keyboardShortcuts: false,
            disableDefaultUI: true,
        });
    };

    const initalizePanoramaView = async (panoramaHTML: HTMLElement, coordinates: Coordinates = { lat: 0, lng: 0 }) => {
        const { StreetViewPanorama } = (await google.maps.importLibrary("streetView")) as google.maps.StreetViewLibrary;

        googlePanorama.value = new StreetViewPanorama(panoramaHTML as HTMLElement, {
            position: coordinates,
            pov: {
                heading: 270,
                pitch: 0,
            },
            fullscreenControl: false,
            showRoadLabels: false,
            addressControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            // disableDefaultUI: true,
        });
    };

    // Actions and manipulations
    const updatePanoramaView = (coordinates: Coordinates) => googlePanorama.value?.setPosition(coordinates);

    const addMapClickListener = (processPin: (coordinates: Coordinates) => void): any => {
        const listener = googleMap.value?.addListener("click", (event: any) => {
            const clickedCoordinates: Coordinates = {
                lat: parseFloat(event.latLng.lat()),
                lng: parseFloat(event.latLng.lng()),
            };

            processPin(clickedCoordinates);
        });

        return listener;
    };

    const removeMapEventListener = (type: string) => google.maps.event.clearListeners(getMap.value, type);

    const setMapZoom = (zoom: number) => getMap.value.setZoom(zoom);

    const fitCustomBounds = (bounds: google.maps.LatLngBounds, padding: number) => getMap.value.fitBounds(bounds, padding);

    const addGeoJSON = (geo_json: Object) => getMap.value.data.addGeoJson(geo_json);

    const drawPolygonToMap = (polygon: google.maps.Data) => polygon.setMap(getMap.value);

    const addNewMapMarker = async (coordinates: Coordinates, marker_color: string, playerName?: string) => {
        const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

        // Get marker content
        const markerContent = await getMarkerContent(marker_color, playerName);

        // Create marker
        const marker = new AdvancedMarkerElement({
            position: coordinates,
            title: "Pin",
            content: markerContent,
        });
        return marker;
    };

    const createSearchedLocationMarker = async (coordinates: Coordinates) => {
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
            map: getMap.value,
            content: pinBackground.element,
        });

        return marker;
    };

    const shadeColor = (color: string, percent: number): string => {
        // Parse the hex color
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        // Calculate the new values
        if (percent < 0) {
            // Darken the color (multiply components)
            R = Math.round(R * (1 + percent / 100));
            G = Math.round(G * (1 + percent / 100));
            B = Math.round(B * (1 + percent / 100));
        } else {
            // Lighten the color (add white)
            R = Math.round(R + (255 - R) * (percent / 100));
            G = Math.round(G + (255 - G) * (percent / 100));
            B = Math.round(B + (255 - B) * (percent / 100));
        }

        // Ensure values stay within range
        R = Math.min(255, Math.max(0, R));
        G = Math.min(255, Math.max(0, G));
        B = Math.min(255, Math.max(0, B));

        // Convert back to hex
        const RR = R.toString(16).padStart(2, "0");
        const GG = G.toString(16).padStart(2, "0");
        const BB = B.toString(16).padStart(2, "0");

        return `#${RR}${GG}${BB}`;
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

    const makePolyline = (from: Coordinates, to: Coordinates) => {
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

    return {
        // Map access
        getMap,
        getMapHTML,
        getPanorama,
        getPanoramaHTML,
        isGoogleInitialized,
        waitForMapAndPano,

        // Setup function
        setMapHTML,
        setPanoramaHTML,
        initializeGoogleMap,
        initalizePanoramaView,

        // Map listeners
        addMapClickListener,
        removeMapEventListener,

        // Map functions
        setMapZoom,
        fitCustomBounds,
        addGeoJSON,
        drawPolygonToMap,
        addNewMapMarker,
        createSearchedLocationMarker,
        updatePanoramaView,
        makePolyline,
    };
});
