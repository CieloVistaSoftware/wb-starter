import { test, expect } from '../fixtures/offline';

/**
 * `drawer()` (src/wb-viewmodels/overlay.js) — a slide-out panel + backdrop
 * triggered by a plain click on any element carrying `x-drawer` — had NO
 * auto-inject selector wired in wb-lazy.js at all. `[x-drawer-layout]`
 * (a page-shell layout primitive, a different behavior) was easy to
 * conflate with it, but covers a completely different thing. Every
 * `x-drawer` button in the project (pages/behaviors.html's "← Left" /
 * "Right →" buttons included) silently did nothing on click — confirmed
 * via direct WB.inject() that the behavior itself works fine once actually
 * invoked. No test previously existed for this behavior at all, which is
 * why it went unnoticed.
 */
test.describe('x-drawer auto-injection (drawer behavior)', () => {
  // These two ran against /?page=behaviors's "← Left"/"Right →" buttons. That
  // page is now a catalogue rendering one example at a time from
  // data/behavior-examples.json (#666), so neither button exists and both tests
  // timed out looking for them. demos/site/overlays.html's Drawer section is
  // where a Left/Right trigger pair lives now; the assertion is unchanged.
  test('overlays page: "Left Drawer" trigger actually opens a drawer on click', async ({ page }) => {
    await page.goto('/demos/site/overlays.html', { waitUntil: 'networkidle' });
    const trigger = page.locator('#drawer-drawer [x-drawer][title="Left Drawer"]');
    // Lazy runtime (#491): the behavior only attaches once near the viewport.
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toHaveAttribute('x-ready', '', { timeout: 15000 });
    await trigger.click();
    // The panel is appended to <body>, not a semantic <dialog> -- assert by
    // the open panel's own rendered title.
    await expect(page.locator('.x-drawer__panel--open .x-drawer__title')).toHaveText('Left Drawer', { timeout: 5000 });
  });

  test('overlays page: "Right Drawer" trigger opens from the right', async ({ page }) => {
    await page.goto('/demos/site/overlays.html', { waitUntil: 'networkidle' });
    const trigger = page.locator('#drawer-drawer [x-drawer][title="Right Drawer"]');
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toHaveAttribute('x-ready', '', { timeout: 15000 });
    await trigger.click();
    const panel = page.locator('.x-drawer__panel--open');
    await expect(panel.locator('.x-drawer__title')).toHaveText('Right Drawer', { timeout: 5000 });
    await expect(panel).toHaveClass(/x-drawer--right/);
  });

  test('playground.html: x-drawer example enhances eagerly and opens on click', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'xbehaviors');
    const btn = page.locator('#pg-preview button[x-drawer]').first();
    await expect(btn).toHaveClass(/x-drawer/, { timeout: 15000 });
    await btn.click();
    await expect(page.getByText('Settings', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});
