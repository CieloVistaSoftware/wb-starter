/**
 * codecontrol Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/codecontrol.js
 */
import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

test.describe('codecontrol Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<div x-codecontrol>Basic codecontrol content</div>",
      "<div x-codecontrol>Test permutation 2</div>",
      "<div x-codecontrol>Test permutation 3</div>",
      "<div x-codecontrol>Test permutation 4</div>",
      "<div x-codecontrol>Test permutation 5</div>"
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
    const html = "<div x-codecontrol>Basic codecontrol content</div>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container [x-codecontrol]').first();
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

});
