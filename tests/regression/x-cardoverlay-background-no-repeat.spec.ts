import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#635): John, screenshot -- "Is this correct, the edges have
 * a gap" -- a thin visible sliver along a <div x-cardoverlay>'s left/bottom
 * edges. Root cause: composeCard() sets the SHORTHAND
 * `element.style.background = '...'` for cards that don't own their own
 * surface -- a default-variant cardoverlay doesn't -- which implicitly
 * resets every background-* sub-property NOT in the shorthand value to its
 * initial value, i.e. background-repeat: repeat. cardoverlay() only ever
 * overrode backgroundImage/backgroundSize/backgroundPosition (longhand)
 * afterward, leaving that reset `repeat` behind -- with
 * background-size:cover, any sub-pixel rounding gap at the scaled edge had
 * nothing to fall back to but tiling a sliver of the image's own edge
 * pixels into it.
 *
 * Why no earlier test caught this: no compliance/regression test ever
 * asserted on `background-repeat` specifically for any card -- coverage
 * existed for cropping/aspect-ratio (x-cardoverlay-not-cropped-narrow) and
 * for the image failing to load at all (#605), but not for this exact
 * shorthand-vs-longhand CSS interaction, which only manifests as a few
 * pixels' visible seam, easy to miss without a computed-style assertion.
 */

async function renderOverlay(page, markup: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    ${markup}
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 });
  await page.waitForTimeout(300);
}

test.describe('[x-cardoverlay] background-repeat stays no-repeat (#635)', () => {
  test('default-variant cardoverlay (the case composeCard\'s shorthand affects) computes background-repeat: no-repeat', async ({ page }) => {
    await renderOverlay(page, `<div x-cardoverlay id="ov" image="https://picsum.photos/seed/regtest635/800/500" title="Test"></div>`);
    const repeat = await page.locator('#ov').evaluate((el) => getComputedStyle(el).backgroundRepeat);
    expect(repeat, 'background-repeat left at the browser default (repeat) by composeCard\'s shorthand `background` reset -- must be forced to no-repeat').toBe('no-repeat');
  });

  test('background-size stays cover and background-image is the real image (no other regression from the fix)', async ({ page }) => {
    await renderOverlay(page, `<div x-cardoverlay id="ov" image="https://picsum.photos/seed/regtest635b/800/500" title="Test"></div>`);
    const info = await page.locator('#ov').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { size: cs.backgroundSize, hasImage: cs.backgroundImage.includes('regtest635b') };
    });
    expect(info.size).toBe('cover');
    expect(info.hasImage).toBe(true);
  });

  test('a glass/bordered/flat-variant card (which composeCard does NOT shorthand-reset) is unaffected either way', async ({ page }) => {
    // These variants skip composeCard's shorthand `background` assignment
    // entirely (ownsOwnSurface) -- included to document that the fix's
    // explicit backgroundRepeat set is harmless/correct for them too, not
    // just the default-variant case that originally exposed the bug.
    await renderOverlay(page, `<div x-cardoverlay id="ov" image="https://picsum.photos/seed/regtest635c/800/500" title="Test" variant="glass"></div>`);
    const repeat = await page.locator('#ov').evaluate((el) => getComputedStyle(el).backgroundRepeat);
    expect(repeat).toBe('no-repeat');
  });
});
