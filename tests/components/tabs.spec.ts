/**
 * tabs Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/tabs.js
 */
import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

test.describe('tabs Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<div x-tabs>Basic tabs content</div>",
      "<div x-tabs variant=\"default\">variant=default</div>",
      "<div x-tabs variant=\"pills\">variant=pills</div>",
      "<div x-tabs variant=\"underline\">variant=underline</div>",
      "<div x-tabs size=\"sm\">size=sm</div>",
      "<div x-tabs size=\"md\">size=md</div>",
      "<div x-tabs size=\"lg\">size=lg</div>",
      "<div x-tabs full-width>with fullWidth</div>"
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
    const html = "<div x-tabs>Basic tabs content</div>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container [x-tabs]').first();
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

  test('matrix combo 1: activeTab=0', async ({ page }) => {
    await injectAndScan(page, "<div x-tabs activeTab=\"0\">Test</div>");
    const el = page.locator('#test-container [x-tabs]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 2: activeTab=1', async ({ page }) => {
    await injectAndScan(page, "<div x-tabs activeTab=\"1\">Test</div>");
    const el = page.locator('#test-container [x-tabs]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 3: variant=pills', async ({ page }) => {
    await injectAndScan(page, "<div x-tabs variant=\"pills\">Test</div>");
    const el = page.locator('#test-container [x-tabs]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 4: variant=underline', async ({ page }) => {
    await injectAndScan(page, "<div x-tabs variant=\"underline\">Test</div>");
    const el = page.locator('#test-container [x-tabs]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 5: fullWidth=true', async ({ page }) => {
    await injectAndScan(page, "<div x-tabs fullWidth=\"true\">Test</div>");
    const el = page.locator('#test-container [x-tabs]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });
});
