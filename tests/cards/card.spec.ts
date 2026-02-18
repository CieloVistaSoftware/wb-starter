import { test, expect, Page } from '@playwright/test';

/**
 * Card Behavior (integration) — Tier 2 Gate Test
 * ================================================
 * Tests base card rendering, class application, and border compliance.
 * Uses setContent with WB init (no SPA dependency).
 */

async function injectCard(page: Page, html: string) {
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en" data-theme="dark">
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="/src/styles/themes.css">
      <link rel="stylesheet" href="/src/styles/site.css">
    </head>
    <body>
      <div id="test-container">${html}</div>
      <script type="module">
        import WB from '/src/core/wb-lazy.js';
        window.WB = WB;
        await WB.init({ autoInject: true });
        window.wbReady = true;
      </script>
    </body>
    </html>
  `, { waitUntil: 'networkidle' });

  await page.waitForFunction(() => (window as any).wbReady === true, { timeout: 10000 });
  await page.waitForTimeout(300);
}

test.describe('Card Behavior (integration)', () => {

  // BORDER TESTS - All cards must have a border
  test('should have a border on basic card', async ({ page }) => {
    await injectCard(page, '<wb-card>Card with border</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveCSS('border-style', 'solid');
    await expect(card).toHaveCSS('border-width', '1px');
  });

  test('should have a border on cardimage', async ({ page }) => {
    await injectCard(page, '<wb-cardimage src="test.jpg" title="Test">Content</wb-cardimage>');
    const card = page.locator('#test-container wb-cardimage');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardbutton', async ({ page }) => {
    await injectCard(page, '<wb-cardbutton title="Test" primary="Click">Content</wb-cardbutton>');
    const card = page.locator('#test-container wb-cardbutton');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardfile', async ({ page }) => {
    await injectCard(page, '<wb-cardfile filename="test.pdf" type="pdf">Content</wb-cardfile>');
    const card = page.locator('#test-container wb-cardfile');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardhorizontal', async ({ page }) => {
    await injectCard(page, '<wb-cardhorizontal title="Test">Content</wb-cardhorizontal>');
    const card = page.locator('#test-container wb-cardhorizontal');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  // CLASS TESTS
  test('should render a basic card with wb-card class', async ({ page }) => {
    await injectCard(page, '<wb-card>Basic card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card/);
  });

  test('should apply wb-card--hoverable when hoverable attribute present', async ({ page }) => {
    await injectCard(page, '<wb-card hoverable>Hoverable card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--hoverable/);
  });

  test('should apply wb-card--clickable when clickable attribute present', async ({ page }) => {
    await injectCard(page, '<wb-card clickable>Clickable card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--clickable/);
  });

  test('should apply wb-card--elevated when elevated attribute present', async ({ page }) => {
    await injectCard(page, '<wb-card elevated>Elevated card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--elevated/);
  });

  test('should have base wb-card class without variant modifier when no variant specified', async ({ page }) => {
    await injectCard(page, '<wb-card>Default variant card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/\bwb-card\b/);
    await expect(card).not.toHaveClass(/wb-card--info/);
  });

  test('should apply variant class when variant attribute specified', async ({ page }) => {
    await injectCard(page, '<wb-card variant="glass">Glass variant card</wb-card>');
    const card = page.locator('#test-container wb-card');
    await expect(card).toHaveClass(/wb-card--glass/);
  });

  test('should render header when title attribute present', async ({ page }) => {
    await injectCard(page, '<wb-card title="Test Title">Content</wb-card>');
    const card = page.locator('#test-container wb-card');
    const header = card.locator('header');
    await expect(header).toBeVisible();
    const title = card.locator('h3');
    await expect(title).toContainText('Test Title');
  });

  test('should render subtitle when subtitle attribute present', async ({ page }) => {
    await injectCard(page, '<wb-card title="Title" subtitle="Sub">Content</wb-card>');
    const card = page.locator('#test-container wb-card');
    const subtitle = card.locator('header p');
    await expect(subtitle).toContainText('Sub');
  });

  test('should render footer when footer attribute present', async ({ page }) => {
    await injectCard(page, '<wb-card footer="Footer text">Content</wb-card>');
    const card = page.locator('#test-container wb-card');
    const footer = card.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Footer text');
  });

  test('should wrap content in main element', async ({ page }) => {
    await injectCard(page, '<wb-card>Inner content</wb-card>');
    const card = page.locator('#test-container wb-card');
    const main = card.locator('main');
    await expect(main).toBeVisible();
    await expect(main).toContainText('Inner content');
  });
});

declare global {
  interface Window {
    wbReady: boolean;
    WB: any;
  }
}
