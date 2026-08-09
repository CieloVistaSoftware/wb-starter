/**
 * tooltip Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/tooltip.js
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = '/demos/test-harness.html';

async function waitForWB(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.waitForTimeout(100);
}

async function injectAndScan(page: Page, html: string) {
  await waitForWB(page);
  
  await page.evaluate((h: string) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    
    // Force eager loading
    const elements = container.querySelectorAll('.wb-ready');
    elements.forEach(el => el.setAttribute('', ''));
    
    document.body.appendChild(container);
  }, html);
  
  await page.evaluate(() => {
    (window as any).WB.scan(document.getElementById('test-container'));
  });
  
  await page.waitForTimeout(500);
}

test.describe('tooltip Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<wb-tooltip>Basic tooltip content</wb-tooltip>",
      "<wb-tooltip position=\"top\">position=top</wb-tooltip>",
      "<wb-tooltip position=\"bottom\">position=bottom</wb-tooltip>",
      "<wb-tooltip position=\"left\">position=left</wb-tooltip>",
      "<wb-tooltip variant=\"default\">variant=default</wb-tooltip>",
      "<wb-tooltip variant=\"dark\">variant=dark</wb-tooltip>",
      "<wb-tooltip variant=\"light\">variant=light</wb-tooltip>",
      "<wb-tooltip trigger=\"hover\">trigger=hover</wb-tooltip>"
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
    const html = "<wb-tooltip>Basic tooltip content</wb-tooltip>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
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

  test('matrix combo 1: content=Tooltip text', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip>Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 2: content=Tooltip text, position=top', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip position=\"top\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 3: content=Tooltip text, position=bottom', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip position=\"bottom\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 4: content=Tooltip text, position=left', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip position=\"left\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 5: content=Tooltip text, position=right', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip position=\"right\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 6: content=Tooltip text, variant=light', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip variant=\"light\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 7: content=Tooltip text, variant=primary', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip variant=\"primary\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 8: content=Tooltip text, arrow=false', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip arrow=\"false\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 9: content=Tooltip text, delay=500', async ({ page }) => {
    await injectAndScan(page, "<wb-tooltip delay=\"500\">Tooltip text</wb-tooltip>");
    const el = page.locator('#test-container wb-tooltip, #test-container wb-tooltip').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });
});
