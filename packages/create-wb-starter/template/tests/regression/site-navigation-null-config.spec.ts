import { test, expect } from '@playwright/test';

test.describe('Site navigation config guard', () => {
  test('standalone pages do not throw when navigation runs without config', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/demos/intellisense-check.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);

    expect(errors.filter((message) => message.includes("reading 'navigationMenu'"))).toEqual([]);
  });

  test('configured SPA navigation still loads the requested page', async ({ page }) => {
    await page.goto('/?page=issues');
    await page.waitForFunction(() => (window as any).WBSite?.currentPage === 'issues');

    await expect(page.locator('#mainPage-issues')).toHaveCount(1);
  });
});