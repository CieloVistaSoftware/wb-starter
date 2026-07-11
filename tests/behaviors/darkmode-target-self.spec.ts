import { test, expect, Page } from '@playwright/test';

/**
 * x-darkmode with target="self" (found broken while redoing
 * demos/semantics-theme.html to standards): the behavior only special-cased
 * target === 'html'; any other value — including "self" — fell through to
 * document.querySelector(config.target), which for the literal string
 * "self" never matches any real element, so the behavior silently no-opped
 * (console.warn + early return). demos/semantics-theme.html's "Forced
 * Theme" cards had never actually forced anything.
 *
 * Also: the behavior reads a plain `theme` attribute, NOT `data-theme` —
 * the demo previously used data-theme="dark" etc., which is likewise never
 * read.
 */
const BASE_URL = '/demos/test-harness.html';

async function injectAndScan(page: Page, html: string) {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate((h: string) => {
    const container = document.createElement('div');
    container.id = 'darkmode-test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
  }, html);
  await page.locator('#darkmode-test-container').scrollIntoViewIfNeeded();
  await page.evaluate(() => (window as any).WB.scan(document.getElementById('darkmode-test-container')));
  await page.waitForTimeout(400);
}

test.describe('x-darkmode target="self"', () => {
  test('applies the theme attribute to the element itself', async ({ page }) => {
    await injectAndScan(page, '<div id="dm" x-darkmode target="self" theme="cyberpunk">card</div>');
    const el = page.locator('#dm');
    await expect(el).toHaveAttribute('data-theme', 'cyberpunk');
    await expect(el).toHaveClass(/wb-darkmode/);
  });

  test('stays forced even after the global theme changes', async ({ page }) => {
    await injectAndScan(page, '<div id="dm2" x-darkmode target="self" theme="dark">card</div>');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'sunset'));
    await expect(page.locator('#dm2')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sunset');
  });

  test('target="html" (unchanged) still themes the root, not the element', async ({ page }) => {
    await injectAndScan(page, '<div id="dm3" x-darkmode theme="forest">card</div>');
    await expect(page.locator('#dm3')).not.toHaveAttribute('data-theme', 'forest');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
  });
});
