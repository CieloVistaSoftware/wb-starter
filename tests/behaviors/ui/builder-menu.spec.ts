import { test, expect } from '@playwright/test';

test.describe('Builder — File / Recent menu', () => {
  test('opens File menu and renders recent-workspaces from localStorage', async ({ page }) => {
    // seed recent workspaces
    await page.addInitScript(() => {
      localStorage.setItem('wb-recent-workspaces', JSON.stringify(['site-a', 'project-x']));
    });

    await page.goto('/builder.html');

    const fileMenu = page.locator('#menuFile');
    await fileMenu.click();

    await expect(fileMenu).toHaveClass(/open/);

    const recent = page.locator('#recentWorkspaces .menu-action');
    await expect(recent).toHaveCount(2);
    await expect(recent.nth(0)).toHaveText('site-a');
  });

  test('clicking a recent-workspace calls the handler and menu closes', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('wb-recent-workspaces', JSON.stringify(['hello-world']));
      // expose a small hook the page can call so we can assert it ran
      (window as any).__lastLoaded = null;
      (window as any).loadRecentWorkspace = (name) => { (window as any).__lastLoaded = name; };
    });

    await page.goto('/builder.html');
    await page.locator('#menuFile').click();

    const item = page.locator('#recentWorkspaces .menu-action').first();
    await item.click();

    // handler should have been invoked
    const last = await page.evaluate(() => (window as any).__lastLoaded);
    expect(last).toBe('hello-world');

    // menu should close after action
    await expect(page.locator('#menuFile')).not.toHaveClass(/open/);
  });
});
