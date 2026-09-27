import { test, expect, Page } from '../fixtures/offline';

/**
 * #388: <div x-demo>'s doc reference used to be ONE shared '.x-demo__links'
 * line ("Docs: .x-card, [x-cardimage]") appended BELOW the whole rendered
 * grid, built once from every distinct wb-* tag found anywhere in the
 * block's raw source. On a <div x-demo> holding multiple different card
 * examples that read as one detached caption under the whole group, not
 * tied to any individual card.
 *
 * Cards (grid children whose tag starts with x-card*) now get their OWN
 * doc link, attached directly onto that specific card (top-right corner,
 * see demo.js's attachCardDocLink), resolved from THAT card's own tag —
 * not a generic/shared one. Non-card content (badges, alerts, buttons, ...)
 * is untouched and keeps using the original shared line.
 *
 * UPDATED for #390 / #630 / #641 (the assertions below were written for the
 * #388 shape and went stale when demo.js moved on deliberately):
 *   - #630/#641: the badge is anchored on the OUTER <div x-demo>, never on
 *     the card -- a badge on a tiny host collided with its neighbour or was
 *     clipped by x-demo's overflow:hidden. So `#card > .x-demo__card-doc-link`
 *     can no longer exist; each card's doc is a badge on its demo block.
 *   - #390: every component gets a corner badge, not just cards, so an
 *     [x-badge] beside a card gets its own badge too rather than the shared
 *     "Docs:" line.
 * What #388 was actually about still holds and is what is asserted: each
 * card's badge opens THAT card's own doc (card.md vs cardhero.md), none of
 * it is a detached caption under the grid, and a tag with no doc gets no
 * link. The bare <article> case is also a real regression guard: an
 * <article> is a card by tag-map alone, and demo.js gave it no badge at all
 * until it learned to read native subjects.
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    // <div x-demo> is a real custom element (x-demo.js) — it upgrades and runs
    // its own connectedCallback (building the grid + doc links) the instant
    // it's connected above. Its grid children (x-card*, x-badge, ...) are
    // plain tags dispatched through WB's own scan/inject machinery, not
    // custom elements — scan the container so they actually get their own
    // behavior (header/main/footer, position:relative via .x-card, ...)
    // applied, exercising the same real lazy-injection path production
    // pages use (not a bypass of it).
    await (window as any).WB.scan(container);
  }, html);

  // x-demo builds its grid synchronously up to its first await (the cached
  // docs-manifest fetch) — wait for it before asserting on grid children.
  await page.waitForSelector('#test-container [x-demo] .x-demo__grid', { timeout: 10000 });
}

/** The doc files each demo block's corner badges open, sorted. */
async function badgeFiles(page: Page, demoId: string): Promise<string[]> {
  const hrefs = await page
    .locator(`#${demoId} > .x-demo__card-doc-link`)
    .evaluateAll((as) => as.map((a) => a.getAttribute('href') || ''));
  return hrefs
    .map((h) => decodeURIComponent(new URL(h, 'http://x/').searchParams.get('file') || ''))
    .sort();
}

test.describe('[x-demo]: per-card doc links (#388)', () => {
  test('each card in a multi-card demo gets its own doc link, not a shared line', async ({ page }) => {
    await inject(page, `
      <div x-demo id="multi" columns="2">
        <article id="c1" title="Plain Card">Body text</article>
        <div x-cardhero id="c2" title="Hero Card"></div>
      </div>
    `);

    const links = page.locator('#multi > .x-demo__card-doc-link');
    // One badge per distinct card doc: the bare <article> (a card via
    // tag-map) AND the [x-cardhero] each get their own.
    await expect(links, 'the <article> card and the [x-cardhero] each need a badge').toHaveCount(2, { timeout: 10000 });

    // Positioned in the demo block's own top-right corner (absolute within
    // the x-demo, which demo.js makes a positioning context).
    for (const pos of await links.evaluateAll((as) => as.map((a) => getComputedStyle(a).position))) {
      expect(pos).toBe('absolute');
    }

    // Each resolves to THAT card's OWN doc -- not a generic/shared one.
    expect(await badgeFiles(page, 'multi')).toEqual(['docs/behaviors/card.md', 'docs/behaviors/cardhero.md']);

    // The OLD shared line must not appear for an all-cards demo.
    await expect(page.locator('#multi .x-demo__links')).toHaveCount(0);
  });

  test('a card with no resolvable doc gets no link (never a dead link)', async ({ page }) => {
    await inject(page, `
      <div x-demo id="nodoc" columns="2">
        <article id="real" title="Real Card">Body</article>
        <div id="fake" title="No Doc For This Tag"></div>
      </div>
    `);

    await expect(
      page.locator('#nodoc > .x-demo__card-doc-link'),
      'a card whose tag DOES resolve must still get its link'
    ).toHaveCount(1, { timeout: 10000 });

    // Give the no-doc element the same settling time as the real one, then
    // confirm it never added a (necessarily broken) link of its own.
    await page.waitForTimeout(500);
    expect(await badgeFiles(page, 'nodoc'), 'only the card doc; the plain <div> gets none').toEqual([
      'docs/behaviors/card.md',
    ]);
    await expect(page.locator('#nodoc .x-demo__links')).toHaveCount(0);
  });

  test('mixed demo: the card and the non-card component each get their own badge', async ({ page }) => {
    await inject(page, `
      <div x-demo id="mixed" columns="2">
        <article id="mc" title="Card In Mixed Block">Body</article>
        <span x-badge id="mb" variant="primary">Badge</span>
      </div>
    `);

    await expect(page.locator('#mixed > .x-demo__card-doc-link')).toHaveCount(2, { timeout: 10000 });
    expect(await badgeFiles(page, 'mixed'), 'card.md for the card, badge.md for the [x-badge]').toEqual([
      'docs/behaviors/badge.md',
      'docs/behaviors/card.md',
    ]);
    // Both are resolved per-instance, so nothing is left for the shared line
    // (no duplicate reference to either).
    await expect(page.locator('#mixed .x-demo__links')).toHaveCount(0);
  });
});
