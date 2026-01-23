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
      const elements = container.querySelectorAll('[data-wb]');
      elements.forEach(el => el.setAttribute('data-wb-eager', ''));
      
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
    await injectCard(page, '<div wb="card">Card with border</div>');
    const card = page.locator('#test-container [wb="card"]');
    await expect(card).toHaveCSS('border-style', 'solid');
    await expect(card).toHaveCSS('border-width', '1px');
  });

  test('should have a border on cardimage', async ({ page }) => {
    await injectCard(page, '<div wb="cardimage" src="test.jpg" heading="Test">Content</div>');
    const card = page.locator('#test-container [wb="cardimage"]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardbutton', async ({ page }) => {
    await injectCard(page, '<div wb="cardbutton" heading="Test" primary="Click">Content</div>');
    const card = page.locator('#test-container [wb="cardbutton"]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardfile', async ({ page }) => {
    await injectCard(page, '<div wb="cardfile" filename="test.pdf" variant="pdf">Content</div>');
    const card = page.locator('#test-container [wb="cardfile"]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardhorizontal', async ({ page }) => {
    await injectCard(page, '<div wb="cardhorizontal" heading="Test">Content</div>');
    const card = page.locator('#test-container [wb="cardhorizontal"]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  // CLASS TESTS
  test('should render a basic card with wb-card class', async ({ page }) => {
    await injectCard(page, '<div wb="card">Basic card</div>');
    const card = page.locator('#test-container [wb="card"]');
    await expect(card).toHaveClass(/wb-card/);
  });

  test('should apply wb-card--hoverable by default', async ({ page }) => {
    await injectCard(page, '<div wb="card">Hoverable card</div>');
    const card = page.locator('#test-container [wb="card"]');
    await expect(card).toHaveClass(/wb-card--hoverable/);
  });

  test('should not apply wb-card--hoverable if hoverable="false"', async ({ page }) => {
    await injectCard(page, '<div wb="card" hoverable="false">Non-hoverable card</div>');
    const card = page.locator('#test-container [wb="card"]');
    await expect(card).not.toHaveClass(/wb-card--hoverable/);
  });

  test('should apply wb-card--clickable if clickable is present', async ({ page }) => {
    await injectCard(page, '<div wb="card" clickable>Clickable card</div>');
    const card = page.locator('#test-container [wb="card"]');
    await expect(card).toHaveClass(/wb-card--clickable/);
  });

  test('should apply wb-card--elevated if elevated is present', async ({ page }) => {
    await injectCard(page, '<div wb="card" elevated>Elevated card</div>');
    const card = page.locator('#test-container [wb="card"]');
    await expect(card).toHaveClass(/wb-card--elevated/);
  });

  test('should have base wb-card class without variant modifier when no variant specified', async ({ page }) => {
    await injectCard(page, '<div wb="card">Default variant card</div>');
    const card = page.locator('#test-container [wb="card"]');
    // When no variant is specified, card has wb-card but no variant modifier like --default
    await expect(card).toHaveClass(/\bwb-card\b/);
    // Verify it doesn't have a random variant
    await expect(card).not.toHaveClass(/wb-card--info/);
  });

  test('should apply custom variant class if specified', async ({ page }) => {
    await injectCard(page, '<div wb="card" variant="info">Info variant card</div>');
    const card = page.locator('#test-container [wb="card"]');
    await expect(card).toHaveClass(/wb-card--info/);
  });
});
