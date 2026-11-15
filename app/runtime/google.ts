import type { Coordinates } from "~/types/appTypes";
import { createMapsLoader } from "./mapsLoader";
import type { CountryViewport } from "~/utils/countryViewport";
import { createGameplayFrame } from "~/utils/gameplayFrame";

type MapResourceStatus = "idle" | "loading" | "ready" | "error" | "blocked";

export const createGoogleRuntime = () => {
    let generation = 0;
    const captureGeneration = () => {
        const epoch = generation;
        return () => epoch === generation;
    };
    const mapStatus = ref<MapResourceStatus>("idle");
    const panoramaStatus = ref<MapResourceStatus>("idle");
    const accessBlocked = () => mapStatus.value === "blocked";
    const retryVersion = ref(0);
    const mapLoadMs = ref<number | null>(null);
    const panoramaLoadMs = ref<number | null>(null);
    const mapCreations = ref(0);
    const panoramaCreations = ref(0);
    const recoveryAttempts = ref(0);
    const loader = createMapsLoader(() => {
        mapStatus.value = "blocked";
        panoramaStatus.value = "blocked";
    });
    const installLoader = loader.install;
    const imports = new Map<ReturnType<typeof setTimeout>, () => void>();
    const loadLibrary = async (name: string) => {
        await loader.load();
        return new Promise<unknown>((resolve, reject) => {
            const fail = () => reject(new Error("Map library unavailable."));
            const timeout = setTimeout(() => {
                imports.delete(timeout);
                fail();
            }, 12_000);
            imports.set(timeout, fail);
            void google.maps
                .importLibrary(name)
                .then(resolve, fail)
                .finally(() => {
                    clearTimeout(timeout);
                    imports.delete(timeout);
                });
        });
    };
    const waits = new Map<ReturnType<typeof setTimeout>, () => void>();
    // States
    const googleMap = shallowRef<google.maps.Map | undefined>(undefined);
    const googleMapHTML = shallowRef<HTMLElement | null>(null);
    const googlePanorama = shallowRef<google.maps.StreetViewPanorama | undefined>(undefined);
    const googlePanoramaHTML = shallowRef<HTMLElement | null>(null);
    let mapInitialization: { epoch: number; isCurrent: () => boolean; promise: Promise<void> } | null = null;
    let panoramaInitialization: { epoch: number; isCurrent: () => boolean; promise: Promise<void> } | null = null;
    let panoramaTimeout: ReturnType<typeof setTimeout> | undefined;
    let panoramaListener: google.maps.MapsEventListener | undefined;
    let panoramaRequest = 0;
    // Retain result framing while its host is hidden, reparented or resized.
    // Gameplay framing is separate and consumed once at the first visible layout.
    let resultBounds: { bounds: google.maps.LatLngBounds; padding: number } | null = null;
    const gameplayFrame = createGameplayFrame();

    // Constants
    const mapStartingViewPosition: Coordinates = { lat: 0, lng: 0 };

    // Getters
    const isMapInitialized = computed(() => !!googleMap.value);
    const isPanoramaInitialized = computed(() => !!googlePanorama.value);
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

    const waitForMap = async (panorama = false): Promise<void> => {
        const epoch = generation;
        const ready = () => (panorama ? isGoogleInitialized.value : isMapInitialized.value);
        for (let attempts = 0; !ready() && attempts < 130; attempts++) {
            if (["error", "blocked"].includes(mapStatus.value) || (panorama && ["error", "blocked"].includes(panoramaStatus.value)))
                throw new Error("Map resources are unavailable.");
            await new Promise<void>((resolve) => {
                const id = setTimeout(() => {
                    waits.delete(id);
                    resolve();
                }, 200);
                waits.set(id, resolve);
            });
            if (epoch !== generation) throw new Error("Map initialization cancelled.");
        }
        if (!ready()) throw new Error("Map resources did not initialize.");
    };
    const waitForMapAndPano = () => waitForMap(true);

    const dispose = () => {
        generation++;
        resultBounds = null;
        gameplayFrame.reset();
        mapInitialization = null;
        panoramaInitialization = null;
        loader.dispose();
        imports.forEach((reject, timeout) => {
            clearTimeout(timeout);
            reject();
        });
        imports.clear();
        clearTimeout(panoramaTimeout);
        panoramaListener?.remove();
        panoramaListener = undefined;
        panoramaRequest++;
        mapStatus.value = "idle";
        panoramaStatus.value = "idle";
        mapLoadMs.value = null;
        panoramaLoadMs.value = null;
        waits.forEach((resolve, id) => {
            clearTimeout(id);
            resolve();
        });
        waits.clear();
        if (googleMap.value) {
            google.maps.event.clearInstanceListeners(googleMap.value);
            googleMap.value.unbindAll();
        }
        if (googlePanorama.value) {
            google.maps.event.clearInstanceListeners(googlePanorama.value);
            googlePanorama.value.setVisible(false);
            googlePanorama.value.unbindAll();
        }
        googleMapHTML.value?.replaceChildren();
        googlePanoramaHTML.value?.replaceChildren();
        googleMap.value = undefined;
        googlePanorama.value = undefined;
        googleMapHTML.value = null;
        googlePanoramaHTML.value = null;
    };

    // Setup functions
    const setMapHTML = (element: HTMLElement) => {
        googleMapHTML.value = element;
    };

    const setPanoramaHTML = (element: HTMLElement) => {
        googlePanoramaHTML.value = element;
    };

    const initializeGoogleMap = (mapHTML: HTMLElement, isCurrent: () => boolean = () => true): Promise<void> => {
        if (!isCurrent() || !mapHTML.isConnected || googleMap.value) return Promise.resolve();
        if (mapInitialization?.epoch === generation && mapInitialization.isCurrent()) return mapInitialization.promise;
        const epoch = generation;
        const initialization = { epoch, isCurrent, promise: Promise.resolve() };
        const started = performance.now();
        mapStatus.value = "loading";
        initialization.promise = (async () => {
            const { Map } = (await loadLibrary("maps")) as google.maps.MapsLibrary;
            // Retained v-show DOM is not render permission. Fence the exact
            // view owner again immediately before constructing the SDK object.
            if (
                mapInitialization !== initialization ||
                epoch !== generation ||
                googleMap.value ||
                googleMapHTML.value !== mapHTML ||
                !mapHTML.isConnected ||
                !isCurrent() ||
                mapStatus.value === "blocked"
            )
                return;

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
            mapCreations.value++;
            mapLoadMs.value = Math.round(performance.now() - started);
            if (!accessBlocked()) mapStatus.value = "ready";
        })()
            .catch(() => {
                if (epoch === generation && isCurrent() && mapStatus.value !== "blocked") mapStatus.value = "error";
                throw new Error("Map initialization failed.");
            })
            .finally(() => {
                if (mapInitialization === initialization) mapInitialization = null;
            });
        mapInitialization = initialization;
        return initialization.promise;
    };

    const observePanorama = () => {
        const panorama = googlePanorama.value;
        if (!panorama || panoramaStatus.value === "blocked") return;
        panoramaListener?.remove();
        clearTimeout(panoramaTimeout);
        const request = ++panoramaRequest;
        const epoch = generation;
        const started = performance.now();
        panoramaStatus.value = "loading";
        panoramaLoadMs.value = null;
        const current = () => request === panoramaRequest && epoch === generation && panorama === googlePanorama.value && panoramaStatus.value !== "blocked";
        const changed = () => {
            if (!current()) return;
            const status = panorama.getStatus();
            if (status === google.maps.StreetViewStatus.OK) {
                clearTimeout(panoramaTimeout);
                panoramaStatus.value = "ready";
                panoramaLoadMs.value = Math.round(performance.now() - started);
            } else if (status === google.maps.StreetViewStatus.ZERO_RESULTS || status === google.maps.StreetViewStatus.UNKNOWN_ERROR) {
                clearTimeout(panoramaTimeout);
                panoramaStatus.value = "error";
            }
        };
        panoramaListener = panorama.addListener("status_changed", changed);
        panoramaTimeout = setTimeout(() => {
            if (current()) panoramaStatus.value = "error";
        }, 15_000);
        return changed;
    };

    const initalizePanoramaView = (panoramaHTML: HTMLElement, coordinates: Coordinates = { lat: 0, lng: 0 }, isCurrent: () => boolean = () => true): Promise<void> => {
        const epoch = generation;
        if (!isCurrent() || googlePanorama.value) return Promise.resolve();
        if (panoramaInitialization?.epoch === epoch && panoramaInitialization.isCurrent()) return panoramaInitialization.promise;
        const initialization = { epoch, isCurrent, promise: Promise.resolve() };
        panoramaStatus.value = "loading";
        initialization.promise = (async () => {
            const { StreetViewPanorama } = (await loadLibrary("streetView")) as google.maps.StreetViewLibrary;
            if (
                panoramaInitialization !== initialization ||
                epoch !== generation ||
                googlePanorama.value ||
                !panoramaHTML.isConnected ||
                !isCurrent() ||
                panoramaStatus.value === "blocked"
            )
                return;
            googlePanorama.value = new StreetViewPanorama(panoramaHTML, {
                position: coordinates,
                pov: { heading: 270, pitch: 0 },
                zoom: 0,
                fullscreenControl: false,
                showRoadLabels: false,
                addressControl: false,
                motionTracking: false,
                motionTrackingControl: false,
                disableDefaultUI: true,
                panControl: true,
                zoomControl: true,
                linksControl: true,
                controlSize: 32,
                clickToGo: true,
            });
            panoramaCreations.value++;
            observePanorama()?.();
        })()
            .catch(() => {
                if (epoch === generation && isCurrent() && panoramaStatus.value !== "blocked") panoramaStatus.value = "error";
                throw new Error("Landscape initialization failed.");
            })
            .finally(() => {
                if (panoramaInitialization === initialization) panoramaInitialization = null;
            });
        panoramaInitialization = initialization;
        return initialization.promise;
    };

    // Existing SDK objects, guesses and camera survive an explicit Maps retry.
    const updatePanoramaView = (coordinates: Coordinates) => {
        const panorama = googlePanorama.value;
        if (!panorama || panoramaStatus.value === "blocked") return;
        const position = panorama.getPosition();
        if (panoramaStatus.value === "ready" && position?.lat() === coordinates.lat && position.lng() === coordinates.lng) return;
        if (panoramaStatus.value === "error") {
            // Clear only a failed position so an identical-coordinate retry is
            // a real native lookup, not an unchanged MVC property assignment.
            panoramaListener?.remove();
            panorama.setPosition(null);
        }
        observePanorama();
        panorama.setPosition(coordinates);
    };
    const retryFailedResources = () => {
        recoveryAttempts.value++;
        if (mapStatus.value === "error" && !googleMap.value) mapStatus.value = "idle";
        if (panoramaStatus.value === "error" && !googlePanorama.value) panoramaStatus.value = "idle";
        retryVersion.value++;
    };

    const addMapClickListener = (processPin: (coordinates: Coordinates) => void | Promise<void>): any => {
        const listener = googleMap.value?.addListener("click", (event: any) => {
            const clickedCoordinates: Coordinates = {
                lat: parseFloat(event.latLng.lat()),
                lng: parseFloat(event.latLng.lng()),
            };

            void Promise.resolve(processPin(clickedCoordinates)).catch(() => console.warn("Map click could not be processed."));
        });

        return listener;
    };

    const removeMapEventListener = (type: string) => google.maps.event.clearListeners(getMap.value, type);

    const setMapZoom = (zoom: number) => getMap.value.setZoom(zoom);

    const refreshMapLayout = () => {
        const map = googleMap.value;
        const host = googleMapHTML.value;
        if (!map || !host?.isConnected) return;
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return; // fitBounds is a no-op on display:none hosts.
        const center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        if (resultBounds) map.fitBounds(resultBounds.bounds, resultBounds.padding);
        else {
            const framed = gameplayFrame.apply(true, (bounds) => {
                // Wide/overseas outlines must fit even in a small minimap.
                map.setOptions({ minZoom: bounds ? 0 : 2 });
                if (bounds) map.fitBounds({ ...bounds }, 32);
                else {
                    map.setCenter({ ...mapStartingViewPosition });
                    map.setZoom(2);
                }
            });
            if (!framed && center) map.setCenter(center);
        }
    };

    const frameGameplay = (key: string, bounds: CountryViewport | null, isCurrent: () => boolean) => {
        if (!gameplayFrame.request(key, bounds, isCurrent)) return;
        resultBounds = null;
        refreshMapLayout();
    };
    const cancelGameplayFrame = () => gameplayFrame.reset();

    const fitCustomBounds = (bounds: google.maps.LatLngBounds, padding: number) => {
        gameplayFrame.reset();
        resultBounds = { bounds, padding };
        // A small result viewport must be allowed to show widely spread guesses.
        getMap.value.setOptions({ minZoom: 0 });
        refreshMapLayout();
    };
    const clearMapBounds = () => {
        resultBounds = null;
        gameplayFrame.clear();
        // Do not clamp a retained same-round camera during reconnect cleanup.
        // Each genuinely new gameplay/result frame sets its own minimum zoom.
    };

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
        const epoch = generation;
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
            map: epoch === generation ? googleMap.value : null,
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
        nameElement.style.color = "var(--gb-text)";
        nameElement.style.backgroundColor = "var(--gb-bg)";
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

    return reactive({
        installLoader,
        dispose,
        captureGeneration,
        mapStatus,
        panoramaStatus,
        retryVersion,
        retryFailedResources,
        mapLoadMs,
        panoramaLoadMs,
        mapCreations,
        panoramaCreations,
        recoveryAttempts,
        // Map access
        getMap,
        getMapHTML,
        getPanorama,
        getPanoramaHTML,
        isGoogleInitialized,
        isMapInitialized,
        isPanoramaInitialized,
        waitForMap,
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
        frameGameplay,
        cancelGameplayFrame,
        fitCustomBounds,
        clearMapBounds,
        refreshMapLayout,
        addGeoJSON,
        drawPolygonToMap,
        addNewMapMarker,
        createSearchedLocationMarker,
        updatePanoramaView,
        makePolyline,
    });
};
