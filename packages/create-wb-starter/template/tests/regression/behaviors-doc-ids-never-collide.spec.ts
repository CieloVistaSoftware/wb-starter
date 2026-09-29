import { test, expect } from '../fixtures/offline';

/**
 * The live doc panel never duplicates an id already on the page.
 *
 * The behaviors page shows a behavior two ways at once: the running example,
 * whose root it names after the behavior (`id="card"`), and the rendered doc
 * (docs/behaviors/card.md), whose markdown gives `# Card` the id `card` too.
 * Whichever rendered second duplicated the first -- caught by the #730
 * detector as "[WB:DUPLICATE-ID] ... #card x2" in the 1.0 release gate. It only
 * surfaced sometimes because the ORDER was a race: when the doc won, the example
 * root was renamed; when the example won, the doc heading collided.
 */
test('selecting a behavior leaves no id on the page twice, example and doc included', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await expect(page.locator('#behaviors-live-code pre code.hljs')).toBeAttached({ timeout: 30_000 });
  for (const token of ['x-card', 'x-button', 'x-tabs']) {
    await page.fill('#behaviors-search', token);
    const row = page.locator(`.behaviors-search-results__row[data-browse-token="${token}"]:visible`).first();
    await row.click();
    // Both halves rendered: the example is up, and the doc has headings.
    await expect(page.locator('#behaviors-live-example > [x-ready]').first()).toBeAttached();
    await expect(page.locator('#behaviors-live-doc-body h1, #behaviors-live-doc-body h2').first()).toBeAttached();
    const dupes = await page.evaluate(() => {
      const counts: Record<string, number> = {};
      document.querySelectorAll('[id]').forEach((el) => { counts[el.id] = (counts[el.id] || 0) + 1; });
      return Object.entries(counts).filter(([, n]) => n > 1).map(([id, n]) => `#${id} x${n}`);
    });
    expect(dupes, `${token}: ids on the page twice`).toEqual([]);

    // The doc's heading ids (the text-derived ones) are namespaced, so no ordering of the two renders can
    // collide: `# Card` is #behaviors-doc-card, never #card. And the doc's
    // in-page links follow the rename, so a "#attributes" link still lands.
    const doc = await page.evaluate(() => {
      const body = document.getElementById('behaviors-live-doc-body')!;
      const ids = [...body.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')].map((e) => e.id);
      const links = [...body.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')!.slice(1));
      return { unprefixed: ids.filter((id) => !id.startsWith('behaviors-doc-')), dangling: links.filter((id) => id && !document.getElementById(id)) };
    });
    expect(doc.unprefixed, `${token}: doc heading ids that can collide with the page`).toEqual([]);
    expect(doc.dangling, `${token}: doc links to ids that do not exist`).toEqual([]);
  }
});
