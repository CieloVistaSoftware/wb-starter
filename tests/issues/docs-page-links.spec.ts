/**
 * Test: Docs page links functionality
 * Verifies that all links on the docs page work correctly
 */
import { test, expect } from '@playwright/test';

test.describe('Docs Page Links', () => {
  test('docs page loads with documentation cards', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForLoadState('networkidle');

    // Wait for docs to load
    await page.waitForSelector('.docs-card', { timeout: 10000 });

    // Verify we have documentation cards
    const cards = page.locator('.docs-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    console.log(`Found ${count} documentation cards`);
  });

  test('markdown doc links have correct hrefs', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForLoadState('networkidle');

    // Wait for docs to load
    await page.waitForSelector('.docs-card', { timeout: 10000 });

    // Find markdown doc links
    const docLinks = page.locator('.docs-card[href*="doc-viewer.html"]');
    const count = await docLinks.count();

    // #1091: this spec had NEVER RUN — `tests/issues/` matched no project's
    // testMatch. On its first execution it failed, and the failure was its own:
    //
    //   Expected pattern: /^\/doc-viewer\.html\?file=\/docs\//
    //   Received string:  "/public/doc-viewer.html?file=docs%2FV3-GUIDE.md"
    //
    // doc-viewer moved under /public/ and the parameter is URL-encoded now. Both
    // forms return 200, so the app is right and the assertion was stale.
    //
    // It is also the wrong KIND of assertion. Matching a hardcoded URL shape
    // breaks whenever the shape legitimately changes and says nothing about
    // whether the link works — which is the only thing a reader cares about.
    // So every doc link is now FETCHED. A link that resolves passes; a link that
    // 404s fails, whatever its shape.
    expect(count, 'the docs page renders no markdown doc links at all').toBeGreaterThan(0);

    const hrefs = await docLinks.evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || ''));

    const broken: string[] = [];
    for (const href of hrefs) {
      const res = await page.request.get(new URL(href, page.url()).toString());
      if (!res.ok()) broken.push(`${href} -> ${res.status()}`);
    }

    expect(broken, `doc links that do not resolve:\n  ${broken.join('\n  ')}`).toEqual([]);
  });

  test('page links have correct hrefs', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForLoadState('networkidle');

    // Wait for docs to load
    await page.waitForSelector('.docs-card', { timeout: 10000 });

    // Find page links
    const pageLinks = page.locator('.docs-card[href*="/pages/"]');
    const count = await pageLinks.count();

    if (count > 0) {
      // Check first link
      const firstLink = pageLinks.first();
      const href = await firstLink.getAttribute('href');
      console.log(`First page link href: ${href}`);

      // Verify href format
      expect(href).toMatch(/^\/pages\/.+\.html$/);
    }
  });

  test('search input exists and is functional', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForLoadState('networkidle');

    // Check search input exists
    const searchInput = page.locator('#docs-search');
    await expect(searchInput).toBeVisible();

    // Type something and verify it works
    await searchInput.fill('test');
    const value = await searchInput.inputValue();
    expect(value).toBe('test');
  });
});