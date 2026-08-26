import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#376 / BUG-2026-07-27-003): <div x-countdown to="2027-12-31">
 * (the markup pages/behaviors.html actually ships) showed a static 00:00
 * instead of counting down. Three-way attribute-name mismatch:
 *   - countdown() (src/wb-viewmodels/helpers.js) read only `date`
 *   - pages/behaviors.html used `to`
 *   - scripts/generate-behaviors-page.js (the page's own generator) emitted
 *     `data-to`, a THIRD name that also doesn't match `date`
 * None of the three agreed, so config.date was always '', config.seconds
 * was always 0, and countdown() fell through to its unconditional 60s
 * default -- fine on its own, except every existing countdown had long
 * since finished by the time anyone looked, always showing 00:00.
 */
test.describe('x-countdown honors to="..." as the target date (#376)', () => {
  test('counts down to a real future date instead of showing a stuck 00:00', async ({ page }) => {
    await page.goto('/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2500); // lazy injection + schema build, matches alerts-variants.spec.ts

    const el = page.locator('[x-countdown][to]').first();
    await expect(el, 'Behaviors showcase should have an x-countdown[to] demo').toHaveCount(1);

    const toAttr = await el.getAttribute('to');
    expect(toAttr, 'demo must target a real future date').toBeTruthy();
    const targetYear = new Date(toAttr!).getFullYear();
    expect(targetYear).toBeGreaterThan(new Date().getFullYear());

    const first = (await el.textContent())?.trim();
    expect(first, 'must not be stuck at 00:00 when counting down to a multi-year-future date').not.toBe('00:00');
    expect(el, 'a live countdown must never carry the complete marker class').not.toHaveClass(/x-countdown--complete/);

    // A target this far out (months away) must render in "<N>d HH:MM:SS"
    // form. This is the assertion that actually catches the bug: countdown()
    // ignoring `to` and falling through to its unconditional 60s default
    // ALSO produces a ticking, non-"00:00" display (e.g. "00:59") -- so
    // those two checks alone pass even when `to` is completely ignored.
    // Only a days-format render proves the real target date was read.
    expect(first, `expected "<days>d HH:MM:SS" format for a months-away target, got "${first}"`).toMatch(/^\d+d \d{2}:\d{2}:\d{2}$/);

    // Confirm it's actually ticking, not just a lucky non-"00:00" render.
    await page.waitForTimeout(1100);
    const second = (await el.textContent())?.trim();
    expect(second, 'countdown display must change over time (it is ticking)').not.toBe(first);
  });
});
