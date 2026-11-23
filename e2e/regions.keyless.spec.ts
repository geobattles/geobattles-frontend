import { test, expect } from "./support/fixtures";
import { createLobby, reservedAfterLeave, joinInvite, leave, openSettingsSection, registerGuest, setReady } from "./support/ui";
import { settings } from "./support/safety.mjs";
import { regionScoreScale } from "../app/utils/regionScoring";
import type { CountryCatalog } from "../app/types/regions";

const env = settings(true);

test("regions: presets, single-country map, Custom, adaptive scoring and compact settings", async ({ run }) => {
    const host = await run.actor("Regions", true);
    const peer = await run.actor("Observer");
    await registerGuest(host);
    await registerGuest(peer);
    const id = await createLobby(host);
    await joinInvite(peer, id);
    await setReady(host, true);
    await setReady(peer, true);
    const catalogResponse = await fetch(`${env.backend}/countryCatalog`, { redirect: "error", signal: AbortSignal.timeout(8000) });
    expect(catalogResponse.status).toBe(200);
    const catalog: CountryCatalog = await catalogResponse.json();
    const page = host.page;
    const dialog = page.getByRole("dialog", { name: /^lobby settings$/i });
    let expectedRoundTime = Number(host.latest!.conf.roundTime);
    let settingsMark = peer.mark();
    const open = async () => {
        settingsMark = peer.mark();
        await page.getByRole("button", { name: /^(modify|edit settings|settings)$/i }).click();
        await openSettingsSection(dialog, "Map");
        await expect(dialog.getByRole("button", { name: /^world$/i })).toBeEnabled();
    };
    const expectSaved = async (codes: string[], mode = "auto") => {
        const snapshot = await peer.snapshot(
            (lobby) => lobby.conf.scoringMode === mode && JSON.stringify([...(lobby.conf.ccList as string[])].sort()) === JSON.stringify([...codes].sort()),
            settingsMark
        );
        expect(Object.values(snapshot.playerList).every((player) => player.ready)).toBe(true);
        expect(snapshot.conf.roundTime).toBe(expectedRoundTime);
        await closeSettings.click();
        await expect(dialog).toHaveCount(0);
        if (mode === "auto") expect(Number(snapshot.conf.scoreScaleKm)).toBeCloseTo(regionScoreScale(codes, catalog), 6);
        return snapshot;
    };
    await open();
    await expect(dialog.getByRole("button", { name: /^all$/i })).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("button", { name: /^world map$/i })).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("searchbox", { name: /^find countries$/i })).toHaveCount(0);
    const countrySearch = dialog.getByRole("searchbox", { name: /^choose a country$/i });
    const countryResults = dialog.getByRole("radiogroup", { name: /^country search results$/i });
    const sloveniaRow = countryResults.getByRole("radio", { name: /^Slovenia SI$/ });
    const selectedCountry = dialog.locator(".current-country");
    await expect(countrySearch).toHaveCount(0);
    await openSettingsSection(dialog, "Scoring & powerups");
    const automatic = dialog.getByRole("checkbox", { name: /^automatic scoring/i });
    await expect(automatic).toBeChecked();
    const factor = dialog.getByRole("slider", { name: /^score factor/i });
    await expect(factor).toBeHidden();
    await openSettingsSection(dialog, "Rounds");
    const timer = dialog.locator(".timer-setting");
    const seconds = timer.getByRole("spinbutton", { name: /^time in seconds$/i });
    const adjustment = timer.getByRole("slider", { name: /^round timer adjustment$/i });
    const closeSettings = dialog.getByRole("button", { name: /^close dialog$/i });
    const timePresets = timer.getByRole("group", { name: /^round time presets$/i });
    await expect(seconds).toHaveValue(String(expectedRoundTime));
    await expect(adjustment).toHaveValue(String(expectedRoundTime));
    for (const invalid of ["19", "201", "20.5", ""]) {
        await seconds.fill(invalid);
        expect(await seconds.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
        await expect(adjustment).toHaveValue(String(expectedRoundTime));
    }
    await seconds.blur();
    await expect(seconds).toHaveValue(String(expectedRoundTime));

    await adjustment.press("Home");
    await expect(seconds).toHaveValue("20");
    await expect(timer.getByRole("button", { name: /^decrease time in seconds$/i })).toBeDisabled();
    await adjustment.press("End");
    await expect(seconds).toHaveValue("200");
    await expect(timer.getByRole("button", { name: /^increase time in seconds$/i })).toBeDisabled();
    const timeMark = peer.mark();
    await timePresets.getByRole("button", { name: "90s", exact: true }).click();
    await timer.getByRole("button", { name: /^increase time in seconds$/i }).click();
    await expect(seconds).toHaveValue("91");
    await expect(adjustment).toHaveValue("91");
    await Promise.all([peer.snapshot((lobby) => lobby.conf.roundTime === 91, timeMark), expect(dialog.getByText("Round time updated to 91 s", { exact: true })).toBeVisible()]);
    expectedRoundTime = 91;
    await seconds.press("Enter");
    await expect(dialog).toBeVisible();
    await openSettingsSection(dialog, "Lobby");
    await openSettingsSection(dialog, "Rounds");
    await expect(seconds).toHaveValue("91");
    for (const viewport of [
        { width: 320, height: 568 },
        { width: 390, height: 844 },
        { width: 568, height: 256 },
        { width: 568, height: 320 },
        { width: 844, height: 390 },
        { width: 1024, height: 768 },
    ]) {
        await page.setViewportSize(viewport);

        for (const section of ["Lobby", "Map", "Scoring & powerups", "Rounds"] as const) {
            await openSettingsSection(dialog, section);
            const measures = await dialog.evaluate((element) => {
                const rect = element.getBoundingClientRect();
                const undersized = Array.from(element.querySelectorAll<HTMLElement>("button, select, input.input, summary"))
                    .filter((control) => {
                        if (!control.checkVisibility()) return false;
                        const bounds = control.getBoundingClientRect();
                        return bounds.width < 43 || bounds.height < 43;
                    })
                    .map((control) => control.tagName);
                return {
                    fits: rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
                    fullscreen: rect.left <= 1 && rect.top <= 1 && rect.right >= innerWidth - 1 && rect.bottom >= innerHeight - 1,
                    overflow: element.scrollWidth > element.clientWidth + 1,
                    undersized,
                };
            });
            expect(measures.fits, "The native settings dialog must fit the viewport").toBe(true);
            if (viewport.width <= 760 || viewport.height <= 540) expect(measures.fullscreen).toBe(true);
            expect(measures.overflow, "No horizontal scrolling inside settings").toBe(false);
            expect(measures.undersized, "Ordinary controls retain 44px targets").toEqual([]);
            await expect(closeSettings).toBeInViewport();
        }
        await expect(seconds).toHaveValue(String(expectedRoundTime));
        await expect(timePresets.getByRole("button")).toHaveCount(4);
        const presetMeasures = await timePresets.evaluate((group) => {
            const bounds = group.getBoundingClientRect();
            // DOMRect arithmetic differs by tiny fractions of a CSS pixel in Firefox.
            const epsilon = 0.01;
            return Array.from(group.querySelectorAll("button"), (button) => {
                const rect = button.getBoundingClientRect();
                return {
                    label: button.textContent,
                    fits: rect.left >= bounds.left - epsilon && rect.right <= bounds.right + epsilon && rect.top >= bounds.top - epsilon && rect.bottom <= bounds.bottom + epsilon,
                    width: rect.width,
                    height: rect.height,
                };
            });
        });
        for (const preset of presetMeasures) {
            expect(preset.fits, `${preset.label} stays inside its group at ${viewport.width}x${viewport.height}`).toBe(true);
            expect(preset.width).toBeGreaterThanOrEqual(44);
            expect(preset.height).toBeGreaterThanOrEqual(44);
        }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await openSettingsSection(dialog, "Map");
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(selectedCountry).toHaveCount(0);
    await expect.poll(() => countrySearch.evaluate((element: HTMLInputElement) => element.validity.customError)).toBe(true);
    await expect.poll(() => countrySearch.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("Choose one country from the results or map.");

    await expect(dialog).toBeVisible(); // Opening Country cannot save the previous World selection.
    await dialog.getByRole("button", { name: /^continents$/i }).click();
    await expect(countrySearch).toHaveCount(0);
    await dialog.getByRole("button", { name: /^europe$/i }).click();
    await expectSaved(catalog.continents.find((continent) => continent.id === "EU")!.codes);

    await open();
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(selectedCountry).toHaveCount(0);
    await countrySearch.fill("sI");
    await expect(sloveniaRow).toBeVisible(); // Code is not a substring of its name.
    await expect(countryResults.locator('label:has(input[value="SI"]) .country-flag')).toHaveCSS("background-image", /flags32\.webp/);
    await countrySearch.fill("sLoVeNiA");
    await expect(countryResults.getByRole("radio")).toHaveCount(1);
    await expect(sloveniaRow).not.toBeChecked(); // Filtering never chooses the first match.
    await expect.poll(() => countrySearch.evaluate((element: HTMLInputElement) => element.validity.customError)).toBe(true);
    await countrySearch.press("ArrowDown");
    await expect(sloveniaRow).toBeFocused();
    await sloveniaRow.press("Enter");
    await expect(sloveniaRow).toBeChecked();
    await expect.poll(() => countrySearch.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true);
    await countrySearch.fill("no-such-country");
    await expect(dialog.getByText("No countries match these filters.", { exact: true })).toBeVisible();
    await expect(selectedCountry).toContainText("Slovenia");
    await countrySearch.press("Enter");
    await expect(dialog).toBeVisible(); // Search Enter must not submit a valid draft either.
    await dialog.getByRole("button", { name: /^clear country search$/i }).click();
    await expect(countrySearch).toHaveValue("");
    await expect(countryResults.getByRole("radio")).toHaveCount(catalog.countries.length);
    await expect(sloveniaRow).toBeChecked();
    await countrySearch.fill("no-such-country");
    const small = await expectSaved(["SI"]);
    expect(Number(small.conf.scoreScaleKm)).toBeLessThan(catalog.scoring.worldHalfKm);
    await open();
    await countrySearch.fill("no-such-country");
    // Enter the newly fitted continent with real Tab navigation. Retaining
    // Slovenia as the sole roving tab stop would focus an invisible country.
    await dialog.getByRole("button", { name: /^continents$/i }).click();
    const oceania = dialog.getByRole("button", { name: /^oceania$/i });
    await oceania.click();
    let focusedCountry = "";
    for (let step = 0; step < 8 && !focusedCountry; step++) {
        await page.keyboard.press("Tab");
        focusedCountry = await page.evaluate(() => document.activeElement?.getAttribute("data-country") || "");
    }
    expect(catalog.continents.find((continent) => continent.id === "OC")!.codes, "Tab must enter a country in the displayed continent").toContain(focusedCountry);
    expect(
        await page.evaluate(() => {
            const active = document.activeElement;
            const viewport = active instanceof SVGElement ? active.ownerSVGElement?.getBoundingClientRect() : undefined;
            return (
                !!viewport &&
                !!active?.matches(":focus-visible") &&
                Array.from(active.querySelectorAll("path")).some((path) => {
                    const bounds = path.getBoundingClientRect();
                    return bounds.right > viewport.left && bounds.left < viewport.right && bounds.bottom > viewport.top && bounds.top < viewport.bottom;
                })
            );
        }),
        "The keyboard focus indicator must intersect the visible map"
    ).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-country"))).not.toBe(focusedCountry);
    await expect(oceania).toHaveAttribute("aria-pressed", "true"); // Browsing the SVG must not choose another region.
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-country"))).toBe(focusedCountry);
    await page.keyboard.press("Enter");
    await expect(oceania).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(countrySearch).toHaveValue("");
    await expect(countryResults.getByRole("radio")).toHaveCount(catalog.countries.length);
    await countrySearch.fill("SI");
    await sloveniaRow.click();
    await openSettingsSection(dialog, "Scoring & powerups");
    await expect(automatic).toBeChecked();
    await automatic.uncheck();
    await factor.press("Home");
    await factor.press("ArrowRight");
    await expect(factor).toHaveValue("2");
    const manual = await expectSaved(["SI"], "manual");
    expect(manual.conf.scoreFactor).toBe(2);
    await open();
    await countrySearch.fill("lU");
    const luxembourgRow = countryResults.getByRole("radio", { name: /^Luxembourg LU$/ });
    await expect(luxembourgRow).toBeVisible();
    await expect(selectedCountry).toContainText("Slovenia");
    await luxembourgRow.click();
    await expect(luxembourgRow).toBeChecked();
    await expectSaved(["LU"]); // A different region resets the manual override.

    await open();
    await dialog.getByRole("button", { name: /^custom$/i }).click();
    await expect(countrySearch).toHaveCount(0);
    await dialog.getByRole("button", { name: /^clear selection$/i }).click();
    await expect(dialog.getByRole("button", { name: /^choose a country/i })).toBeVisible();
    const search = dialog.getByRole("searchbox", { name: /^find countries$/i });
    const customResults = dialog.getByRole("group", { name: /^custom country search results$/i });
    for (const country of ["SI", "NZ"]) {
        await search.fill(country);
        const choice = customResults.locator(`input[type="checkbox"][value="${country}"]`);
        await choice.check();
        await expect(choice).toBeChecked();
    }
    const custom = await expectSaved(["SI", "NZ"]);
    expect(Number(custom.conf.scoreScaleKm)).toBeGreaterThan(Number(small.conf.scoreScaleKm));
    await open();
    await expect(dialog.getByRole("button", { name: /^custom$/i })).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(selectedCountry).toHaveCount(0);
    await expect.poll(() => countrySearch.evaluate((element: HTMLInputElement) => element.validity.customError)).toBe(true);
    await expect(dialog).toBeVisible(); // A multi-country Custom draft also needs an explicit single choice.
    await dialog.getByRole("button", { name: "Show map" }).click();
    const slovenia = dialog.locator('[data-country="SI"]').first();
    await slovenia.focus();
    await slovenia.press("Enter");
    await dialog.getByRole("button", { name: "Back to countries" }).click();
    await expect(sloveniaRow).toBeChecked();
    await expect.poll(() => countrySearch.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true);
    await expectSaved(["SI"]);
    await open();
    await dialog.getByRole("button", { name: /^world$/i }).click();
    await expectSaved([]);

    // A real fine-pointer desktop actor becomes host, not merely a resized touch viewport.
    const handoff = peer.mark();
    await leave(host);
    await peer.snapshot((lobby) => lobby.admin === peer.id && lobby.numPlayers === 1, handoff);
    await peer.page.getByRole("button", { name: /^(modify|edit settings|settings)$/i }).click();
    const desktop = peer.page.getByRole("dialog", { name: /^lobby settings$/i });
    await openSettingsSection(desktop, "Map");
    await desktop.getByRole("button", { name: /^country$/i }).click();
    const map = desktop.getByRole("group", { name: /^choose a playable region$/i });
    const worldView = await map.getAttribute("viewBox");
    expect(worldView).not.toBeNull();
    const worldSelectedCount = await map.locator('[data-country][aria-pressed="true"]').count();
    expect(worldSelectedCount).toBeGreaterThan(1);
    // Select through a real pointer hit on a filled local SVG path (not a synthetic event).
    const france = desktop.locator('[data-country="FR"]').first();
    await france.scrollIntoViewIfNeeded();
    const francePoint = () =>
        france.evaluate((target) => {
            const paths = target instanceof SVGGeometryElement ? [target] : Array.from(target.querySelectorAll<SVGGeometryElement>("path"));
            const viewport = (target as SVGElement).ownerSVGElement?.getBoundingClientRect();
            if (!viewport) return null;
            for (const path of paths) {
                const bounds = path.getBBox();
                const matrix = path.getScreenCTM();
                if (!matrix) continue;
                const topLeft = new DOMPoint(bounds.x, bounds.y).matrixTransform(matrix);
                const bottomRight = new DOMPoint(bounds.x + bounds.width, bounds.y + bounds.height).matrixTransform(matrix);
                const inverse = matrix.inverse();
                // Compound paths include overseas territories. A coarse 9x9 grid
                // over that huge box can miss every visible land fragment.
                // Use integer pointer coordinates inside the fill, not a subpixel
                // coastal boundary that a native Firefox mouse event can round off.
                for (let y = Math.ceil(Math.max(viewport.top, topLeft.y)) + 1; y < Math.min(viewport.bottom, bottomRight.y); y++)
                    for (let x = Math.ceil(Math.max(viewport.left, topLeft.x)) + 1; x < Math.min(viewport.right, bottomRight.x); x++) {
                        const local = new DOMPoint(x, y).matrixTransform(inverse);
                        if (!path.isPointInFill(local)) continue;
                        if (
                            [
                                [0, 0],
                                [-1, 0],
                                [1, 0],
                                [0, -1],
                                [0, 1],
                            ].every(
                                ([dx, dy]) =>
                                    document
                                        .elementFromPoint(x + dx!, y + dy!)
                                        ?.closest("[data-country]")
                                        ?.getAttribute("data-country") === "FR"
                            )
                        )
                            return { x, y };
                    }
            }
            return null;
        });
    let point = await francePoint();
    expect(point, "A visible France path must have a genuine pointer hit target").not.toBeNull();
    const mapBounds = await map.boundingBox();
    expect(mapBounds).not.toBeNull();
    const pan = point!.x + 40 < mapBounds!.x + mapBounds!.width ? 40 : -40;
    await peer.page.mouse.move(point!.x, point!.y);
    await peer.page.mouse.down();
    await peer.page.mouse.move(point!.x + pan, point!.y, { steps: 8 });
    await peer.page.mouse.up();
    await expect(map).not.toHaveAttribute("viewBox", worldView!);
    // Starting a drag on France must not replace World with France on release.
    await expect(map.locator('[data-country][aria-pressed="true"]')).toHaveCount(worldSelectedCount);
    await expect(desktop.locator(".current-country")).toHaveCount(0);
    await expect.poll(() => desktop.getByRole("searchbox", { name: /^choose a country$/i }).evaluate((input: HTMLInputElement) => input.validity.customError)).toBe(true);
    await desktop.getByRole("button", { name: /^reset map$/i }).click();
    await expect(map).toHaveAttribute("viewBox", worldView!);
    await france.scrollIntoViewIfNeeded();
    point = await francePoint();
    expect(point, "France must still have a genuine hit target after resetting the panned map").not.toBeNull();
    await peer.page.mouse.click(point!.x, point!.y);
    const franceRow = desktop.getByRole("radiogroup", { name: /^country search results$/i }).getByRole("radio", { name: /^France FR$/ });
    const selectedShapes = map.locator('[data-country][aria-pressed="true"]');
    const unchangedSelection = async () => {
        await expect(franceRow).toBeChecked();
        await expect(selectedShapes).toHaveCount(1);
        await expect(selectedShapes).toHaveAttribute("data-country", "FR");
    };
    await unchangedSelection();
    await expect(map).toHaveAttribute("viewBox", worldView!); // A direct map choice preserves the user's camera.
    await desktop.getByRole("button", { name: /^zoom in$/i }).click();
    await expect(map).not.toHaveAttribute("viewBox", worldView!);
    await unchangedSelection();
    await desktop.getByRole("button", { name: /^zoom out$/i }).click();
    await expect.poll(() => map.evaluate((svg: SVGSVGElement) => svg.viewBox.baseVal.width)).toBe(Number(worldView!.split(" ")[2]));
    await unchangedSelection();
    await desktop.getByRole("button", { name: /^zoom in$/i }).click();
    await desktop.getByRole("button", { name: /^reset map$/i }).click();
    await expect(map).toHaveAttribute("viewBox", worldView!);
    await expect(desktop.getByRole("button", { name: /^reset map$/i })).toBeDisabled();
    await unchangedSelection();
    await desktop.getByRole("button", { name: /^fit selection$/i }).click();
    await expect(map).not.toHaveAttribute("viewBox", worldView!);
    await unchangedSelection();
    await peer.page.keyboard.press("Escape");
    await expect(desktop).toHaveCount(0);
    await expect(peer.page.getByRole("button", { name: /^(modify|edit settings|settings)$/i })).toBeFocused();
    await leave(peer);
    await reservedAfterLeave(id);
    expect(run.started.size).toBe(0);
    expect(run.sdkRequests).toBe(0);
    expect(run.startPermits).toBe(0);
    run.assertHealthy();
});
