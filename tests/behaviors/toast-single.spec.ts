/**
 * One toast per click (issue #144) — the toast behavior must not double-inject
 * its click listener.
 */
import { test, expect, Page } from '@playwright/test';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForSelector('[x-badge], [x-toast]', { timeout: 20000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

test('clicking an x-toast button shows exactly one toast', async ({ page }) => {
  await loadPage(page);
  const btn = page.locator('[x-toast][data-type="success"]').first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(250);
  await expect(page.locator('.wb-toast--success')).toHaveCount(1);
});
