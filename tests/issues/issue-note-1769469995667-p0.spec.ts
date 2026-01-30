/**
 * Issue: note-1769469995667-p0
 * Title: remove clicked toast in alerts section
 * Goal: clicking an Alerts control should not leave a persistent generic "clicked" toast; specific toasts (success/error) may appear but generic 'clicked' toast must not.
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769469995667-p0 — Alerts: remove generic clicked toast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Alerts section buttons do not produce a generic "clicked" toast', async ({ page }) => {
    // Find the alerts section and its buttons (robust selectors)
    const section = page.locator('section#alerts, section[data-section="alerts"], section:has-text("Alerts")').first();
    await expect(section).toBeVisible();

    const buttons = section.locator('button[x-toast], button[data-action]');
    await expect(buttons).toHaveCountGreaterThan(0);

    // Click each alert button and assert that no generic "clicked" toast remains
    for (let i = 0; i < await buttons.count(); i++) {
      const btn = buttons.nth(i);
      await btn.click();
      // specific toast allowed; generic 'clicked' must not be present
      const generic = page.locator('.toast:has-text("clicked"), .wb-toast:has-text("clicked"), [data-toast]:has-text("click")');
      const genericVisible = await generic.isVisible().catch(() => false);
      expect(genericVisible, `button ${i} should not show generic 'clicked' toast`).toBe(false);
    }
  });
});