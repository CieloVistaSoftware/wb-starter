/**
 * stagelight Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/stagelight.js
 */
import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

test.describe('stagelight Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<div x-stagelight>Basic stagelight content</div>",
      "<div x-stagelight variant=\"beam\">variant=beam</div>",
      "<div x-stagelight variant=\"spotlight\">variant=spotlight</div>",
      "<div x-stagelight variant=\"fixture\">variant=fixture</div>",
      "<div x-stagelight color=\"#ffffff\">color=\"#ffffff\"</div>",
      "<div x-stagelight intensity=\"0.5\">intensity=0.5</div>",
      "<div x-stagelight size=\"300px\">size=\"300px\"</div>",
      "<div x-stagelight speed=\"3s\">speed=\"3s\"</div>"
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
    const html = "<div x-stagelight>Basic stagelight content</div>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container [x-stagelight]').first();
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
