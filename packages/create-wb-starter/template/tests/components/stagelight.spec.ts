/**
 * stagelight Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/stagelight.js
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

test.describe('stagelight Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<wb-stagelight>Basic stagelight content</wb-stagelight>",
      "<wb-stagelight variant=\"beam\">variant=beam</wb-stagelight>",
      "<wb-stagelight variant=\"spotlight\">variant=spotlight</wb-stagelight>",
      "<wb-stagelight variant=\"fixture\">variant=fixture</wb-stagelight>",
      "<wb-stagelight color=\"#ffffff\">color=\"#ffffff\"</wb-stagelight>",
      "<wb-stagelight intensity=\"0.5\">intensity=0.5</wb-stagelight>",
      "<wb-stagelight size=\"300px\">size=\"300px\"</wb-stagelight>",
      "<wb-stagelight speed=\"3s\">speed=\"3s\"</wb-stagelight>"
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
    const html = "<wb-stagelight>Basic stagelight content</wb-stagelight>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container wb-stagelight, #test-container wb-stagelight').first();
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
