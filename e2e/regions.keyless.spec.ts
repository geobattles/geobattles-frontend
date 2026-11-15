import { test, expect } from "./support/fixtures";
import { createLobby, disposed, joinInvite, leave, registerGuest, setReady } from "./support/ui";
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
    const open = async () => {
        await page.getByRole("button", { name: /^(modify|edit settings|settings)$/i }).click();
        await expect(dialog.getByRole("button", { name: /^world$/i })).toBeEnabled();
    };
    const save = async (codes: string[], mode = "auto") => {
        const mark = peer.mark();
        await dialog.getByRole("button", { name: /^save settings$/i }).click();
        const snapshot = await peer.snapshot(
            (lobby) => lobby.conf.scoringMode === mode && JSON.stringify([...(lobby.conf.ccList as string[])].sort()) === JSON.stringify([...codes].sort()),
            mark
        );
        expect(Object.values(snapshot.playerList).every((player) => player.ready)).toBe(true);
        await expect(dialog).toHaveCount(0);
        if (mode === "auto") expect(Number(snapshot.conf.scoreScaleKm)).toBeCloseTo(regionScoreScale(codes, catalog), 6);
        return snapshot;
    };
    await open();
    await expect(dialog.getByRole("button", { name: /^world$/i })).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("searchbox", { name: /^find a country$/i })).toHaveCount(0);
    const countrySearch = dialog.getByRole("searchbox", { name: /^search countries$/i });
    const countrySelect = dialog.getByRole("combobox", { name: /^country$/i });
    await expect(countrySearch).toHaveCount(0);
    await expect(dialog.getByRole("slider", { name: /^score factor/i })).toBeHidden();
    for (const viewport of [
        { width: 320, height: 568 },
        { width: 390, height: 844 },
        { width: 568, height: 256 },
        { width: 844, height: 390 },
        { width: 1024, height: 768 },
    ]) {
        await page.setViewportSize(viewport);
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
                overflow: element.scrollWidth > element.clientWidth + 1,
                undersized,
            };
        });
        expect(measures.fits, "The native settings dialog must fit the viewport").toBe(true);
        expect(measures.overflow, "No horizontal scrolling inside settings").toBe(false);
        expect(measures.undersized, "Ordinary controls retain 44px targets").toEqual([]);
        await expect(dialog.getByRole("button", { name: /^save settings$/i })).toBeInViewport();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(countrySelect).toHaveValue("");
    expect(await countrySelect.evaluate((element: HTMLSelectElement) => element.required && element.validity.valueMissing)).toBe(true);
    await dialog.getByRole("button", { name: /^save settings$/i }).click();
    await expect(dialog).toBeVisible(); // Opening Country cannot save the previous World selection.
    await dialog.getByRole("button", { name: /^continents$/i }).click();
    await expect(countrySearch).toHaveCount(0);
    await dialog.getByRole("button", { name: /^europe$/i }).click();
    await save(catalog.continents.find((continent) => continent.id === "EU")!.codes);

    await open();
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(countrySelect).toHaveValue("");
    await countrySearch.fill("sI");
    await expect(countrySelect.locator('option[value="SI"]')).toHaveText("Slovenia"); // Code is not a substring of its name.
    await countrySearch.fill("sLoVeNiA");
    await expect(countrySelect.locator('option:not([value=""])')).toHaveText(["Slovenia"]);
    await expect(countrySelect).toHaveValue(""); // Filtering never chooses the first match.
    await countrySelect.selectOption("SI");
    await countrySearch.fill("no-such-country");
    await expect(dialog.getByText("No countries match your search.", { exact: true })).toBeVisible();
    await expect(countrySelect).toHaveValue("SI");
    await expect(countrySelect.locator("option:checked")).toContainText("Slovenia");
    await countrySearch.press("Enter");
    await expect(dialog).toBeVisible(); // Search Enter must not submit a valid draft either.
    await dialog.getByRole("button", { name: /^clear country search$/i }).click();
    await expect(countrySearch).toHaveValue("");
    await expect(countrySelect.locator('option:not([value=""])')).toHaveCount(catalog.countries.length);
    await expect(countrySelect).toHaveValue("SI");
    await countrySearch.fill("no-such-country");
    const small = await save(["SI"]);
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
    await page.keyboard.press("Enter");
    await expect(oceania).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(countrySearch).toHaveValue("");
    await expect(countrySelect.locator('option:not([value=""])')).toHaveCount(catalog.countries.length);
    await dialog.getByRole("combobox", { name: /^country$/i }).selectOption("SI");
    const advanced = dialog.locator("details.advanced-settings");
    await advanced.locator("summary").click();
    await expect(advanced.getByRole("checkbox", { name: /^automatic scoring/i })).toBeChecked();
    await advanced.getByRole("checkbox", { name: /^automatic scoring/i }).uncheck();
    const factor = advanced.getByRole("slider", { name: /^score factor/i });
    await factor.press("Home");
    await factor.press("ArrowRight");
    await expect(factor).toHaveValue("2");
    const manual = await save(["SI"], "manual");
    expect(manual.conf.scoreFactor).toBe(2);
    await open();
    await countrySearch.fill("lU");
    await expect(countrySelect.locator('option[value="LU"]')).toHaveText("Luxembourg");
    await expect(countrySelect).toHaveValue("SI");
    await countrySelect.selectOption("LU");
    await expect(countrySelect).toHaveValue("LU");
    await save(["LU"]); // A different region resets the manual override.

    await open();
    await dialog.getByRole("button", { name: /^custom$/i }).click();
    await expect(countrySearch).toHaveCount(0);
    await dialog.getByRole("button", { name: /^clear$/i }).click();
    await expect(dialog.getByRole("button", { name: /^save settings$/i })).toBeDisabled();
    const search = dialog.getByRole("searchbox", { name: /^find a country$/i });
    for (const country of ["SI", "NZ"]) {
        await search.fill(country);
        await dialog.locator(`input[type="checkbox"][value="${country}"]`).check();
    }
    const custom = await save(["SI", "NZ"]);
    expect(Number(custom.conf.scoreScaleKm)).toBeGreaterThan(Number(small.conf.scoreScaleKm));
    await open();
    await expect(dialog.getByRole("button", { name: /^custom$/i })).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: /^country$/i }).click();
    await expect(countrySelect).toHaveValue("");
    expect(await countrySelect.evaluate((element: HTMLSelectElement) => element.validity.valueMissing)).toBe(true);
    await dialog.getByRole("button", { name: /^save settings$/i }).click();
    await expect(dialog).toBeVisible(); // A multi-country Custom draft also needs an explicit single choice.
    const slovenia = dialog.locator('[data-country="SI"]').first();
    await slovenia.focus();
    await slovenia.press("Enter");
    await expect(dialog.getByRole("combobox", { name: /^country$/i })).toHaveValue("SI");
    await save(["SI"]);
    await open();
    await dialog.getByRole("button", { name: /^world$/i }).click();
    await save([]);

    // A real fine-pointer desktop actor becomes host, not merely a resized touch viewport.
    const handoff = peer.mark();
    await leave(host);
    await peer.snapshot((lobby) => lobby.admin === peer.id && lobby.numPlayers === 1, handoff);
    await peer.page.getByRole("button", { name: /^(modify|edit settings|settings)$/i }).click();
    const desktop = peer.page.getByRole("dialog", { name: /^lobby settings$/i });
    await desktop.getByRole("button", { name: /^country$/i }).click();
    // Select through a real pointer hit on a filled local SVG path (not a synthetic event).
    const france = desktop.locator('[data-country="FR"]').first();
    await france.scrollIntoViewIfNeeded();
    const point = await france.evaluate((target) => {
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
            for (let y = Math.max(viewport.top, topLeft.y) + 1; y < Math.min(viewport.bottom, bottomRight.y); y += 2)
                for (let x = Math.max(viewport.left, topLeft.x) + 1; x < Math.min(viewport.right, bottomRight.x); x += 2) {
                    const local = new DOMPoint(x, y).matrixTransform(inverse);
                    if (!path.isPointInFill(local)) continue;
                    if (document.elementFromPoint(x, y)?.closest("[data-country]")?.getAttribute("data-country") === "FR") return { x, y };
                }
        }
        return null;
    });
    expect(point, "A visible France path must have a genuine pointer hit target").not.toBeNull();
    await peer.page.mouse.click(point!.x, point!.y);
    await expect(desktop.getByRole("combobox", { name: /^country$/i })).toHaveValue("FR");
    await peer.page.keyboard.press("Escape");
    await expect(desktop).toHaveCount(0);
    await expect(peer.page.getByRole("button", { name: /^(modify|edit settings|settings)$/i })).toBeFocused();
    await leave(peer);
    await disposed(id);
    expect(run.started.size).toBe(0);
    expect(run.sdkRequests).toBe(0);
    expect(run.startPermits).toBe(0);
    run.assertHealthy();
});
