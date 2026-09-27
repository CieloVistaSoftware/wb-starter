import { test, expect, Page } from '../fixtures/offline';

/**
 * Standard §5 (#254) + §6 (#248): every `<div x-demo>` source panel is VERTICAL —
 * a multi-attribute element renders one attribute per line — left-aligned, and
 * never wraps. The fix is systemic in `src/wb-viewmodels/demo.js`.
 *
 * Moved off /?page=behaviors: #666 took every <div x-demo> off that page (its
 * examples now render one at a time in the live preview), so each test here
 * waited out its timeout on a page with no demo blocks. demos/site/cards.html
 * carries the most blocks on the site (293), including the multi-attribute
 * [x-cardpricing] examples §5 is about.
 *
 * §6's "never horizontally scrolls" predates #390, which made x-demo code
 * panels the explicit exception: they SCROLL rather than wrap, and
 * "show all the code up to 50% vw" (demo-code-panel-50vw.spec.ts) is the rule
 * for how wide they get. So the check is now the one both standards agree on:
 * never wrapped (white-space: pre), never centered, and never scrolling while
 * the panel is still narrower than the 50vw it is allowed to grow to.
 *
 * The lazy runtime (#312/#491) builds a block only once it nears the viewport,
 * so these tests walk the page the way a reader does before reading anything.
 */
async function scrollAllDemosIntoView(page: Page) {
  await page.locator('[x-demo] .x-demo__grid').first().waitFor({ state: 'attached', timeout: 20000 });
  // Bring the next still-unbuilt block into view, let its observer fire,
  // repeat. A fixed scroll step undershoots: the page grows as blocks build.
  for (let i = 0; i < 400; i++) {
    const remaining = await page.evaluate(() => {
      const next = [...document.querySelectorAll('[x-demo]')].find((el) => !el.querySelector('.x-demo__grid'));
      if (next) next.scrollIntoView({ block: 'center' });
      return !!next;
    });
    if (!remaining) break;
    await page.waitForTimeout(30);
  }
}

const PAGE = '/demos/site/cards.html';

test.describe('[x-demo] source is vertical + never horizontally scrolls (#254, #248)', () => {
  // 293 blocks, each built as it is reached.
  test.describe.configure({ timeout: 120_000 });

  test('§6 — no [x-demo] source panel horizontally scrolls', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await scrollAllDemosIntoView(page);
    await expect
      .poll(() => page.locator('[x-demo] pre').count(), { timeout: 20000 })
      .toBeGreaterThan(5);
    // Single-item widths are committed once, after the panel settles (#985).
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('[x-demo]')).every((d) => {
        const grid = d.querySelector('.x-demo__grid');
        if (!grid || !d.querySelector('.x-pre')) return true;
        if (grid.children.length !== 1 || d.classList.contains('x-demo--full-width')) return true;
        return d.classList.contains('x-demo--measured');
      }), undefined, { timeout: 20000 });

    const offenders = await page.$$eval('[x-demo] pre.x-demo__code', (els) => {
      const cap = window.innerWidth * 0.5;
      return els
        .map((el, i) => ({
          i,
          text: (el.textContent || '').trim().slice(0, 40),
          // #390/§28: scrolling is only right once the panel is at its cap.
          scrollsBelowCap: el.scrollWidth > el.clientWidth + 2 && el.getBoundingClientRect().width < cap - 2,
          centered: getComputedStyle(el).textAlign === 'center',
          whiteSpace: getComputedStyle(el).whiteSpace,
        }))
        // §5: code is left-aligned, never centered; §6/#390: never wraps.
        .filter((x) => x.scrollsBelowCap || x.centered || x.whiteSpace !== 'pre');
    });
    expect(offenders, `[x-demo] source panels that wrap, are centered, or scroll with room to grow:\n${JSON.stringify(offenders, null, 2)}`).toEqual([]);
  });

  test('§5 — a multi-attribute element renders one attribute per line', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await scrollAllDemosIntoView(page);
    // The source panel holds the authored markup, `<div x-cardpricing ...>`.
    // '[x-cardpricing]' (the selector form, left by a bulk rename) never
    // appears in any source panel, so this filter could match nothing.
    const pricingSrc = page
      .locator('[x-demo] pre code')
      .filter({ hasText: 'x-cardpricing' })
      .first();
    await pricingSrc.scrollIntoViewIfNeeded();
    await expect(pricingSrc).toBeVisible({ timeout: 20000 });

    const txt = (await pricingSrc.textContent()) || '';
    // opening tag on its own line, then each attribute indented on its own line
    expect(txt, 'multi-attribute element must be broken one-attribute-per-line').toMatch(
      /<div x-cardpricing\n\s+plan=/
    );
    expect(txt.split('\n').length, 'source should be multi-line (vertical)').toBeGreaterThan(4);
  });

  test('§20 — rendered source never shows a worthless x-*="" (#261)', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await scrollAllDemosIntoView(page);
    await expect
      .poll(() => page.locator('[x-demo] pre code').count(), { timeout: 20000 })
      .toBeGreaterThan(5);

    // Boolean attributes serialize as x-foo="" via innerHTML; the pretty-printer
    // must emit them BARE in every displayed code panel.
    const offenders = await page.$$eval('[x-demo] pre code', (els) =>
      els
        .map((el, i) => ({ i, hit: ((el.textContent || '').match(/x-[a-z][a-z0-9-]*=""/g) || []) }))
        .filter((x) => x.hit.length)
        .map((x) => `panel ${x.i}: ${[...new Set(x.hit)].join(', ')}`)
    );
    expect(offenders, `code panels showing x-*="":\n${offenders.join('\n')}`).toEqual([]);
  });
});
