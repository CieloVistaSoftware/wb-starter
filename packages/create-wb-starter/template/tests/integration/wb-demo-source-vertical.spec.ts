import { test, expect, Page } from '@playwright/test';

/**
 * Standard §5 (#254) + §6 (#248): every `<wb-demo>` source panel is VERTICAL —
 * a multi-attribute element renders one attribute per line — and NEVER shows a
 * horizontal scrollbar (it wraps). Enforced on the components page, which has the
 * most wb-demos; the fix is systemic in `src/wb-viewmodels/demo.js`.
 *
 * wb-demo.js (#312) only builds the first few blocks eagerly and lazy-builds
 * the rest via IntersectionObserver as the page scrolls — real perf win on a
 * page with dozens of blocks, but these tests check content across ALL of
 * them, so they need to actually scroll through the page first, same as a
 * real reader would to see blocks below the fold.
 */
async function scrollAllDemosIntoView(page: Page) {
  // Give the page's first eager-built demos time to render — otherwise
  // #siteBody's scrollHeight reads as whatever tiny amount exists at that
  // instant, the loop below thinks it's already at the bottom after one
  // step, and every later block (built only once scrolled near) never
  // gets triggered.
  await page.locator('wb-demo').first().waitFor({ state: 'attached', timeout: 20000 });
  await page.waitForTimeout(500);

  const siteBody = page.locator('#siteBody');
  let lastScrollTop = -1;
  for (let i = 0; i < 80; i++) {
    const { scrollTop } = await siteBody.evaluate((el) => {
      el.scrollTop += 600;
      return { scrollTop: el.scrollTop };
    });
    await page.waitForTimeout(80);
    if (scrollTop === lastScrollTop) break;
    lastScrollTop = scrollTop;
  }
}

test.describe('wb-demo source is vertical + never horizontally scrolls (#254, #248)', () => {
  test('§6 — no wb-demo source panel horizontally scrolls', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.locator('wb-demo pre').count(), { timeout: 20000 })
      .toBeGreaterThan(0);
    await scrollAllDemosIntoView(page);
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
    await scrollAllDemosIntoView(page);
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
    await scrollAllDemosIntoView(page);
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
