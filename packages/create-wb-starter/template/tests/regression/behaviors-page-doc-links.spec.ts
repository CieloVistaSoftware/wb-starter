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
    await page.waitForSelector('x-demo .x-demo__grid', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const registry = await page.evaluate(async () => {
      const { extensionMap } = await import('/src/core/tag-map.js');
      return { stack: extensionMap['x-stack'], cluster: extensionMap['x-cluster'] };
    });
    expect(registry).toEqual({ stack: 'stack', cluster: 'cluster' });

    for (const [attribute, docName] of [['x-stack', 'x-stack.md'], ['x-cluster', 'x-cluster.md']]) {
      const host = page.locator(`x-demo:has([${attribute}])`).first();
      await expect(host, `no <div x-demo> found containing [${attribute}]`).toHaveCount(1);
      const badge = host.locator('.x-demo__card-doc-link');
      await expect(badge, `${attribute}'s x-demo has no per-element docs link`).toHaveCount(1, { timeout: 5000 });
      await expect(badge).toHaveAttribute('href', new RegExp(`docs%2Fbehaviors%2F${docName}$`));
    }
  });

  test('a representative sample of x-* decorated demos each render a working Docs: link', async ({ page }) => {
    await page.goto('/pages/behaviors.html');
    await page.waitForSelector('x-demo .x-demo__grid', { timeout: 10000 });
    // Settle time for wb-lazy.js's IntersectionObserver-driven lazy
    // injection + the doc-link build's own manifest fetch, matching the
    // wait used elsewhere in this suite for the same async path.
    await page.waitForTimeout(1000);

    // Each of these attribute names is authored directly in
    // pages/behaviors.html on a plain native element, not a <wb-*> tag —
    // exactly the case findWbComponents() used to miss entirely.
    const behaviors = ['x-ripple', 'x-toast', 'x-tooltip', 'x-masked', 'x-search', 'x-colorpicker'];

    for (const attr of behaviors) {
      const demo = page.locator(`x-demo:has([${attr}])`).first();
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

  test('an x-* behavior with no dedicated doc still falls back to behaviors-reference.md, never a dead link', async ({ page }) => {
    await page.goto('/pages/behaviors.html');
    await page.waitForSelector('x-demo .x-demo__grid', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // x-ripple has no dedicated per-behavior doc file (confirmed: only a
    // table row inside behaviors-reference.md) — its link must still
    // resolve there rather than being silently omitted.
    const demo = page.locator('x-demo:has([x-ripple])').first();
    const link = demo.locator('.x-demo__links a');
    const href = await link.getAttribute('href');
    expect(href).toContain('behaviors-reference.md');

    // And that fallback target must actually load, not 404.
    const response = await page.request.get(href!);
    expect(response.ok(), `fallback doc link ${href} did not load`).toBeTruthy();
  });
});
