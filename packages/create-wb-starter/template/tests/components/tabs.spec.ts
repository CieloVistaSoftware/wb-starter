/**
 * tabs Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/tabs.js
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

test.describe('tabs Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<wb-tabs>Basic tabs content</wb-tabs>",
      "<wb-tabs variant=\"default\">variant=default</wb-tabs>",
      "<wb-tabs variant=\"pills\">variant=pills</wb-tabs>",
      "<wb-tabs variant=\"underline\">variant=underline</wb-tabs>",
      "<wb-tabs size=\"sm\">size=sm</wb-tabs>",
      "<wb-tabs size=\"md\">size=md</wb-tabs>",
      "<wb-tabs size=\"lg\">size=lg</wb-tabs>",
      "<wb-tabs full-width>with fullWidth</wb-tabs>"
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
    const html = "<wb-tabs>Basic tabs content</wb-tabs>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container wb-tabs, #test-container wb-tabs').first();
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
    await injectAndScan(page, "<wb-tabs activeTab=\"0\">Test</wb-tabs>");
    const el = page.locator('#test-container wb-tabs, #test-container wb-tabs').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 2: activeTab=1', async ({ page }) => {
    await injectAndScan(page, "<wb-tabs activeTab=\"1\">Test</wb-tabs>");
    const el = page.locator('#test-container wb-tabs, #test-container wb-tabs').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 3: variant=pills', async ({ page }) => {
    await injectAndScan(page, "<wb-tabs variant=\"pills\">Test</wb-tabs>");
    const el = page.locator('#test-container wb-tabs, #test-container wb-tabs').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 4: variant=underline', async ({ page }) => {
    await injectAndScan(page, "<wb-tabs variant=\"underline\">Test</wb-tabs>");
    const el = page.locator('#test-container wb-tabs, #test-container wb-tabs').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 5: fullWidth=true', async ({ page }) => {
    await injectAndScan(page, "<wb-tabs fullWidth=\"true\">Test</wb-tabs>");
    const el = page.locator('#test-container wb-tabs, #test-container wb-tabs').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });
});
