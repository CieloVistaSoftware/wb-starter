/**
 * Issue: note-1769469867776-p0
 * Title: card footer missing on components page
 * Goal: ensure component cards include a footer element with expected class/text
 */
import { test, expect } from '@playwright/test';

test.describe('Issue note-1769469867776-p0 — card footer presence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/components.html');
    await page.waitForLoadState('networkidle');
  });

  test('component cards include a footer area', async ({ page }) => {
    const card = page.locator('.card, .wb-card, wb-card').first();
    await expect(card).toBeVisible();
    const footer = card.locator('.card__footer, .wb-card__footer, footer.card__footer');
    const hasFooter = await footer.isVisible().catch(() => false);
    expect(hasFooter, 'card should have a footer element').toBe(true);
  });
});