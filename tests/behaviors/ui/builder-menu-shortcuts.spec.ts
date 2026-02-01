import { test, expect } from '@playwright/test';

test.describe('Builder — File menu keyboard & accessibility', () => {
  test('opens and closes File menu with keyboard (Enter / Escape)', async ({ page }) => {
    await page.goto('/builder.html');

    const fileMenu = page.locator('#menuFile');
    // focus the menu and open with Enter
    await fileMenu.focus();
    await page.keyboard.press('Enter');
    await expect(fileMenu).toHaveClass(/open/);

    // close with Escape
    await page.keyboard.press('Escape');
    await expect(fileMenu).not.toHaveClass(/open/);
  });

  test('navigates to recent-workspaces with keyboard and activates item with Enter', async ({ page }) => {
    // seed recent workspaces and a test hook
    await page.addInitScript(() => {
      localStorage.setItem('wb-recent-workspaces', JSON.stringify(['kb-site', 'kb-project']));
      (window as any).__lastLoaded = null;
      (window as any).loadRecentWorkspace = (name) => { (window as any).__lastLoaded = name; };
    });

    await page.goto('/builder.html');

    // open menu via keyboard
    await page.locator('#menuFile').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#menuFile')).toHaveClass(/open/);

    // ensure recent items are rendered
    const recent = page.locator('#recentWorkspaces .menu-action');
    await expect(recent).toHaveCount(2);

    // focus the first recent item and activate via Enter
    await recent.first().focus();
    await page.keyboard.press('Enter');

    const last = await page.evaluate(() => (window as any).__lastLoaded);
    expect(last).toBe('kb-site');

    // menu should close after activation
    await expect(page.locator('#menuFile')).not.toHaveClass(/open/);
  });
});
