import { test, expect } from '@playwright/test';

/**
 * #475: pages/behaviors.html's demos decorate NATIVE elements with x-*
 * attributes (`<button x-ripple>`, `<input x-masked>`, ...) almost
 * exclusively — findWbComponents() in demo.js only ever matched literal
 * `<wb-*>` TAGS, so every one of these demos produced ZERO "Docs:" link,
 * even though a real doc exists for most of them (a dedicated page like
 * tooltip.md, or a fallback to the shared behaviors-reference.md). John,
 * live: "when looking at the behaviors there are no links to the x-* docs.
 * for the behaviors."
 *
 * Fixed via demo.js's findXBehaviors()/findBehaviorDocFile() — this test
 * proves the fix on the real production page (not a synthetic harness) and
 * guards against the gap reopening.
 */
test.describe('pages/behaviors.html: every x-* behavior demo shows a Docs: link (#475)', () => {
  // demos/site/forms.html is ~1,400 lines of demos, and its `load` event also
  // waits on a module that imports ajv from cdn.jsdelivr.net. Under parallel
  // workers that alone overran the default 30s budget inside page.goto(),
  // before any assertion ran. The pages are awaited on DOMContentLoaded plus
  // the demo grid actually rendering (the thing under test), and the longer
  // ceiling only buys tolerance -- every wait below is still on an outcome.
  test.describe.configure({ timeout: 90_000 });

  test('layout decoration forms are registered and link to their dedicated docs', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'));
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const registry = await page.evaluate(async () => {
      const { extensionMap } = await import('/src/core/tag-map.js');
      return { stack: extensionMap['x-stack'], cluster: extensionMap['x-cluster'] };
    });
    expect(registry).toEqual({ stack: 'stack', cluster: 'cluster' });

    // The dedicated docs are docs/behaviors/stack.md and cluster.md -- the
    // pages behaviors-reference.md's own table links to, and the files that
    // exist. The old names, '[x-stack].md', were never files; interpolated
    // into a RegExp, `[x-stack]` is also a character class with an
    // out-of-order range, so this loop threw a SyntaxError before it could
    // assert anything even where the doc renders.
    for (const [attribute, docName] of [['x-stack', 'stack.md'], ['x-cluster', 'cluster.md']]) {
      const host = page.locator(`[x-demo]:has([${attribute}])`).first();
      await expect(host, `no <div x-demo> found containing [${attribute}]`).toHaveCount(1);
      // The lazy runtime builds a demo only as it nears the viewport (#491).
      await host.scrollIntoViewIfNeeded();
      const badge = host.locator('.x-demo__card-doc-link');
      await expect(badge, `${attribute}'s x-demo has no per-element docs link`).toHaveCount(1, { timeout: 5000 });
      await expect(badge).toHaveAttribute('href', new RegExp(`docs%2Fbehaviors%2F${docName.replace('.', '\\.')}$`));
    }
  });

  // Retargeted from /pages/behaviors.html, which has rendered no <div x-demo>
  // at all since #666 made it a browse UI (it redirects to /?page=behaviors,
  // where the selector waited 10s for a grid that cannot appear). The same
  // #475 case -- a NATIVE element decorated with an x-* attribute, not a
  // <wb-*> tag -- is authored throughout demos/site/forms.html, the page the
  // #842 test below already moved to.
  //
  // Two further updates, both to what the product now deliberately does:
  //  - The link is the per-instance corner badge, `.x-demo__card-doc-link`.
  //    #388/#390 moved x-* hosts off the shared "Docs: x-foo" line below the
  //    grid (`.x-demo__links a`, which remains only for a name that matches no
  //    live element), so the badge's aria-label carries the behavior name.
  //  - x-masked and x-colorpicker are gone from the list: no demo page in the
  //    repo authors either any more. x-search, which forms.html does author,
  //    takes their place.
  test('a representative sample of x-* decorated demos each render a working Docs: link', async ({ page }) => {
    await page.goto('/demos/site/forms.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 30000 });

    const behaviors = ['x-ripple', 'x-toast', 'x-tooltip', 'x-search'];

    for (const attr of behaviors) {
      const demo = page.locator(`[x-demo]:has([${attr}])`).first();
      await expect(demo, `no <div x-demo> found containing an [${attr}] element`).toHaveCount(1);
      // The lazy runtime builds a demo only as it nears the viewport (#491);
      // several of these sit a long way down the page.
      await demo.scrollIntoViewIfNeeded();

      const link = demo.locator(`.x-demo__card-doc-link[aria-label="${attr} docs"]`);
      await expect(link, `${attr}'s x-demo has no Docs link at all`).toHaveCount(1, { timeout: 15000 });

      const href = await link.getAttribute('href');
      expect(href, `${attr}'s Docs link has no href`).toBeTruthy();
      expect(href, `${attr}'s Docs link must point at its own doc in the doc-viewer, not a dead/generic link`).toMatch(
        new RegExp(`public/doc-viewer\\.html\\?file=docs%2Fbehaviors%2F${attr.slice(2)}\\.md$`)
      );
    }
  });

  // #842: this test used to ASSERT THE BUG. It loaded pages/behaviors.html and
  // required x-ripple's badge to point at behaviors-reference.md, on the
  // premise that "x-ripple has no dedicated doc". docs/behaviors/ has since
  // been rebuilt from the schemas (177 pages, ripple.md among them), and the
  // real defect was that EVERY behavior on the site — x-button, x-input,
  // x-select, all of them — resolved to that same generic reference because
  // demo.js only searched the curated docs/manifest.json. Green here meant the
  // bug was working as designed.
  //
  // Retargeted to demos/site/forms.html because pages/behaviors.html no longer
  // renders any <div x-demo> block at all (it is a browse/filter UI now) — the
  // two tests above fail on that same missing selector, unrelated to #842.
  test('a behavior WITH its own doc links to that doc, and the last-resort fallback stays readable (#842)', async ({
    page,
  }) => {
    await page.goto('/demos/site/forms.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 30000 });
    // The first x-ripple demo is ~1000 lines down, and the lazy runtime builds
    // a demo only as it nears the viewport (#491). The demos above it are
    // native <button variant> etc. with no x-* attribute and no <wb-*> tag, so
    // they rightly carry no Docs link -- which is why this poll sat at 0 until
    // the test timed out.
    const rippleDemo = page.locator('[x-demo]:has([x-ripple])').first();
    await rippleDemo.scrollIntoViewIfNeeded();
    await expect
      .poll(() => rippleDemo.locator('.x-demo__card-doc-link, .x-demo__links a').count(), { timeout: 30000 })
      .toBeGreaterThan(0);

    const hrefs = await page.$$eval('.x-demo__card-doc-link, .x-demo__links a', (as) =>
      as.map((a) => a.getAttribute('href') || '')
    );

    // The behavior-specific target, not the generic reference.
    expect(
      hrefs.some((h) => h.includes(encodeURIComponent('docs/behaviors/ripple.md'))),
      `x-ripple must link to its own page. Got:\n  ${[...new Set(hrefs)].join('\n  ')}`
    ).toBe(true);

    // And the wholesale symptom: the generic reference must not be the answer
    // for everything. On this page every behavior shown has its own doc.
    const generic = [...new Set(hrefs.filter((h) => h.includes('behaviors-reference.md')))];
    expect(generic, 'no demo on this page should fall back to the generic reference').toEqual([]);

    // The fallback is still the last resort for a behavior with no page of its
    // own, so it has to remain readable — #842 repaired its 31 dead relative
    // links for exactly that reason.
    const fallback = await page.request.get('/docs/behaviors-reference.md');
    expect(fallback.ok(), 'the fallback doc itself must load').toBeTruthy();
  });
});
