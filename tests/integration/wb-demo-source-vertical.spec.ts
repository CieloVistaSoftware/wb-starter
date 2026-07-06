import { test, expect } from '@playwright/test';

/**
 * Standard §5 (#254) + §6 (#248): every `<wb-demo>` source panel is VERTICAL —
 * a multi-attribute element renders one attribute per line — and NEVER shows a
 * horizontal scrollbar (it wraps). Enforced on the components page, which has the
 * most wb-demos; the fix is systemic in `src/wb-viewmodels/demo.js`.
 */
test.describe('wb-demo source is vertical + never horizontally scrolls (#254, #248)', () => {
  test('§6 — no wb-demo source panel horizontally scrolls', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.locator('wb-demo pre').count(), { timeout: 20000 })
      .toBeGreaterThan(5);

    const offenders = await page.$$eval('wb-demo pre', (els) =>
      els
        .map((el, i) => ({
          i,
          hScroll: el.scrollWidth > el.clientWidth + 2,
          centered: getComputedStyle(el).textAlign === 'center',
          whiteSpace: getComputedStyle(el).whiteSpace,
        }))
        // §5: code is left-aligned, never centered; §6: never horizontally scrolls.
        .filter((x) => x.hScroll || x.centered)
    );
    expect(offenders, `wb-demo source panels that scroll or are center-aligned:\n${JSON.stringify(offenders, null, 2)}`).toEqual([]);
  });

  test('§5 — a multi-attribute element renders one attribute per line', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
    const pricingSrc = page
      .locator('wb-demo pre code')
      .filter({ hasText: 'wb-cardpricing' })
      .first();
    await expect(pricingSrc).toBeVisible({ timeout: 20000 });

    const txt = (await pricingSrc.textContent()) || '';
    // opening tag on its own line, then each attribute indented on its own line
    expect(txt, 'multi-attribute element must be broken one-attribute-per-line').toMatch(
      /<wb-cardpricing\n\s+plan=/
    );
    expect(txt.split('\n').length, 'source should be multi-line (vertical)').toBeGreaterThan(4);
  });

  test('§20 — rendered source never shows a worthless x-*="" (#261)', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.locator('wb-demo pre code').count(), { timeout: 20000 })
      .toBeGreaterThan(5);

    // Boolean attributes serialize as x-foo="" via innerHTML; the pretty-printer
    // must emit them BARE in every displayed code panel.
    const offenders = await page.$$eval('wb-demo pre code', (els) =>
      els
        .map((el, i) => ({ i, hit: ((el.textContent || '').match(/x-[a-z][a-z0-9-]*=""/g) || []) }))
        .filter((x) => x.hit.length)
        .map((x) => `panel ${x.i}: ${[...new Set(x.hit)].join(', ')}`)
    );
    expect(offenders, `code panels showing x-*="":\n${offenders.join('\n')}`).toEqual([]);
  });
});
