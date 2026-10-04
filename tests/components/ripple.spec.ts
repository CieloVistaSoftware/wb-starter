/**
 * ripple Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/ripple.js
 */
import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

test.describe('ripple Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<div x-ripple>Basic ripple content</div>",
      "<div x-ripple centered>with centered</div>",
      "<div x-ripple color=\"rgba(255,255,255,0.3)\">color=\"rgba(255,255,255,0.3)\"</div>",
      "<div x-ripple duration=\"600\">duration=600</div>",
      "<div x-ripple centered color=\"rgba(255,255,255,0.3)\">Combined: with centered, color=\"rgba(255,255,255,0.3)\"</div>"
    ];
    
    await injectAndScan(page, setupHtml.join('\n'));
    
    // Verify at least one element rendered
    const elements = page.locator('#test-container *');
    const count = await elements.count();
    expect(count).toBeGreaterThan(0);
    
    // No uncaught errors
    const critical = errors.filter(e => !e.includes('Legacy syntax'));
    expect(critical, `Console errors: ${critical.join(', ')}`).toHaveLength(0);
  });

  test('element is visible after scan', async ({ page }) => {
    const html = "<div x-ripple>Basic ripple content</div>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container [x-ripple]').first();
    const isPresent = await el.count() > 0;
    
    if (isPresent) {
      await expect(el).toBeVisible({ timeout: 5000 });
    } else {
      // Custom tag might be transformed — check container has content
      const container = page.locator('#test-container');
      const text = await container.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test('matrix combo 1: ', async ({ page }) => {
    await injectAndScan(page, "<div x-ripple>Test</div>");
    const el = page.locator('#test-container [x-ripple]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 2: color=rgba(0,0,0,0.2)', async ({ page }) => {
    await injectAndScan(page, "<div x-ripple color=\"rgba(0,0,0,0.2)\">Test</div>");
    const el = page.locator('#test-container [x-ripple]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 3: duration=300', async ({ page }) => {
    await injectAndScan(page, "<div x-ripple duration=\"300\">Test</div>");
    const el = page.locator('#test-container [x-ripple]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });
});
