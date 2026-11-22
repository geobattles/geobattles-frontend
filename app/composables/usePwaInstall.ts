type PromotionPlacement = "home" | "results";
type InstallChoice = { outcome: "accepted" | "dismissed" };
type InstallPromptEvent = Event & {
    prompt: () => Promise<InstallChoice | void>;
    userChoice: Promise<InstallChoice>;
};
type InstallEnvironment = {
    platform: "ios" | "android" | "desktop";
    browser: "embedded" | "safari" | "samsung" | "chromium" | "other";
    secure: boolean;
};
type PromotionPreference = { visitedHome: boolean; shownAt: number; dismissedAt: number };

const preferenceKey = "geobattles-pwa-install-promo";
const cooldown = 14 * 24 * 60 * 60 * 1000;
const isRecent = (time: number) => time > 0 && Date.now() - time < cooldown;

function readPreference(): PromotionPreference {
    try {
        const saved = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "null") as Partial<PromotionPreference> | null;
        const { visitedHome, shownAt, dismissedAt } = saved ?? {};
        return {
            visitedHome: visitedHome === true,
            shownAt: typeof shownAt === "number" && Number.isFinite(shownAt) ? shownAt : 0,
            dismissedAt: typeof dismissedAt === "number" && Number.isFinite(dismissedAt) ? dismissedAt : 0,
        };
    } catch {
        return { visitedHome: false, shownAt: 0, dismissedAt: 0 };
    }
}

function detectEnvironment(): InstallEnvironment {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    const appBrowser = /\bGSA\/|FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat|LinkedInApp/i.test(ua);
    const webView =
        (android && /;\s*wv\b|Version\/4\.0.*Chrome\//i.test(ua)) || (ios && /AppleWebKit/i.test(ua) && !/Safari\/|CriOS\/|FxiOS\/|EdgiOS\/|OPiOS\/|DuckDuckGo\//i.test(ua));
    let browser: InstallEnvironment["browser"] = "other";
    if (appBrowser || webView || window.self !== window.top) browser = "embedded";
    else if (/SamsungBrowser\//i.test(ua)) browser = "samsung";
    else if (/Chrome\/|Chromium\/|EdgA?\/|CriOS\//i.test(ua)) browser = "chromium";
    else if (/Version\/.*Safari\//i.test(ua)) browser = "safari";
    return { platform: ios ? "ios" : android ? "android" : "desktop", browser, secure: window.isSecureContext };
}

function createInstallState(viewport: ReturnType<typeof provideMobileViewport>) {
    const route = useRouter().currentRoute;
    const auth = useAuthStore();
    const game = useGameMode();
    const { lobbySettings, finalResultsReady } = useLobbyState();
    const toast = useToast();
    const environment = shallowRef<InstallEnvironment>();
    const preference = shallowRef<PromotionPreference>({ visitedHome: false, shownAt: 0, dismissedAt: 0 });
    const promptEvent = shallowRef<InstallPromptEvent>();
    const prompted = new WeakSet<Event>();
    const pending = ref(false);
    const accepted = ref(false);
    const installedHere = ref(false);
    const homeReturn = ref(false);
    const claimed = shallowRef<{ placement: PromotionPlacement; key: string }>();
    const guideScope = shallowRef<() => boolean>();
    let attempt: (() => boolean) | undefined;
    let active = true;

    const installedMode = computed(() => {
        const view = viewport.value;
        return !!view && view.displayMode !== "browser" && !view.elementFullscreen;
    });
    const gameplayAllowsInstall = computed(
        () => route.value.name !== "gameplay-id" || (game.modeLogic.currentState === "FINISHED" && lobbySettings.value?.phase === "FINISHED" && finalResultsReady.value)
    );
    const available = computed(
        () =>
            !!environment.value &&
            !!viewport.value &&
            !installedMode.value &&
            !installedHere.value &&
            !auth.isLoginDialog &&
            !viewport.value.elementFullscreen &&
            gameplayAllowsInstall.value
    );
    const canPrompt = computed(() => !!promptEvent.value || pending.value);
    const guideOpen = computed(() => guideScope.value?.() ?? false);
    const closeGuide = () => (guideScope.value = undefined);

    function remember(next: Partial<PromotionPreference>) {
        preference.value = { ...preference.value, ...next };
        try {
            window.localStorage.setItem(preferenceKey, JSON.stringify(preference.value));
        } catch {
            // The current tab still remembers the choice when storage is unavailable.
        }
    }

    const dismissPromotion = () => {
        claimed.value = undefined;
        remember({ dismissedAt: Date.now() });
    };

    function canPromote(placement: PromotionPlacement, key: string) {
        const device = environment.value;
        if (!available.value || !device?.secure || accepted.value || isRecent(preference.value.dismissedAt)) return false;
        const mobile = device.platform !== "desktop" || viewport.value?.coarsePointer;
        if (!mobile || (device.platform === "desktop" && !canPrompt.value)) return false;
        if (placement === "home" && (route.value.name !== "index" || route.value.query.id !== undefined || !homeReturn.value)) return false;
        if (placement === "results" && (route.value.name !== "gameplay-id" || !key)) return false;
        if (claimed.value?.placement === placement && claimed.value.key === key) return true;
        return !isRecent(preference.value.shownAt);
    }

    function recordPromotion(placement: PromotionPlacement, key: string) {
        if (claimed.value || !canPromote(placement, key)) return;
        claimed.value = { placement, key };
        remember({ shownAt: Date.now() });
    }

    function capturePrompt(event: Event) {
        const candidate = event as InstallPromptEvent;
        if (typeof candidate.prompt !== "function") return;
        event.preventDefault();
        if (!installedHere.value && !installedMode.value && !prompted.has(event)) promptEvent.value = candidate;
    }

    function installed() {
        const confirm = attempt?.();
        installedHere.value = true;
        promptEvent.value = undefined;
        attempt = undefined;
        closeGuide();
        if (confirm) toast.add({ severity: "success", summary: "GeoBattles installed", detail: "Open it from your device’s apps.", life: 4000 });
    }

    async function requestInstall(ready: () => boolean) {
        if (!available.value || !ready() || pending.value || document.querySelector("dialog:modal")) return;
        const path = route.value.fullPath;
        const stillAvailable = () => active && available.value && route.value.fullPath === path && ready();
        const event = promptEvent.value;
        if (!event) {
            guideScope.value = stillAvailable;
            return;
        }

        // Consume before invoking the browser UI, on the originating click.
        promptEvent.value = undefined;
        prompted.add(event);
        pending.value = true;
        attempt = stillAvailable;
        try {
            const choice = (await event.prompt()) ?? (await event.userChoice);
            if (!active || installedHere.value) return;
            if (choice.outcome === "accepted") accepted.value = true;
            else {
                attempt = undefined;
                dismissPromotion();
            }
        } catch {
            attempt = undefined;
            if (stillAvailable()) guideScope.value = stillAvailable;
        } finally {
            if (active) pending.value = false;
        }
    }

    function syncPreference(event: StorageEvent) {
        if (event.key === preferenceKey || event.key === null) preference.value = readPreference();
    }

    watch([() => route.value.name, environment], ([name, device], [previous]) => {
        if (name !== "index" || !device) return;
        homeReturn.value = preference.value.visitedHome || previous === "about" || previous === "journal" || previous === "profile";
        if (!preference.value.visitedHome) remember({ visitedHome: true });
    });
    watch(
        () => route.value.fullPath,
        () => {
            closeGuide();
            claimed.value = undefined;
            attempt = undefined;
        }
    );
    watch(installedMode, (standalone) => {
        if (standalone) promptEvent.value = undefined;
    });
    watch(guideOpen, (open) => {
        if (!open) closeGuide();
    });

    // Capture early enough to retain a native event delivered during hydration.
    if (import.meta.client) {
        window.addEventListener("beforeinstallprompt", capturePrompt);
        window.addEventListener("appinstalled", installed);
    }
    onMounted(() => {
        preference.value = readPreference();
        environment.value = detectEnvironment();
        window.addEventListener("storage", syncPreference);
    });
    onBeforeUnmount(() => {
        active = false;
        window.removeEventListener("beforeinstallprompt", capturePrompt);
        window.removeEventListener("appinstalled", installed);
        window.removeEventListener("storage", syncPreference);
        promptEvent.value = undefined;
        attempt = undefined;
        closeGuide();
    });

    return { environment, available, canPrompt, pending, guideOpen, closeGuide, requestInstall, canPromote, recordPromotion, dismissPromotion };
}

const installKey: InjectionKey<ReturnType<typeof createInstallState>> = Symbol("PWA installation");

export function providePwaInstall(viewport: ReturnType<typeof provideMobileViewport>) {
    provide(installKey, createInstallState(viewport));
}

export function usePwaInstall() {
    const install = inject(installKey);
    if (!install) throw new Error("PWA installation provider is missing.");
    return install;
}
