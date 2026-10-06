import { test, expect } from '../fixtures/offline';

/**
 * Live-reported: docs/V3-GUIDE.md's bare <span x-spinner>/<progress> examples
 * (no size-driving attributes of their own -- a spinner is a small icon,
 * a progress bar has no explicit width) rendered as unreadable
 * single-character-wide vertical strips.
 *
 * Root cause: the single-item shrink-to-fit rule (#486,
 * `x-demo:has(> .x-demo__grid--cols-1 > :only-child) { width: var(--x-
 * demo-shrink-width, fit-content) }`) sizes the WHOLE demo -- code panel
 * included, since .x-demo__code is width:100% of its x-demo parent -- to
 * the control's own measured width. That's correct for a normally-sized
 * control, but a genuinely tiny one (measured 36-68px live) dragged the
 * code panel down to that same width, wrapping the source text one
 * CHARACTER per line. Standard §27 documents horizontal scroll for long
 * lines as the intended behavior, not vertical character-wrapping.
 *
 * Fix: .x-demo__code (and its x-demo parent, so the child's min-width
 * isn't just clipped by an ancestor with a smaller explicit `width`) get a
 * min-width floor of min(320px, 90vw) -- narrow enough to never overflow a
 * genuinely narrow mobile viewport, wide enough that source code is always
 * legible regardless of how small the control itself is.
 */
test.describe('[x-demo] code panels never collapse to unreadable vertical strips', () => {
  test('V3-GUIDE.md: no [x-demo] widget renders narrower than the readable-code floor', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=docs%2FV3-GUIDE.md', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#content', { timeout: 15000 });
    await page.waitForSelector('[x-demo]', { timeout: 15000 });
    // Every demo has built and laid out once WB settles (#1516: not 2000ms).
    // The doc viewer loads WB as a module, so wait for it to exist first.
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));

    const demos = page.locator('[x-demo]');
    const count = await demos.count();
    expect(count, 'expected the guide to have multiple live [x-demo] examples').toBeGreaterThan(1);

    for (let i = 0; i < count; i++) {
      const box = await demos.nth(i).boundingBox();
      if (!box) continue; // not visible -- not this bug's concern
      expect(
        box.width,
        `[x-demo][${i}] rendered only ${Math.round(box.width)}px wide -- collapsed to an unreadable strip.`
      ).toBeGreaterThan(150);
    }
  });

  test('the Spinner example specifically is readable, not a single-character-wide strip', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=docs%2FV3-GUIDE.md', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#content', { timeout: 15000 });

    const label = page.getByText('Spinner —', { exact: false });
    await expect(label.first()).toBeVisible({ timeout: 15000 });

    // x-demo is an ATTRIBUTE (`<div x-demo>`), never a tag -- the old
    // `following-sibling::x-demo` step looked for an <x-demo> element that
    // does not exist, so boundingBox() waited out the test timeout. And the
    // label matches the <strong>/<code> inside the paragraph, so climb to the
    // paragraph before stepping to its sibling.
    const demo = label.first().locator('xpath=ancestor-or-self::p[1]/following-sibling::*[@x-demo][1]');
    await demo.scrollIntoViewIfNeeded();
    // Measure the DEMO once it has settled, not the spinner: the spinner is
    // ready first, while x-demo is still mid-build (measured 64px wide with no
    // code panel yet, then 281px once its shrink-width pass had run).
    await expect(demo).toHaveAttribute('x-ready', '', { timeout: 15000 });
    await expect(demo.locator('.x-demo__code')).toBeVisible();
    const box = await demo.boundingBox();
    expect(box, 'the Spinner [x-demo] must have a measurable box').not.toBeNull();
    expect(box!.width).toBeGreaterThan(150);

    const codeText = await demo.locator('.x-demo__code').innerText();
    // The panel shows the authored source, `<div x-spinner`, not a CSS-style
    // `[x-spinner]` selector -- the text a reader can copy back out.
    expect(codeText, 'code panel text should read as normal wrapped lines, not one character per line').toContain('x-spinner');
  });
});
