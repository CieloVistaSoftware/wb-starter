import { test, expect } from '../fixtures/offline';

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
    // Its own fixture, not the behaviors showcase: that page renders examples
    // on demand now (#666/#910), so a fixed `[x-countdown][to]` demo is no
    // longer on it at load and this failed on the page, not the behavior.
    // The markup is the one data/behavior-examples.json ships, with a target
    // always two years out so the test cannot age into "complete".
    const future = `${new Date().getFullYear() + 2}-12-31`;
    await page.goto('/tests/fixtures/blank.html');
    await page.setContent(`
      <div id="cd" x-countdown to="${future}" class="time-display"></div>
      <script type="module">
        import WB from '/src/core/wb.js';
        WB.init({ autoInject: true }).then(() => WB.scan(document.body, { eager: true }));
      </script>
    `);

    const el = page.locator('[x-countdown][to]').first();
    await expect(el).toHaveAttribute('x-ready', '', { timeout: 10000 });

    const toAttr = await el.getAttribute('to');
    expect(toAttr, 'demo must target a real future date').toBeTruthy();
    const targetYear = new Date(toAttr!).getFullYear();
    expect(targetYear).toBeGreaterThan(new Date().getFullYear());

    const first = (await el.textContent())?.trim();
    expect(first, 'must not be stuck at 00:00 when counting down to a multi-year-future date').not.toBe('00:00');
    // #1237: not awaited, this assertion was never actually checked.
    await expect(el, 'a live countdown must never carry the complete marker class').not.toHaveClass(/x-countdown--complete/);

    // A target this far out (months away) must render in "<N>d HH:MM:SS"
    // form. This is the assertion that actually catches the bug: countdown()
    // ignoring `to` and falling through to its unconditional 60s default
    // ALSO produces a ticking, non-"00:00" display (e.g. "00:59") -- so
    // those two checks alone pass even when `to` is completely ignored.
    // Only a days-format render proves the real target date was read.
    expect(first, `expected "<days>d HH:MM:SS" format for a months-away target, got "${first}"`).toMatch(/^\d+d \d{2}:\d{2}:\d{2}$/);

    // Confirm it's actually ticking, not just a lucky non-"00:00" render.
    // Polled until the display changes (#1516: not a fixed 1100ms).
    await expect.poll(async () => (await el.textContent())?.trim(), {
      message: 'countdown display must change over time (it is ticking)', timeout: 5000,
    }).not.toBe(first);
  });
});
