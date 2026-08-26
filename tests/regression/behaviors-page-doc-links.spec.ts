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
  test('layout decoration forms are registered and link to their dedicated docs', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors-reference.md'));
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const registry = await page.evaluate(async () => {
      const { extensionMap } = await import('/src/core/tag-map.js');
      return { stack: extensionMap['x-stack'], cluster: extensionMap['x-cluster'] };
    });
    expect(registry).toEqual({ stack: 'stack', cluster: 'cluster' });

    for (const [attribute, docName] of [['x-stack', '[x-stack].md'], ['x-cluster', '[x-cluster].md']]) {
      const host = page.locator(`[x-demo]:has([${attribute}])`).first();
      await expect(host, `no <div x-demo> found containing [${attribute}]`).toHaveCount(1);
      const badge = host.locator('.x-demo__card-doc-link');
      await expect(badge, `${attribute}'s x-demo has no per-element docs link`).toHaveCount(1, { timeout: 5000 });
      await expect(badge).toHaveAttribute('href', new RegExp(`docs%2Fbehaviors%2F${docName}$`));
    }
  });

  test('a representative sample of x-* decorated demos each render a working Docs: link', async ({ page }) => {
    await page.goto('/pages/behaviors.html');
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 10000 });
    // Settle time for wb-lazy.js's IntersectionObserver-driven lazy
    // injection + the doc-link build's own manifest fetch, matching the
    // wait used elsewhere in this suite for the same async path.
    await page.waitForTimeout(1000);

    // Each of these attribute names is authored directly in
    // pages/behaviors.html on a plain native element, not a <wb-*> tag —
    // exactly the case findWbComponents() used to miss entirely.
    const behaviors = ['x-ripple', 'x-toast', 'x-tooltip', 'x-masked', 'x-search', 'x-colorpicker'];

    for (const attr of behaviors) {
      const demo = page.locator(`[x-demo]:has([${attr}])`).first();
      await expect(demo, `no <div x-demo> found containing an [${attr}] element`).toHaveCount(1);

      const link = demo.locator('.x-demo__links a');
      await expect(link, `${attr}'s x-demo has no Docs: link at all`).toHaveCount(1, { timeout: 5000 });

      const label = (await link.textContent())?.trim() || '';
      expect(label, `${attr}'s Docs: link label`).toBe(attr);

      const href = await link.getAttribute('href');
      expect(href, `${attr}'s Docs: link has no href`).toBeTruthy();
      expect(href, `${attr}'s Docs: link must point at a real doc-viewer file, not a dead/empty link`).toMatch(
        /public\/doc-viewer\.html\?file=docs%2F.+\.md$/
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
    await page.goto('/demos/site/forms.html');
    await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 30000 });
    await expect
      .poll(() => page.locator('.x-demo__card-doc-link, .x-demo__links a').count(), { timeout: 30000 })
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
