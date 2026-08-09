import { test, expect } from '@playwright/test';

/**
 * `drawer()` (src/wb-viewmodels/overlay.js) — a slide-out panel + backdrop
 * triggered by a plain click on any element carrying `x-drawer` — had NO
 * auto-inject selector wired in wb-lazy.js at all. `[x-drawer-layout]`
 * (a page-shell layout primitive, a different behavior) was easy to
 * conflate with it, but covers a completely different thing. Every
 * `x-drawer` button in the project (pages/components.html's "← Left" /
 * "Right →" buttons included) silently did nothing on click — confirmed
 * via direct WB.inject() that the behavior itself works fine once actually
 * invoked. No test previously existed for this behavior at all, which is
 * why it went unnoticed.
 */
test.describe('x-drawer auto-injection (drawer behavior)', () => {
  test('components page: "← Left" drawer button actually opens a drawer on click', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'networkidle' });
    const btn = page.locator('button[x-drawer]', { hasText: 'Left' }).first();
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toHaveClass(/wb-drawer/, { timeout: 15000 });
    await btn.click();
    // drawer() appends a backdrop + panel directly to <body>, not a
    // semantic <dialog> — assert by the panel's own rendered title text.
    await expect(page.getByText('Left Drawer', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('components page: "Right →" drawer button opens from the right', async ({ page }) => {
    await page.goto('/?page=components', { waitUntil: 'networkidle' });
    const btn = page.locator('button[x-drawer]', { hasText: 'Right' }).first();
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toHaveClass(/wb-drawer/, { timeout: 15000 });
    await btn.click();
    await expect(page.getByText('Right Drawer', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('playground.html: x-drawer example enhances eagerly and opens on click', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'xbehaviors');
    const btn = page.locator('#pg-preview button[x-drawer]').first();
    await expect(btn).toHaveClass(/wb-drawer/, { timeout: 15000 });
    await btn.click();
    await expect(page.getByText('Settings', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});
