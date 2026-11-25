import { test, expect } from "./support/fixtures";
import { registerGuest } from "./support/ui";

test("the homepage install control is user-initiated and each native offer is single-use", async ({ run }) => {
    const actor = await run.actor("Install", true);
    const { page } = actor;
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Mozilla/5.0 (Linux; Android 15) Chrome/140.0 Mobile Safari/537.36" });
        const watched = new Set(["beforeinstallprompt", "appinstalled"]);
        const added: string[] = [];
        const removed: string[] = [];
        const add = window.addEventListener.bind(window);
        const remove = window.removeEventListener.bind(window);
        window.addEventListener = (...args: Parameters<typeof add>) => {
            if (watched.has(args[0])) added.push(args[0]);
            add(...args);
        };
        window.removeEventListener = (...args: Parameters<typeof remove>) => {
            if (watched.has(args[0])) removed.push(args[0]);
            remove(...args);
        };
        let calls = 0;
        let offer: Event | undefined;
        const probe = {
            offer(outcome?: "accepted" | "dismissed") {
                if (outcome) {
                    offer = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
                        prompt: async () => {
                            calls++;
                            return { outcome };
                        },
                    });
                }
                return offer ? !window.dispatchEvent(offer) : false;
            },
            calls: () => calls,
            listeners: () => ({ added, removed }),
        };
        Object.assign(window, { installProbe: probe });
    });

    const offer = (outcome?: "accepted" | "dismissed") =>
        page.evaluate((choice) => (window as Window & { installProbe?: { offer: (outcome?: "accepted" | "dismissed") => boolean } }).installProbe!.offer(choice), outcome);
    const calls = () => page.evaluate(() => (window as Window & { installProbe?: { calls: () => number } }).installProbe!.calls());
    const promotion = page.locator(".install-promotion");
    const manual = page.getByRole("button", { name: "How to install GeoBattles", exact: true });
    const native = page.getByRole("button", { name: "Install GeoBattles", exact: true });

    await actor.goto("/");
    await expect(manual).toBeVisible();
    await expect(promotion).toHaveCount(0);
    expect(await offer("dismissed")).toBe(true);
    await expect(native).toBeVisible();
    expect(await calls()).toBe(0);
    await native.click();
    await expect(manual).toBeVisible();
    expect(await calls()).toBe(1);
    await offer(); // A dispatched copy of the same event cannot be prompted again.
    await expect(native).toHaveCount(0);
    expect(await calls()).toBe(1);
    await actor.reload();
    await expect(manual).toBeVisible();
    await expect(promotion).toHaveCount(0);
    await manual.click();
    const guide = page.getByRole("dialog", { name: "Install GeoBattles" });
    await expect(guide.getByText("Install from the menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(manual).toBeFocused();

    await actor.reload();
    await expect(promotion).toHaveCount(0);
    expect(await offer("accepted")).toBe(true);
    await expect(native).toBeVisible();
    expect(await calls()).toBe(0);
    await native.click();
    expect(await calls()).toBe(1);
    await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
    await expect(page.getByText("GeoBattles installed", { exact: true })).toBeVisible();
    await expect(manual).toHaveCount(0);
    await expect(native).toHaveCount(0);

    const listeners = await page.evaluate(() => {
        const root = document.querySelector<HTMLElement & { __vue_app__?: { unmount: () => void } }>("#__nuxt");
        root?.__vue_app__?.unmount();
        return (window as Window & { installProbe?: { listeners: () => { added: string[]; removed: string[] } } }).installProbe!.listeners();
    });
    expect(listeners.added.sort()).toEqual(["appinstalled", "beforeinstallprompt"]);
    expect(listeners.removed.sort()).toEqual(listeners.added);
});

test("the signed-in install guide preserves the full invitation and session in an embedded browser", async ({ run }) => {
    const actor = await run.actor("InstallGuide", true);
    const { page } = actor;
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "userAgent", {
            configurable: true,
            value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 GSA/370.0 Mobile/15E148 Safari/604.1",
        });
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: async () => Promise.reject(new Error("Clipboard unavailable in this fixture")) },
        });
    });
    await registerGuest(actor);
    const invitation = "/lobby/join?id=A7FK&edit=1&source=message#invite";
    await actor.goto(invitation);
    const account = page.locator("details.account-menu");
    const summary = account.locator("summary");
    await expect(summary).toHaveAccessibleName(`${actor.name}, guest account menu`);
    const requests = actor.authRequests;
    const url = page.url();
    await expect(page.locator(".install-promotion")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await summary.click();
    await account.getByRole("button", { name: "How to install GeoBattles" }).click();
    const guide = page.getByRole("dialog", { name: "Install GeoBattles" });
    await expect(guide.getByText("Open in Safari", { exact: true })).toBeVisible();
    await expect(guide.getByText("Add to Home Screen", { exact: true })).toBeVisible();
    await guide.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(guide.getByRole("textbox", { name: "Page link" })).toHaveValue(url);
    await guide.getByRole("button", { name: "Close dialog" }).click();
    await expect(summary).toBeFocused();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("textbox", { name: "Game code" })).toHaveValue("A7FK");
    await expect(summary).toHaveAccessibleName(`${actor.name}, guest account menu`);
    expect(actor.authRequests).toBe(requests);
    expect(run.sdkRequests).toBe(0);
});
