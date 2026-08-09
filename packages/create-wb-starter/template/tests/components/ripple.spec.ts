/**
 * ripple Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/ripple.js
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

test.describe('ripple Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<wb-ripple>Basic ripple content</wb-ripple>",
      "<wb-ripple centered>with centered</wb-ripple>",
      "<wb-ripple color=\"rgba(255,255,255,0.3)\">color=\"rgba(255,255,255,0.3)\"</wb-ripple>",
      "<wb-ripple duration=\"600\">duration=600</wb-ripple>",
      "<wb-ripple centered color=\"rgba(255,255,255,0.3)\">Combined: with centered, color=\"rgba(255,255,255,0.3)\"</wb-ripple>"
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
    const html = "<wb-ripple>Basic ripple content</wb-ripple>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container wb-ripple, #test-container [x-ripple]').first();
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
    await injectAndScan(page, "<wb-ripple>Test</wb-ripple>");
    const el = page.locator('#test-container wb-ripple, #test-container [x-ripple]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 2: color=rgba(0,0,0,0.2)', async ({ page }) => {
    await injectAndScan(page, "<wb-ripple color=\"rgba(0,0,0,0.2)\">Test</wb-ripple>");
    const el = page.locator('#test-container wb-ripple, #test-container [x-ripple]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 3: duration=300', async ({ page }) => {
    await injectAndScan(page, "<wb-ripple duration=\"300\">Test</wb-ripple>");
    const el = page.locator('#test-container wb-ripple, #test-container [x-ripple]').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });
});
