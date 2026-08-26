import { test, expect } from '@playwright/test';

/**
 * Code block wrap / scroll behaviour (#826).
 *
 * Rewritten. The previous version of this file could not pass:
 *
 *   - it asserted `white-space: pre-wrap` as the DEFAULT, which is the
 *     contract #199 deliberately reversed. Code blocks read like a code
 *     editor now: they do not wrap, they scroll, and wrapping is opt-in.
 *   - it used `<code>`, a component tag registered in no map, and closed
 *     it with `</pre>`. Components are gone entirely now.
 *   - it built the page with `page.setContent()` and a root-absolute
 *     `<script src="/src/index.js">`. setContent runs against about:blank, so
 *     that script has nothing to resolve against and WB never initialises —
 *     the same harness problem as #735 and #691.
 *
 * The behaviour is worth covering, so this tests the real thing: a plain
 * `<pre>`, which `nativeMap` upgrades via auto-injection, on a real page that
 * has actually loaded the runtime.
 */

/** Render markup into a page that has WB loaded, then upgrade it. */
async function render(page: import('@playwright/test').Page, markup: string) {
  await page.goto('/demos/autoinject.html');
  await page.waitForFunction(() => !!(window as any).WB);
  await page.evaluate((html) => { document.body.innerHTML = html; }, markup);
  await page.evaluate(async () => { await (window as any).WB.scan(document.body); });
  // Wait on the class the behavior adds rather than a fixed timeout — a sleep
  // here is how this kind of spec ends up on the flaky list.
  await page.waitForSelector('.x-pre', { timeout: 5000 });
}

const LONG = 'const veryLongLine = "'.padEnd(200, 'x') + '";';

test.describe('Code block wrap and scroll', () => {
  test('a plain <pre> is upgraded by auto-injection', async ({ page }) => {
    await render(page, `<pre id="p"><code>${LONG}</code></pre>`);
    // No x-pre attribute, no x-code tag — the element's own tag is the signal.
    await expect(page.locator('#p')).toHaveClass(/x-pre/);
  });

  test('by default it does NOT wrap — it scrolls horizontally (#199)', async ({ page }) => {
    await render(page, `<pre id="p"><code>${LONG}</code></pre>`);
    const pre = page.locator('#p');

    await expect(pre).toHaveCSS('white-space', 'pre');
    await expect(pre).toHaveCSS('overflow-x', 'auto');
    await expect(pre).not.toHaveClass(/x-pre--wrap/);

    // The point of not wrapping: the content really is wider than the box, so
    // there is something to scroll. Asserting the CSS alone would pass on an
    // empty element.
    const overflows = await pre.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflows, 'a long line should overflow a non-wrapping code block').toBe(true);
  });

  test('wrap="true" opts into wrapping', async ({ page }) => {
    await render(page, `<pre id="p" wrap="true"><code>${LONG}</code></pre>`);
    const pre = page.locator('#p');

    await expect(pre).toHaveClass(/x-pre--wrap/);
    await expect(pre).toHaveCSS('white-space', 'pre-wrap');

    const overflows = await pre.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflows, 'a wrapping code block should not overflow horizontally').toBe(false);
  });

  test('max-height makes a tall block scroll vertically', async ({ page }) => {
    const many = Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n');
    await render(page, `<pre id="p" max-height="8rem"><code>${many}</code></pre>`);
    const pre = page.locator('#p');

    await expect(pre).toHaveClass(/x-pre--has-max-height/);
    const scrolls = await pre.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(scrolls, 'a capped block should overflow vertically').toBe(true);
  });
});
