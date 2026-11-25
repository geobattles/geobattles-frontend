// Only the Nuxt "matchfixture" build resolves #maps-provider here. The real
// map owner, pin listeners, submit controls and result views run as usual.
type Point = { lat: number; lng: number };
const latLng = (point: Point) => ({ lat: () => point.lat, lng: () => point.lng });
type Listener = (event?: unknown) => void;

class Surface {
    listeners = new Map<string, Set<Listener>>();
    addListener(type: string, callback: Listener) {
        const listeners = this.listeners.get(type) ?? new Set<Listener>();
        this.listeners.set(type, listeners);
        listeners.add(callback);
        return { remove: () => listeners.delete(callback) };
    }
    emit(type: string, event?: unknown) {
        this.listeners.get(type)?.forEach((callback) => callback(event));
    }
    unbindAll() {
        this.listeners.clear();
    }
}

class Atlas extends Surface {
    center: Point = { lat: 0, lng: 0 };
    zoom = 2;
    private readonly clicks = new AbortController();
    constructor(public host: HTMLElement) {
        super();
        host.dataset.fixtureAtlas = "true";
        host.style.background = 'url("/globe/natural-earth-land.svg") center / 100% 100% no-repeat, #164e54';
        host.addEventListener(
            "click",
            (event) => {
                const box = host.getBoundingClientRect();
                // A coarse coordinate grid gives the same pin at different viewport sizes.
                const lat = 2 * Math.round((90 - (180 * (event.clientY - box.top)) / box.height) / 2);
                const lng = 5 * Math.round((((event.clientX - box.left) / box.width) * 360 - 180) / 5);
                this.emit("click", { latLng: latLng({ lat, lng }) });
            },
            { signal: this.clicks.signal }
        );
    }
    override unbindAll() {
        this.clicks.abort();
        delete this.host.dataset.fixtureAtlas;
        super.unbindAll();
    }
    setCenter(point: Point) {
        this.center = point;
    }
    getCenter() {
        return this.center;
    }
    setZoom(value: number) {
        this.zoom = value;
    }
    getZoom() {
        return this.zoom;
    }
    setOptions() {}
    fitBounds() {
        queueMicrotask(() => this.emit("idle"));
    }
}

class Panorama extends Surface {
    position: Point;
    constructor(host: HTMLElement, options: { position: Point }) {
        super();
        this.position = options.position;
        host.style.background = 'url("/images/emerald-lake.webp") center / cover';
    }
    getStatus() {
        return "OK";
    }
    getPosition() {
        return latLng(this.position);
    }
    setPosition(point: Point) {
        this.position = point;
        this.emit("status_changed");
    }
    setVisible() {}
    setPov() {}
    setZoom() {}
}

class Pin {
    content: HTMLElement;
    private point: Point;
    constructor(options: { position: Point; content: HTMLElement; title: string }) {
        this.content = options.content;
        this.content.title = options.title;
        this.point = options.position;
        this.content.style.cssText += ";position:absolute;pointer-events:none;transform:translate(-50%,-100%)";
        this.position = this.point;
    }
    set position(point: Point) {
        this.point = point;
        this.content.style.left = ((point.lng + 180) / 360) * 100 + "%";
        this.content.style.top = ((90 - point.lat) / 180) * 100 + "%";
    }
    get position() {
        return this.point;
    }
    set map(map: Atlas | null) {
        if (map) map.host.append(this.content);
        else this.content.remove();
    }
}

const libraries = { maps: { Map: Atlas }, streetView: { StreetViewPanorama: Panorama }, marker: { AdvancedMarkerElement: Pin } };
const maps = {
    importLibrary: (name: keyof typeof libraries) => Promise.resolve(libraries[name]),
    StreetViewStatus: { OK: "OK" },
    Polyline: class {
        setMap() {}
    },
    event: {
        clearListeners: (surface: Surface, type: string) => surface.listeners.delete(type),
        clearInstanceListeners: (surface: Surface) => surface.unbindAll(),
        trigger: (surface: Surface, type: string) => surface.emit(type),
        addListenerOnce(surface: Surface, type: string, callback: Listener) {
            const listener = surface.addListener(type, () => {
                listener.remove();
                callback();
            });
            return listener;
        },
    },
};

export const mapsConfigured = (_key: string) => true;
export const createMapsLoader = (_onAuthFailure: () => void) => ({
    install(_key: string) {},
    async load() {
        Object.assign(window, { google: { maps } });
    },
    dispose() {},
});
