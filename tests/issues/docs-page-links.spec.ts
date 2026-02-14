/**
 * Test: Docs page links functionality
 * Verifies that all links on the docs page work correctly
 */
import { test, expect } from '@playwright/test';

test.describe('Docs Page Links', () => {
  test('docs page loads with documentation cards', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=docs');
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
    await page.goto('http://localhost:3000/?page=docs');
    await page.waitForLoadState('networkidle');

    // Wait for docs to load
    await page.waitForSelector('.docs-card', { timeout: 10000 });

    // Find markdown doc links
    const docLinks = page.locator('.docs-card[href*="doc-viewer.html"]');
    const count = await docLinks.count();

    if (count > 0) {
      // Check first link
      const firstLink = docLinks.first();
      const href = await firstLink.getAttribute('href');
      console.log(`First doc link href: ${href}`);

      // Verify href format
      expect(href).toMatch(/^\/doc-viewer\.html\?file=\/docs\//);
    }
  });

  test('page links have correct hrefs', async ({ page }) => {
    await page.goto('http://localhost:3000/?page=docs');
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
    await page.goto('http://localhost:3000/?page=docs');
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