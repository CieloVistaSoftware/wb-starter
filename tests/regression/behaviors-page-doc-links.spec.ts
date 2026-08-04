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
  test('a representative sample of x-* decorated demos each render a working Docs: link', async ({ page }) => {
    await page.goto('/pages/behaviors.html');
    await page.waitForSelector('wb-demo .wb-demo__grid', { timeout: 10000 });
    // Settle time for wb-lazy.js's IntersectionObserver-driven lazy
    // injection + the doc-link build's own manifest fetch, matching the
    // wait used elsewhere in this suite for the same async path.
    await page.waitForTimeout(1000);

    // Each of these attribute names is authored directly in
    // pages/behaviors.html on a plain native element, not a <wb-*> tag —
    // exactly the case findWbComponents() used to miss entirely.
    const behaviors = ['x-ripple', 'x-toast', 'x-tooltip', 'x-masked', 'x-search', 'x-colorpicker'];

    for (const attr of behaviors) {
      const demo = page.locator(`wb-demo:has([${attr}])`).first();
      await expect(demo, `no <wb-demo> found containing an [${attr}] element`).toHaveCount(1);

      const link = demo.locator('.wb-demo__links a');
      await expect(link, `${attr}'s wb-demo has no Docs: link at all`).toHaveCount(1, { timeout: 5000 });

      const label = (await link.textContent())?.trim() || '';
      expect(label, `${attr}'s Docs: link label`).toBe(attr);

      const href = await link.getAttribute('href');
      expect(href, `${attr}'s Docs: link has no href`).toBeTruthy();
      expect(href, `${attr}'s Docs: link must point at a real doc-viewer file, not a dead/empty link`).toMatch(
        /public\/doc-viewer\.html\?file=docs%2F.+\.md$/
      );
    }
  });

  test('an x-* behavior with no dedicated doc still falls back to behaviors-reference.md, never a dead link', async ({ page }) => {
    await page.goto('/pages/behaviors.html');
    await page.waitForSelector('wb-demo .wb-demo__grid', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // x-ripple has no dedicated per-behavior doc file (confirmed: only a
    // table row inside behaviors-reference.md) — its link must still
    // resolve there rather than being silently omitted.
    const demo = page.locator('wb-demo:has([x-ripple])').first();
    const link = demo.locator('.wb-demo__links a');
    const href = await link.getAttribute('href');
    expect(href).toContain('behaviors-reference.md');

    // And that fallback target must actually load, not 404.
    const response = await page.request.get(href!);
    expect(response.ok(), `fallback doc link ${href} did not load`).toBeTruthy();
  });
});
