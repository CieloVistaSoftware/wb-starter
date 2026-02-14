/**
 * footer Behavior Tests
 * Auto-generated baseline — verifies render + no console errors
 * Source: src/wb-viewmodels/footer.js
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

test.describe('footer Behavior', () => {

  test('renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    const setupHtml = [
      "<wb-footer>Basic footer content</wb-footer>",
      "<wb-footer sticky>with sticky</wb-footer>",
      "<wb-footer copyright=\"Sample copyright\">copyright=\"Sample copyright\"</wb-footer>",
      "<wb-footer brand=\"Sample brand\">brand=\"Sample brand\"</wb-footer>",
      "<wb-footer links=\"Sample links\">links=\"Sample links\"</wb-footer>",
      "<wb-footer social=\"Sample social\">social=\"Sample social\"</wb-footer>",
      "<wb-footer copyright=\"© 2025 Acme\"></wb-footer>"
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
    const html = "<wb-footer>Basic footer content</wb-footer>";
    await injectAndScan(page, html);
    
    const el = page.locator('#test-container wb-footer, #test-container wb-footer').first();
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

  test('matrix combo 1: copyright=© 2025', async ({ page }) => {
    await injectAndScan(page, "<wb-footer copyright=\"© 2025\">Test</wb-footer>");
    const el = page.locator('#test-container wb-footer, #test-container wb-footer').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 2: brand=Acme, copyright=© 2025', async ({ page }) => {
    await injectAndScan(page, "<wb-footer brand=\"Acme\" copyright=\"© 2025\">Test</wb-footer>");
    const el = page.locator('#test-container wb-footer, #test-container wb-footer').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });

  test('matrix combo 3: copyright=© 2025, sticky=true', async ({ page }) => {
    await injectAndScan(page, "<wb-footer copyright=\"© 2025\" sticky=\"true\">Test</wb-footer>");
    const el = page.locator('#test-container wb-footer, #test-container wb-footer').first();
    await expect(el).toBeVisible({ timeout: 5000 });
  });
});
