export const useStartApp = () => {
    // Read ENV variables
    const runtimeConfig = useRuntimeConfig();
    useBackendAPI().value = runtimeConfig.public.BACKEND_HOST;

    // Define the app's head metadata
    useHead({
        title: "GeoBattles",
        meta: [
            { name: "mobile-web-app-capable", content: "yes" },
            { name: "apple-mobile-web-app-status-bar-style", content: "black" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
            },
            { name: "description", content: "Geolocation Guessing Game" },
            { name: "theme-color", content: "#ffffff" },
        ],
        link: [
            { rel: "icon", href: "/logo.png" },
            { rel: "apple-touch-icon", href: "/logo.png", sizes: "1024x1024" },
            { rel: "mask-icon", href: "/logo.png", color: "#FFFFFF" },
        ],
    });

    onBeforeMount(() => {
        // Authenticate user if possible
        try {
            useAuthStore().saveTokenData();
        } catch (error) {
            console.log("Failed to save token data:", error);
        }
    });

    onMounted(() => {
        // Dynamically load the provided Google Maps script
        const script = document.createElement("script");
        script.innerHTML = `
                (g => {
                    var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window;
                    b = b[c] || (b[c] = {});
                    var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => {
                        await (a = m.createElement("script"));
                        e.set("libraries", [...r] + "");
                        for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
                        e.set("callback", c + ".maps." + q);
                        a.src = \`https://maps.\${c}apis.com/maps/api/js?\` + e;
                        d[q] = f;
                        a.onerror = () => h = n(Error(p + " could not load."));
                        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
                        m.head.append(a);
                    }));
                    d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
                })({
                    key: "${runtimeConfig.public.GMAPS_API}",
                    v: "weekly",
                });
            `;
        document.head.appendChild(script);

        // Add primitive check for mobile devices
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) useUIManager().value.setMobile(true);
    });
};
