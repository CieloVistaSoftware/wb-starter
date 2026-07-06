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
});
