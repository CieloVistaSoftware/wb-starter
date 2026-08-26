import { test, expect } from '@playwright/test';

/**
 * Standard §19: a declared attribute must actually WORK, not just render. A native
 * <button size="…"/variant="…"> must apply real styling — the button behavior maps
 * the size/variant attribute to its .x-button--* class (only classes are styled;
 * the bare attribute did nothing on a native <button>). #258
 *
 * Rendered on a lightweight served fixture (not the heavy autoinject.html, which
 * starved of CPU under parallel load and hydrated too slowly — #269). goto('/')
 * first so the absolute module import resolves, then setContent + wait for hydrate.
 */
async function renderButtons(page) {
  await page.goto('/');
  await page.setContent(`
    <link rel="stylesheet" href="/src/styles/themes.css">
    <link rel="stylesheet" href="/src/styles/site.css">
    <style>
      /* button.css's .x-button base rule has transition: all 0.2s ease --
         this test asserts the FINAL computed values a size/variant class
         produces, not the animation between them. Without this, reading
         getComputedStyle() right after the class assertion passes can catch
         font-size mid-transition (#379) -- rare in isolation where the JS
         round-trip and the 200ms transition rarely line up badly, much more
         likely under 8-worker load where round-trip timing varies more. */
      * { transition: none !important; }
    </style>
    <button size="xs" id="b-xs">XS</button>
    <button size="xl" id="b-xl">XL</button>
    <button variant="primary" id="b-primary">Primary</button>
    <button variant="danger" id="b-danger">Danger</button>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  // 15s was already a bump for CPU-starved parallel load (#269) but still
  // occasionally not enough under the full 8-worker suite -- WB.init()+scan()
  // genuinely takes longer when every worker is contending for CPU at once,
  // not a code regression. 30s gives real headroom instead of chasing this
  // one file's budget test-by-test.
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });
}

test.describe('native button size & variant attributes have real effect (§19)', () => {
  test('size attribute changes the rendered size (#258)', async ({ page }) => {
    await renderButtons(page);
    const xs = page.locator('#b-xs');
    const xl = page.locator('#b-xl');
    await expect(xs).toHaveClass(/x-button--xs/, { timeout: 20000 });
    await expect(xl).toHaveClass(/x-button--xl/, { timeout: 20000 });

    const xsFs = await xs.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const xlFs = await xl.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(xlFs, `xl (${xlFs}px) must render larger than xs (${xsFs}px)`).toBeGreaterThan(xsFs);
  });

  test('variant attribute changes the rendered style', async ({ page }) => {
    await renderButtons(page);
    const primary = page.locator('#b-primary');
    const danger = page.locator('#b-danger');
    await expect(primary).toHaveClass(/x-button--primary/, { timeout: 20000 });
    await expect(danger).toHaveClass(/x-button--danger/, { timeout: 20000 });

    const pBg = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
    const dBg = await danger.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dBg, `primary bg (${pBg}) and danger bg (${dBg}) must differ`).not.toBe(pBg);
  });
});
