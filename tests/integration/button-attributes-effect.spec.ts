import { test, expect } from '@playwright/test';

/**
 * Standard §19: a declared attribute must actually WORK, not just render. A native
 * <button size="…"/variant="…"> must apply real styling — the button behavior maps
 * the size/variant attribute to its .wb-button--* class (only classes are styled;
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
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 });
}

test.describe('native button size & variant attributes have real effect (§19)', () => {
  test('size attribute changes the rendered size (#258)', async ({ page }) => {
    await renderButtons(page);
    const xs = page.locator('#b-xs');
    const xl = page.locator('#b-xl');
    await expect(xs).toHaveClass(/wb-button--xs/, { timeout: 10000 });
    await expect(xl).toHaveClass(/wb-button--xl/, { timeout: 10000 });

    const xsFs = await xs.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const xlFs = await xl.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(xlFs, `xl (${xlFs}px) must render larger than xs (${xsFs}px)`).toBeGreaterThan(xsFs);
  });

  test('variant attribute changes the rendered style', async ({ page }) => {
    await renderButtons(page);
    const primary = page.locator('#b-primary');
    const danger = page.locator('#b-danger');
    await expect(primary).toHaveClass(/wb-button--primary/, { timeout: 10000 });
    await expect(danger).toHaveClass(/wb-button--danger/, { timeout: 10000 });

    const pBg = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
    const dBg = await danger.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dBg, `primary bg (${pBg}) and danger bg (${dBg}) must differ`).not.toBe(pBg);
  });
});
