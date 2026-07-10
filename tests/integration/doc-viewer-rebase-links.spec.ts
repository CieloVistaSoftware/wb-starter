import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * REGRESSION: the doc-viewer must rebase a doc's relative links/media against the
 * DOC's real location, not the viewer page.
 *
 * A doc at docs/behaviors/x-behavior.md links a demo as
 * "../../demos/autoinject.html" — correct relative to the doc, but the
 * browser would resolve it against …/public/doc-viewer.html and walk past the
 * site root to the domain root (github.io/demos/… → 404). rebaseDocResources()
 * rewrites such links to an absolute URL anchored at docs/<dir>/, so they land at
 * SITE_ROOT/demos/autoinject.html.
 */
test('doc-viewer rebases relative demo links to the doc location (not a domain-root 404)', async ({ page, baseURL }) => {
  await page.goto('/public/doc-viewer.html?file=docs/behaviors/x-behavior.md', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const c = document.getElementById('content');
    return !!c && c.querySelector('a[href*="autoinject"]') !== null;
  }, { timeout: 20000 });

  const link = page.locator('#content a[href*="autoinject"]').first();

  // After rebasing, the href ATTRIBUTE is an absolute URL (before the fix it
  // would still be the raw relative "../../demos/…").
  const attr = await link.getAttribute('href');
  expect(attr, 'link was not rebased — still relative').toMatch(/^https?:\/\//);

  // …and it points at the demo under the site root, never above it.
  const resolved = await link.evaluate((a: HTMLAnchorElement) => a.href);
  expect(new URL(resolved).pathname).toBe('/demos/autoinject.html');

  // …and that target actually exists (no 404).
  const req = await pwRequest.newContext({ baseURL });
  const res = await req.get('/demos/autoinject.html');
  expect(res.status(), 'rebased demo link 404s').toBeLessThan(400);
  await req.dispose();
});
