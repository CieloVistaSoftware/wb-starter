import { test, expect } from '../fixtures/offline';

/**
 * The Behaviors panel's own theme control (#776, #1018).
 *
 * John, on the live panel: "Add theme control here." A behavior is judged on
 * how it looks, and that depends on the theme. #1018 then ruled "no two theme
 * controls side by side": in normal view the site header's switcher is right
 * there, so the panel's copy is hidden. Fullscreen takes the header with it,
 * and there the panel's copy is the only way to change theme, so it shows.
 *
 * This holds both halves: the control is the framework's own x-themecontrol
 * (built from the real theme list, not a hand-kept <select>), hidden in normal
 * view, and shown by the :fullscreen rule.
 */
test('the live panel carries x-themecontrol: hidden in normal view, shown in fullscreen', async ({ page }) => {
  await page.goto('/?page=behaviors');
  const control = page.locator('#behaviors-live-theme');
  await expect(control).toBeAttached({ timeout: 30_000 });
  await expect(control).toHaveAttribute('x-themecontrol', '');
  await expect(control.locator('select option').first()).toBeAttached({ timeout: 15_000 });
  const themes = await control.locator('select option').count();
  expect(themes, 'built from the real theme list').toBeGreaterThan(5);

  // Normal view: the header switcher is on screen, so this copy is hidden (#1018).
  await expect(control).toBeHidden();

  // Fullscreen: the header is gone, so this copy is the way to change theme.
  const entered = await page.evaluate(async () => {
    const ws = document.getElementById('behaviors-workspace');
    if (!ws?.requestFullscreen) return false;
    try { await ws.requestFullscreen(); return document.fullscreenElement === ws; } catch { return false; }
  });
  if (entered) {
    await expect(control).toBeVisible();
    await page.evaluate(() => document.exitFullscreen());
  } else {
    // A browser that refuses fullscreen here still has to carry the rule.
    const hasRule = await page.evaluate(() => [...document.styleSheets].some((sheet) => {
      try { return [...sheet.cssRules].some((r) => /:fullscreen\s+\.behaviors-live__theme/.test(r.cssText)); } catch { return false; }
    }));
    expect(hasRule, '#behaviors-workspace:fullscreen .behaviors-live__theme rule').toBe(true);
  }
});
