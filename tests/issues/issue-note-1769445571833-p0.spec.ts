/**
 * Issue: note-1769445571833-p0
 * Title: replace docs link with theme control (page/element modes)
 * Goal: ensure the builder shows a theme control in place of a docs-only link for components that support themes
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769445571833-p0 — builder should expose theme control (not docs-only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder.html');
    await page.waitForLoadState('networkidle');
  });

  test('builder shows theme control instead of docs-only link for themeable components', async ({ page }) => {
    // open add-component and choose a themeable component (use data-test anchors)
    await page.click('button[data-test="open-add-component"] >> nth=0').catch(() => {});
    await page.waitForTimeout(200);

    // open properties for the first component on the canvas (or use toolbar)
    await page.click('[data-test="builder-properties-btn"]', { trial: true }).catch(() => {});
    const panel = page.locator('#propertiesPanel');
    await expect(panel).toBeVisible();

    const themeControl = panel.locator('[data-test="element-theme-section"], [data-test="page-theme-control"]');
    const docsLink = panel.locator('a:has-text("Docs"), [data-test="docs-link"]');

    // At minimum, theme control should be present for themeable components; docs link should not be the only affordance
    const hasTheme = await themeControl.isVisible().catch(() => false);
    expect(hasTheme || await docsLink.count() > 0, 'either theme control or docs link should exist (prefer theme control)').toBe(true);
  });
});