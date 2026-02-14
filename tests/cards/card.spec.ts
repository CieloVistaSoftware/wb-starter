import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/index.html';

test.describe('Card Behavior (integration)', () => {
  async function injectCard(page: Page, html: string) {
    await page.goto(BASE_URL);
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );
    await page.waitForFunction(
      () => (window as any).WBSite && (window as any).WBSite.currentPage,
      { timeout: 10000 }
    );
    await page.waitForTimeout(100);
    
    await page.evaluate((html: string) => {
      const container = document.createElement('div');
      container.id = 'test-container';
      container.innerHTML = html;
      
      // Force eager loading for tests to avoid IntersectionObserver race conditions
      const elements = container.querySelectorAll('.wb-ready');
      elements.forEach(el => el.setAttribute('', ''));
      
      document.body.appendChild(container);
    }, html);
    
    await page.evaluate(() => {
      (window as any).WB.scan(document.getElementById('test-container'));
    });
    
    // Wait a bit more for the dynamic import to complete
    await page.waitForTimeout(500);
  }

  // BORDER TESTS - All cards must have a border
  test('should have a border on basic card', async ({ page }) => {
    await injectCard(page, '<wb-card>Card with border</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveCSS('border-style', 'solid');
    await expect(card).toHaveCSS('border-width', '1px');
  });

  test('should have a border on cardimage', async ({ page }) => {
    await injectCard(page, '<wb-cardimage data-src="test.jpg" data-title="Test">Content</wb-cardimage>');
    const card = page.locator('#test-container wb-cardimage');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardbutton', async ({ page }) => {
    await injectCard(page, '<wb-cardbutton data-title="Test" data-primary="Click">Content</wb-cardbutton>');
    const card = page.locator('#test-container wb-cardbutton');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardfile', async ({ page }) => {
    await injectCard(page, '<wb-cardfile data-filename="test.pdf" data-type="pdf">Content</wb-cardfile>');
    const card = page.locator('#test-container wb-cardfile');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardhorizontal', async ({ page }) => {
    await injectCard(page, '<wb-cardhorizontal data-title="Test">Content</wb-cardhorizontal>');
    const card = page.locator('#test-container wb-cardhorizontal');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  // CLASS TESTS
  test('should render a basic card with wb-card class', async ({ page }) => {
    await injectCard(page, '<wb-card>Basic card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card/);
  });

  test('should apply wb-card--hoverable by default', async ({ page }) => {
    await injectCard(page, '<wb-card>Hoverable card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--hoverable/);
  });

  test('should not apply wb-card--hoverable if data-hoverable="false"', async ({ page }) => {
    await injectCard(page, '<wb-card data-hoverable="false">Non-hoverable card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).not.toHaveClass(/wb-card--hoverable/);
  });

  test('should apply wb-card--clickable if data-clickable is present', async ({ page }) => {
    await injectCard(page, '<wb-card data-clickable>Clickable card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--clickable/);
  });

  test('should apply wb-card--elevated if data-elevated is present', async ({ page }) => {
    await injectCard(page, '<wb-card data-elevated>Elevated card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--elevated/);
  });

  test('should have base wb-card class without variant modifier when no variant specified', async ({ page }) => {
    await injectCard(page, '<wb-card>Default variant card</wb-card>');
    const card = page.locator('#test-container wb-card');
    // When no variant is specified, card has wb-card but no variant modifier like --default
    await expect(card).toHaveClass(/\bwb-card\b/);
    // Verify it doesn't have a random variant
    await expect(card).not.toHaveClass(/wb-card--info/);
  });

  test('should apply custom variant class if specified', async ({ page }) => {
    await injectCard(page, '<wb-card data-variant="info">Info variant card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--info/);
  });
});
