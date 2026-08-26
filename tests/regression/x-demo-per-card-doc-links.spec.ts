import { test, expect, Page } from '@playwright/test';

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

test.describe('[x-demo]: per-card doc links (#388)', () => {
  test('each card in a multi-card demo gets its own top-right doc link, not a shared line', async ({ page }) => {
    await inject(page, `
      <div x-demo id="multi" columns="2">
        <article id="c1" title="Plain Card">Body text</article>
        <div x-cardhero id="c2" title="Hero Card"></div>
      </div>
    `);

    const c1Link = page.locator('#c1 > .x-demo__card-doc-link');
    const c2Link = page.locator('#c2 > .x-demo__card-doc-link');
    // Each card gets exactly one link, scoped to that card (direct child).
    await expect(c1Link, '.x-card must get its own doc link').toHaveCount(1, { timeout: 10000 });
    await expect(c2Link, '[x-cardhero] must get its own doc link').toHaveCount(1, { timeout: 10000 });

    // Positioned ON the card itself (absolute within the card's own box,
    // which is position:relative via .x-card in card.css).
    expect(await c1Link.evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
    expect(await c2Link.evaluate((el) => getComputedStyle(el).position)).toBe('absolute');

    // Each href resolves to THAT card's OWN doc — not a generic/wrong one.
    const c1Href = await c1Link.getAttribute('href');
    const c2Href = await c2Link.getAttribute('href');
    expect(c1Href, '.x-card link must target card.md').toContain('card.md');
    expect(c1Href, '.x-card link must NOT target cardhero.md').not.toContain('cardhero.md');
    expect(c2Href, '[x-cardhero] link must target cardhero.md, not a generic/wrong doc').toContain('cardhero.md');
    expect(c2Href).not.toBe(c1Href);

    // The OLD shared line must not appear for an all-cards demo — the doc
    // reference now lives on the cards themselves, not a detached caption
    // below the whole group.
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
      page.locator('#real > .x-demo__card-doc-link'),
      'a card whose tag DOES resolve must still get its link'
    ).toHaveCount(1, { timeout: 10000 });

    // Give the no-doc card the same settling time as the real one, then
    // confirm it was never given a (necessarily broken) link.
    await page.waitForTimeout(500);
    await expect(
      page.locator('#fake > .x-demo__card-doc-link'),
      'a card whose tag has no manifest doc must get NO link'
    ).toHaveCount(0);
  });

  test('mixed demo: non-card content keeps the shared Docs: line, the card gets its own', async ({ page }) => {
    await inject(page, `
      <div x-demo id="mixed" columns="2">
        <article id="mc" title="Card In Mixed Block">Body</article>
        <span x-badge id="mb" variant="primary">Badge</span>
      </div>
    `);

    await expect(
      page.locator('#mc > .x-demo__card-doc-link'),
      'the card keeps its own per-card link even in a mixed block'
    ).toHaveCount(1, { timeout: 10000 });

    const sharedLine = page.locator('#mixed .x-demo__links');
    await expect(
      sharedLine,
      'the non-card [x-badge] must still fall back to the original shared line'
    ).toHaveCount(1, { timeout: 10000 });
    const sharedText = (await sharedLine.textContent()) || '';
    expect(sharedText).toContain('[x-badge]');
    expect(
      sharedText,
      'the card must NOT also be listed in the shared line (it already has its own link — no duplicate reference)'
    ).not.toContain('.x-card');
  });
});
