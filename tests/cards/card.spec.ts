import { test, expect, Page } from '@playwright/test';

/**
 * Card Behavior (integration) — Tier 2 Gate Test
 * ================================================
 * Tests base card rendering, class application, and border compliance.
 * Uses setContent with WB init (no SPA dependency).
 */

async function injectCard(page: Page, html: string) {
  await page.goto('/', { waitUntil: 'commit' }); // establish origin so inline /src import resolves
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
    await injectCard(page, '<article>Card with border</article>');
    const card = page.locator('#test-container .x-card');
    await expect(card).toHaveCSS('border-style', 'solid');
    await expect(card).toHaveCSS('border-width', '1px');
  });

  test('should have a border on cardimage', async ({ page }) => {
    await injectCard(page, '<div x-cardimage src="test.jpg" title="Test">Content</div>');
    const card = page.locator('#test-container [x-cardimage]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardbutton', async ({ page }) => {
    await injectCard(page, '<div x-cardbutton title="Test" primary="Click">Content</div>');
    const card = page.locator('#test-container [x-cardbutton]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardfile', async ({ page }) => {
    await injectCard(page, '<div x-cardfile filename="test.pdf" type="pdf">Content</div>');
    const card = page.locator('#test-container [x-cardfile]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  test('should have a border on cardhorizontal', async ({ page }) => {
    await injectCard(page, '<div x-cardhorizontal title="Test">Content</div>');
    const card = page.locator('#test-container [x-cardhorizontal]');
    await expect(card).toHaveCSS('border-style', 'solid');
  });

  // CLASS TESTS
  test('should render a basic card with .x-card class', async ({ page }) => {
    await injectCard(page, '<article>Basic card</article>');
    const card = page.locator('#test-container .x-card');
    await expect(card).toHaveClass(/x-card/);
  });

  test('should apply x-card--hoverable when hoverable attribute present', async ({ page }) => {
    await injectCard(page, '<article hoverable>Hoverable card</article>');
    const card = page.locator('#test-container .x-card');
    await expect(card).toHaveClass(/x-card--hoverable/);
  });

  test('should apply x-card--clickable when clickable attribute present', async ({ page }) => {
    await injectCard(page, '<article clickable>Clickable card</article>');
    const card = page.locator('#test-container .x-card');
    await expect(card).toHaveClass(/x-card--clickable/);
  });

  test('should apply x-card--elevated when elevated attribute present', async ({ page }) => {
    await injectCard(page, '<article elevated>Elevated card</article>');
    const card = page.locator('#test-container .x-card');
    await expect(card).toHaveClass(/x-card--elevated/);
  });

  test('should have base .x-card class without variant modifier when no variant specified', async ({ page }) => {
    await injectCard(page, '<article>Default variant card</article>');
    const card = page.locator('#test-container .x-card');
    await expect(card).toHaveClass(/\bwb-card\b/);
    await expect(card).not.toHaveClass(/x-card--info/);
  });

  test('should apply variant class when variant attribute specified', async ({ page }) => {
    await injectCard(page, '<article variant="glass">Glass variant card</article>');
    const card = page.locator('#test-container .x-card');
    await expect(card).toHaveClass(/x-card--glass/);
  });

  test('should render header when title attribute present', async ({ page }) => {
    await injectCard(page, '<article title="Test Title">Content</article>');
    const card = page.locator('#test-container .x-card');
    const header = card.locator('header');
    await expect(header).toBeVisible();
    const title = card.locator('h3');
    await expect(title).toContainText('Test Title');
  });

  test('should render subtitle when subtitle attribute present', async ({ page }) => {
    await injectCard(page, '<article title="Title" subtitle="Sub">Content</article>');
    const card = page.locator('#test-container .x-card');
    // card.js renders subtitle as <div class="x-card__subtitle"> inside
    // <header> (src/wb-viewmodels/card.js createHeader()), not a <p> —
    // the old selector never matched anything (#317).
    const subtitle = card.locator('header .x-card__subtitle');
    await expect(subtitle).toContainText('Sub');
  });

  test('should render footer when footer attribute present', async ({ page }) => {
    await injectCard(page, '<article footer="Footer text">Content</article>');
    const card = page.locator('#test-container .x-card');
    const footer = card.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Footer text');
  });

  test('should wrap content in main element', async ({ page }) => {
    await injectCard(page, '<article>Inner content</article>');
    const card = page.locator('#test-container .x-card');
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
